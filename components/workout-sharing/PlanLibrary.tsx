import { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppButton } from '../AppButton';
import { useLocalization } from '../LocalizationProvider';
import {
  filterPlans,
  parseLibrary,
  PlanLibraryCache,
  type LibraryPlan,
} from '@/lib/workout-sharing/library';
import type { SharingClient } from '@/lib/workout-sharing/client';
import { colors, spacing, typography, radius } from '@/lib/theme';
import { equipmentTaxonomy } from '@/lib/exercise-taxonomy';
import { catalogLabel } from '@/lib/i18n/catalog';
export function PlanLibrary({
  client,
  onSelect,
}: {
  client: SharingClient | null;
  onSelect: (id: string) => void;
}) {
  const { t, locale } = useLocalization();
  const [plans, setPlans] = useState<LibraryPlan[]>([]);
  const [query, setQuery] = useState('');
  const [cached, setCached] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const epoch = useRef(0);
  const [goal, setGoal] = useState('');
  const [experience, setExperience] = useState('');
  const [equipment, setEquipment] = useState('');
  useEffect(() => {
    const id = ++epoch.current;
    const cache = new PlanLibraryCache(AsyncStorage);
    async function load() {
      if (id !== epoch.current) return;
      setLoading(true);
      setError(false);
      try {
        if (!client) throw Error();
        const result = parseLibrary(await client.list());
        if (id !== epoch.current) return;
        setPlans(result);
        setCached(false);
        await cache.write(result);
      } catch {
        const old = await cache.read();
        if (id !== epoch.current) return;
        setPlans(old ?? []);
        setCached(!!old);
        setError(!old);
      } finally {
        if (id === epoch.current) setLoading(false);
      }
    }
    void load();
    const generation = epoch;
    return () => {
      generation.current++;
    };
  }, [client, retry]);
  const filtered = filterPlans(plans, query, locale, {
    goal,
    experience,
    equipment,
  });
  return (
    <View style={s.root}>
      <Text style={s.title}>{t('sharing.library')}</Text>
      <TextInput
        accessibilityLabel={t('sharing.search')}
        placeholder={t('sharing.search')}
        value={query}
        onChangeText={setQuery}
        style={s.input}
      />
      <View style={s.filters}>
        {['', 'build_muscle', 'get_stronger', 'general_fitness'].map((v) => (
          <AppButton
            key={v}
            title={
              v
                ? t(`sharing.goal.${v}` as 'sharing.goal.build_muscle')
                : t('sharing.all')
            }
            selected={goal === v}
            secondary={goal !== v}
            onPress={() => setGoal(v)}
            presentation="text"
          />
        ))}
      </View>
      <View style={s.filters}>
        {['', 'beginner', 'some', 'experienced'].map((v) => (
          <AppButton
            key={v}
            title={
              v
                ? t(`sharing.experience.${v}` as 'sharing.experience.beginner')
                : t('sharing.all')
            }
            selected={experience === v}
            secondary={experience !== v}
            onPress={() => setExperience(v)}
            presentation="text"
          />
        ))}
      </View>
      <View style={s.filters}>
        <AppButton
          title={t('sharing.all')}
          onPress={() => setEquipment('')}
          selected={!equipment}
          presentation="text"
        />
        {equipmentTaxonomy.map((e) => (
          <AppButton
            key={e.id}
            title={catalogLabel(locale, 'equipment', e.id, e.label)}
            selected={equipment === e.id}
            secondary={equipment !== e.id}
            onPress={() => setEquipment(e.id)}
            presentation="text"
          />
        ))}
      </View>
      {loading ? <Text style={s.copy}>{t('sharing.loading')}</Text> : null}
      {cached ? <Text style={s.copy}>{t('sharing.cached')}</Text> : null}
      {error ? (
        <Text accessibilityRole="alert" style={s.copy}>
          {t(client ? 'sharing.error' : 'sharing.unconfigured')}
        </Text>
      ) : null}
      <AppButton
        secondary
        title={t('sharing.retry')}
        onPress={() => setRetry((v) => v + 1)}
        disabled={loading || !client}
      />
      {!loading && !filtered.length ? (
        <Text style={s.copy}>{t('sharing.empty')}</Text>
      ) : null}
      {filtered.map((p) => (
        <View key={p.origin.publicationId} style={s.card}>
          <Text style={s.name}>{p.metadata.title[locale]}</Text>
          <Text style={s.copy}>{p.metadata.description[locale]}</Text>
          <AppButton
            title={t('sharing.open')}
            disabled={loading || cached || !client}
            onPress={() => onSelect(p.origin.publicationId)}
          />
        </View>
      ))}
    </View>
  );
}
const s = StyleSheet.create({
  root: { gap: spacing.md },
  title: { ...typography.title1, color: colors.textPrimary },
  name: { ...typography.headline, color: colors.textPrimary },
  copy: { ...typography.footnote, color: colors.textSecondary },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 44,
  },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  card: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
});
