import { LocalizedText as Text } from './LayoutDirection';
import { createThemedStyles } from './AppThemeProvider';
import { GlassCard } from './GlassCard';
import { AppButton } from './AppButton';
import { useLocalization } from './LocalizationProvider';
import { catalogLabel } from '@/lib/i18n/catalog';
import { findExercise } from '@/lib/exercise-library';
import { muscleLabel, type MuscleId } from '@/lib/exercise-taxonomy';
import { spacing, typography } from '@/lib/theme';
import type { LibraryExercise } from '@/lib/workout-model';

const examples = {
  chest: 'barbell-bench-press',
  'upper-back': 'seated-cable-row',
  lats: 'lat-pulldown',
  traps: 'dumbbell-shrug',
  'front-delts': 'dumbbell-shoulder-press',
  'side-delts': 'dumbbell-lateral-raise',
  'rear-delts': 'reverse-pec-deck',
  biceps: 'dumbbell-biceps-curl',
  triceps: 'cable-triceps-pushdown',
  forearms: 'hammer-curl',
  abs: 'cable-crunch',
  'lower-back': 'back-extension',
  glutes: 'barbell-hip-thrust',
  quadriceps: 'leg-extension',
  hamstrings: 'seated-leg-curl',
  calves: 'standing-calf-raise',
  adductors: 'machine-hip-adduction',
} satisfies Record<MuscleId, string>;

export function MuscleFunction({
  id,
  showName,
  onExample,
}: {
  id: MuscleId;
  showName?: boolean;
  onExample?: (exercise: LibraryExercise) => void;
}) {
  const s = useStyles();
  const { locale, t } = useLocalization();
  const exercise = onExample ? findExercise(examples[id]) : undefined;
  return (
    <GlassCard style={s.card}>
      <Text style={s.title} accessibilityRole="header">
        {showName
          ? catalogLabel(locale, 'muscle', id, muscleLabel(id))
          : t('muscle.function')}
      </Text>
      <Text style={s.copy}>{t(`muscle.action.${id}`)}</Text>
      {exercise && onExample ? (
        <AppButton
          title={catalogLabel(locale, 'exercise', exercise.id, exercise.name)}
          presentation="text"
          onPress={() => onExample(exercise)}
        />
      ) : null}
    </GlassCard>
  );
}

const useStyles = createThemedStyles((colors) => ({
  card: { gap: spacing.xs },
  title: { ...typography.headline, color: colors.textPrimary },
  copy: { ...typography.subheadline, color: colors.textSecondary },
}));
