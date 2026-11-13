import { useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { canonicalExerciseId } from '@/lib/exercise-library';
import {
  defaultExerciseEquipment,
  exerciseEquipmentCatalog,
  parseExerciseEquipment,
} from '@/lib/exercise-equipment-catalog';
import { resolveAttachmentArtwork } from '@/lib/exercise-artwork';
import { catalogLabel } from '@/lib/i18n/catalog';
import { colors, radius, spacing, typography } from '@/lib/theme';
import { AppScrollView } from './AppScrollView';
import { KettlebellCatalogArtwork } from './KettlebellCatalogArtwork';
import { useLocalization } from './LocalizationProvider';

const catalogArtwork: Record<string, ImageSourcePropType | undefined> = {
  'short-straight-bar': require('../assets/equipment/short-straight-bar.webp'),
  rope: require('../assets/equipment/triceps-rope.webp'),
  'single-handle': require('../assets/equipment/single-d-handle.webp'),
  'ankle-strap': require('../assets/equipment/ankle-strap.webp'),
  dumbbell: require('../assets/equipment/dumbbells.webp'),
  barbell: require('../assets/equipment/barbell.webp'),
  'ez-bar': require('../assets/equipment/ez-bar.webp'),
  bench: require('../assets/equipment/bench.webp'),
  'step-platform': require('../assets/equipment/step-platform.webp'),
};

export function ExerciseEquipmentCatalog({
  exerciseId,
}: {
  exerciseId: string;
}) {
  const { t, locale } = useLocalization();
  const key = `cresum:exercise-equipment:${canonicalExerciseId(exerciseId) ?? exerciseId}`;
  const defaults = defaultExerciseEquipment(exerciseId);
  const [draft, setDraft] = useState<string[] | null>(null);
  const [opening, setOpening] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const title = t('equipment.catalog');

  async function open() {
    setError(false);
    setOpening(true);
    try {
      const { default: AsyncStorage } =
        await import('@react-native-async-storage/async-storage');
      setDraft(
        parseExerciseEquipment(await AsyncStorage.getItem(key)) ?? defaults,
      );
    } catch {
      setError(true);
    } finally {
      setOpening(false);
    }
  }

  async function save() {
    if (!draft || saving) return;
    setError(false);
    setSaving(true);
    try {
      const { default: AsyncStorage } =
        await import('@react-native-async-storage/async-storage');
      if (
        draft.length === defaults.length &&
        defaults.every((id) => draft.includes(id))
      ) {
        await AsyncStorage.removeItem(key);
      } else {
        await AsyncStorage.setItem(key, JSON.stringify(draft));
      }
      setDraft(null);
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  const close = () => {
    if (!saving) setDraft(null);
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        onPress={open}
        disabled={opening}
        style={s.row}
      >
        <Text style={s.title}>{title}</Text>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.textSecondary}
        />
      </Pressable>
      {error && draft === null ? (
        <Text accessibilityRole="alert">{t('equipment.unavailable')}</Text>
      ) : null}
      {draft !== null ? (
        <Modal visible transparent animationType="slide" onRequestClose={close}>
          <View style={s.overlay}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={close}
              accessibilityLabel={t('equipment.close')}
            />
            <SafeAreaView
              edges={['bottom', 'left', 'right']}
              style={s.sheet}
              accessibilityViewIsModal
            >
              <Text accessibilityRole="header" style={s.title}>
                {title}
              </Text>
              <Text style={s.detail}>{t('equipment.personalSelection')}</Text>
              <AppScrollView>
                {exerciseEquipmentCatalog.map((item) => {
                  const attachment =
                    'artworkVariant' in item ? item.artworkVariant : undefined;
                  const source =
                    catalogArtwork[item.id] ??
                    (attachment ? resolveAttachmentArtwork(attachment) : null);
                  const name =
                    'messageKey' in item
                      ? t(item.messageKey)
                      : catalogLabel(locale, 'equipment', item.id, item.label);
                  const checked = draft.includes(item.id);
                  return (
                    <Pressable
                      key={item.id}
                      style={s.row}
                      disabled={saving}
                      accessibilityRole="checkbox"
                      accessibilityLabel={name}
                      accessibilityState={{ checked }}
                      onPress={() =>
                        setDraft((current) =>
                          current?.includes(item.id)
                            ? current.filter((id) => id !== item.id)
                            : [...(current ?? []), item.id],
                        )
                      }
                    >
                      {item.id === 'kettlebell' ? (
                        <KettlebellCatalogArtwork size={s.image.width} />
                      ) : source ? (
                        <Image
                          source={source}
                          resizeMode="contain"
                          style={s.image}
                        />
                      ) : null}
                      <View style={s.copy}>
                        <Text style={s.title}>{name}</Text>
                        {defaults.includes(item.id) ? (
                          <Text style={s.detail}>
                            {t('equipment.illustratedDefault')}
                          </Text>
                        ) : null}
                      </View>
                      <Ionicons
                        name={checked ? 'checkbox' : 'square-outline'}
                        size={24}
                        color={colors.primary}
                      />
                    </Pressable>
                  );
                })}
              </AppScrollView>
              {error ? (
                <Text accessibilityRole="alert">
                  {t('equipment.saveError')}
                </Text>
              ) : null}
              <View style={s.row}>
                <Pressable
                  accessibilityRole="button"
                  onPress={close}
                  disabled={saving}
                >
                  <Text style={s.title}>{t('equipment.cancel')}</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setDraft(defaults)}
                  disabled={saving}
                >
                  <Text style={s.detail}>
                    {t('equipment.illustratedDefault')}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={save}
                  disabled={saving}
                >
                  <Text style={s.title}>{t('equipment.save')}</Text>
                </Pressable>
              </View>
            </SafeAreaView>
          </View>
        </Modal>
      ) : null}
    </>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.scrim,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    maxHeight: '85%',
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    minHeight: 48,
  },
  copy: { flex: 1 },
  title: { ...typography.headline, color: colors.textPrimary },
  detail: { ...typography.footnote, color: colors.textSecondary },
  image: { width: 48, height: 48 },
});
