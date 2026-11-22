import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { LocalizedText as Text, DirectionalIcon } from './LayoutDirection';
import { createThemedStyles, useAppColors } from './AppThemeProvider';
import { AppScrollView } from './AppScrollView';
import { GlassCard } from './GlassCard';
import { MuscleRole } from './MuscleGuide';
import { MuscleDisclosure, MuscleSegments } from './MusclePageControls';
import { useLocalization } from './LocalizationProvider';
import {
  groupsForArea,
  type MuscleArea,
} from '@/lib/muscle-exercise-discovery';
import { muscleLabel, type MuscleId } from '@/lib/exercise-taxonomy';
import type { MuscleParticipation } from '@/lib/muscle-participation';
import { catalogLabel } from '@/lib/i18n/catalog';
import { formatNumber } from '@/lib/i18n/format';
import { spacing, typography } from '@/lib/theme';

export function MuscleSetCatalog({
  muscles,
  period,
  onBack,
  onSelect,
}: {
  muscles: MuscleParticipation['muscles'];
  period: string;
  onBack: () => void;
  onSelect: (id: MuscleId) => void;
}) {
  const [area, setArea] = useState<MuscleArea>('upper');
  const [expanded, setExpanded] = useState<string>();
  const s = useStyles();
  const colors = useAppColors();
  const { t, locale } = useLocalization();
  return (
    <AppScrollView
      branded
      dockAware
      back={{ onPress: onBack }}
      contentContainerStyle={s.content}
    >
      <Text style={s.title} accessibilityRole="header">
        {t('muscle.setsByMuscle')}
      </Text>
      <Text style={s.note}>{period}</Text>
      <MuscleSegments
        options={{
          upper: t('muscle.area.upper'),
          core: t('muscle.area.core'),
          lower: t('muscle.area.lower'),
        }}
        value={area}
        onChange={(next) => {
          setArea(next);
          setExpanded(undefined);
        }}
      />
      <GlassCard style={s.card}>
        {groupsForArea(area).map(({ label, muscles: ids }, index) => {
          const open = expanded === label;
          return (
            <View key={label} style={index > 0 && s.separator}>
              <MuscleDisclosure
                label={t(`muscle.group.${label}`)}
                expanded={open}
                onPress={() => setExpanded(open ? undefined : label)}
              />
              {open
                ? ids.map((id) => {
                    const item = muscles.find((muscle) => muscle.id === id)!;
                    const name = catalogLabel(
                      locale,
                      'muscle',
                      id,
                      muscleLabel(id),
                    );
                    const { primary, secondary } = item;
                    return (
                      <Pressable
                        key={id}
                        accessibilityRole="button"
                        accessibilityLabel={t('muscle.rowA11y', {
                          name,
                          primary,
                          secondary,
                        })}
                        onPress={() => onSelect(id)}
                        style={({ pressed }) => [s.row, pressed && s.pressed]}
                      >
                        <Text style={s.name}>{name}</Text>
                        <View style={s.counts}>
                          <View style={s.count}>
                            <View
                              style={[
                                s.dot,
                                { backgroundColor: colors.musclePrimary },
                              ]}
                            />
                            <Text style={s.number}>
                              {formatNumber(locale, primary)}
                            </Text>
                          </View>
                          <View style={s.count}>
                            <View
                              style={[
                                s.dot,
                                { backgroundColor: colors.muscleSecondary },
                              ]}
                            />
                            <Text style={s.number}>
                              {formatNumber(locale, secondary)}
                            </Text>
                          </View>
                        </View>
                        <DirectionalIcon
                          name="chevron-forward"
                          size={16}
                          color={colors.primary}
                          accessible={false}
                        />
                      </Pressable>
                    );
                  })
                : null}
            </View>
          );
        })}
      </GlassCard>
      <View style={s.legend}>
        <MuscleRole role="primary" />
        <MuscleRole role="secondary" />
      </View>
    </AppScrollView>
  );
}

const useStyles = createThemedStyles((colors) => ({
  content: { padding: spacing.lg, gap: spacing.md },
  title: { ...typography.largeTitle, color: colors.textPrimary },
  note: { ...typography.subheadline, color: colors.textSecondary },
  card: { gap: 0 },
  separator: { borderTopWidth: 1, borderTopColor: colors.separator },
  row: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.separator,
  },
  name: {
    ...typography.subheadline,
    color: colors.textPrimary,
    flex: 1,
    minWidth: 0,
  },
  counts: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  count: {
    minWidth: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  number: {
    ...typography.footnote,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pressed: { opacity: 0.65 },
}));
