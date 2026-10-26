import { formatEntryNumber } from '@/lib/i18n/format';
import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../AppButton';
import { useLocalization } from '../LocalizationProvider';
import { catalogLabel } from '@/lib/i18n/catalog';
import { findExercise } from '@/lib/exercise-library';
import type { PlanOrigin, WorkoutTemplate } from '@/lib/workout-model';
import { ExerciseEquipmentRow } from '../ExerciseEquipmentRow';
import type {
  SharedPlan,
  SharedPlanExerciseV2,
} from '@/lib/workout-sharing/contract';
import { colors, spacing, typography, radius } from '@/lib/theme';
export type ImportPlan = (
  plan: SharedPlan,
  origin: PlanOrigin,
  options?: { duplicate?: boolean },
) => Promise<{ template: WorkoutTemplate; created: boolean }>;
export function PlanPreview({
  plan,
  origin,
  onImport,
  onStart,
  onContinue,
  hasActiveWorkout,
  savedTemplate,
  onOpenSaved,
}: {
  plan: SharedPlan;
  origin: PlanOrigin;
  onImport: ImportPlan;
  onStart: (template: WorkoutTemplate) => void;
  onContinue: () => void;
  hasActiveWorkout: boolean;
  savedTemplate?: WorkoutTemplate;
  onOpenSaved?: (template: WorkoutTemplate) => void;
}) {
  const { t, locale } = useLocalization();
  const [saved, setSaved] = useState(savedTemplate);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const flight = useRef(false);
  const add = async (start: boolean, duplicate = false) => {
    if (flight.current) return;
    flight.current = true;
    setBusy(true);
    setError(false);
    try {
      const value =
        saved && !duplicate
          ? saved
          : (await onImport(plan, origin, { duplicate })).template;
      setSaved(value);
      if (start && !hasActiveWorkout) onStart(value);
    } catch {
      setError(true);
    } finally {
      flight.current = false;
      setBusy(false);
    }
  };
  return (
    <View style={s.content}>
      <Text style={s.title}>{plan.title}</Text>
      {plan.exercises.map((entry, index) => {
        const e = entry as SharedPlanExerciseV2;
        const numberOffset = e.exerciseGroup
          ? plan.exercises
              .slice(0, index)
              .reduce(
                (sum, other) =>
                  sum +
                  ((other as SharedPlanExerciseV2).exerciseGroup?.id ===
                  e.exerciseGroup!.id
                    ? other.sets
                    : 0),
                0,
              )
          : 0;
        return (
          <View key={e.exerciseId} style={s.card}>
            {e.exerciseGroup &&
            (plan.exercises[index - 1] as SharedPlanExerciseV2 | undefined)
              ?.exerciseGroup?.id !== e.exerciseGroup.id ? (
              <Text style={s.title}>{e.exerciseGroup.name}</Text>
            ) : null}
            <Text style={s.name}>
              {catalogLabel(
                locale,
                'exercise',
                e.exerciseId,
                findExercise(e.exerciseId)?.name ?? e.exerciseId,
              )}
            </Text>
            {e.exerciseGroup ? (
              <ExerciseEquipmentRow exerciseId={e.exerciseId} />
            ) : null}
            <Text style={s.copy}>{t('sharing.sets', { count: e.sets })}</Text>
            {e.plannedSets?.map((row, i) => (
              <View key={row.id} style={{ gap: spacing.xxs }}>
                <Text style={s.copy}>
                  {t('entry.title', { index: numberOffset + i + 1 })}
                </Text>
                {row.weight !== undefined ? (
                  <Text style={s.copy}>
                    {t('sharing.weight', {
                      weight: formatEntryNumber(locale, row.weight),
                    })}
                  </Text>
                ) : null}
                {row.reps !== undefined ? (
                  <Text style={s.copy}>
                    {t('workout.tableReps')}:{' '}
                    {formatEntryNumber(locale, row.reps)}
                  </Text>
                ) : null}
              </View>
            ))}
            {e.target ? (
              <Text style={s.copy}>
                {t('sharing.targetRange', {
                  min: e.target.repMin,
                  max: e.target.repMax,
                  restMin: e.target.restMin,
                  restMax: e.target.restMax,
                })}
              </Text>
            ) : null}
            {e.target?.perSide ? (
              <Text style={s.copy}>{t('sharing.perSide')}</Text>
            ) : null}
            {e.weightKg !== undefined ? (
              <Text style={s.copy}>
                {t('sharing.weight', {
                  weight: formatEntryNumber(locale, e.weightKg),
                })}
              </Text>
            ) : null}
          </View>
        );
      })}
      <Text style={s.copy}>{t('sharing.copy')}</Text>
      {saved ? <Text style={s.copy}>{t('sharing.savedInfo')}</Text> : null}
      {error ? (
        <Text accessibilityRole="alert" style={s.copy}>
          {t('sharing.error')}
        </Text>
      ) : null}
      {hasActiveWorkout ? (
        <>
          <Text style={s.copy}>{t('sharing.active')}</Text>
          <AppButton
            title={t('sharing.continue')}
            onPress={onContinue}
            disabled={busy}
          />
        </>
      ) : (
        <AppButton
          title={t(saved ? 'sharing.startSaved' : 'sharing.addStart')}
          onPress={() => void add(true)}
          disabled={busy}
        />
      )}
      <AppButton
        title={t(saved ? 'sharing.openSaved' : 'sharing.save')}
        onPress={() => (saved ? onOpenSaved?.(saved) : void add(false))}
        disabled={busy || (!!saved && !onOpenSaved)}
        secondary
      />
      {saved ? (
        <AppButton
          title={t('sharing.another')}
          onPress={() => void add(false, true)}
          disabled={busy}
          secondary
        />
      ) : null}
    </View>
  );
}
const s = StyleSheet.create({
  content: { gap: spacing.md },
  title: { ...typography.title1, color: colors.textPrimary },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  name: { ...typography.headline, color: colors.textPrimary },
  copy: { ...typography.footnote, color: colors.textSecondary },
});
