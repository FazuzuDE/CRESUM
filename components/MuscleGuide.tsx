import { View } from 'react-native';
import { LocalizedText as Text } from './LayoutDirection';
import { createThemedStyles, useAppColors } from './AppThemeProvider';
import { AppScrollView } from './AppScrollView';
import { GlassCard } from './GlassCard';
import { MuscleMap } from './MuscleMap';
import { useLocalization } from './LocalizationProvider';
import { catalogLabel } from '@/lib/i18n/catalog';
import { findExercise } from '@/lib/exercise-library';
import { muscleLabel } from '@/lib/exercise-taxonomy';
import { spacing, typography } from '@/lib/theme';

const example = findExercise('barbell-bench-press')!;
const roleIds = {
  primary: example.primaryMuscles,
  secondary: example.secondaryMuscles,
};
const exampleMuscles = [
  ...roleIds.primary.map((id) => ({ id, primary: 1, secondary: 0 })),
  ...roleIds.secondary
    .filter((id) => !roleIds.primary.includes(id))
    .map((id) => ({ id, primary: 0, secondary: 1 })),
];

export function MuscleRole({
  role,
}: {
  role: 'primary' | 'secondary' | 'neutral';
}) {
  const { t } = useLocalization();
  const colors = useAppColors();
  const s = useStyles();
  const fill = {
    primary: colors.musclePrimary,
    secondary: colors.muscleSecondary,
    neutral: colors.muscleNeutral,
  };
  return (
    <View style={s.role}>
      <View style={[s.dot, { backgroundColor: fill[role] }]} />
      <Text style={s.note}>
        {t(role === 'neutral' ? 'muscle.guideNoSets' : `muscle.${role}`)}
      </Text>
    </View>
  );
}

export function MuscleGuide({ onBack }: { onBack: () => void }) {
  const { t, locale } = useLocalization();
  const s = useStyles();
  return (
    <AppScrollView
      branded
      dockAware
      back={{ onPress: onBack }}
      contentContainerStyle={s.content}
    >
      <Text style={s.title} accessibilityRole="header">
        {t('muscle.readMap')}
      </Text>
      <GlassCard style={s.card}>
        <Text style={s.heading} accessibilityRole="header">
          {catalogLabel(locale, 'exercise', example.id, example.name)}
        </Text>
        <Text style={s.note}>{t('muscle.guideExample')}</Text>
        <MuscleMap muscles={exampleMuscles} height={230} />
        {(['primary', 'secondary'] as const).map((role) => (
          <View key={role} style={s.roleBlock}>
            <MuscleRole role={role} />
            <Text style={s.copy}>
              {roleIds[role]
                .map((id) =>
                  catalogLabel(locale, 'muscle', id, muscleLabel(id)),
                )
                .join(' · ')}
            </Text>
          </View>
        ))}
        <MuscleRole role="neutral" />
      </GlassCard>
      <Text style={s.copy}>{t('muscle.guideCount')}</Text>
      <Text style={s.copy}>{t('muscle.shortMeaning')}</Text>
    </AppScrollView>
  );
}

const useStyles = createThemedStyles((colors) => ({
  content: { padding: spacing.lg, gap: spacing.md },
  title: { ...typography.largeTitle, color: colors.textPrimary },
  heading: { ...typography.headline, color: colors.textPrimary },
  card: { gap: spacing.sm },
  roleBlock: { gap: spacing.xxs },
  role: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dot: { width: spacing.xs, height: spacing.xs, borderRadius: spacing.xs },
  note: { ...typography.footnote, color: colors.textSecondary, flexShrink: 1 },
  copy: { ...typography.subheadline, color: colors.textSecondary },
}));
