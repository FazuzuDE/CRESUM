import { useState } from 'react';
import { LocalizedText as Text } from './LayoutDirection';
import { AppButton } from './AppButton';
import { GlassDialog } from './GlassDialog';
import { ContentScrollView } from './ContentScrollView';
import { useWorkoutStyles } from './workout-styles';
import { useLocalization } from './LocalizationProvider';
import { parseOptionalRest, RestSecondsInput } from './RestSecondsInput';
import { formatEntryNumber, formatNumber } from '@/lib/i18n/format';
import { findExercise } from '@/lib/exercise-library';
import { restSecondsForExercise, toggleTargetRest } from '@/lib/workout-engine';
import { spacing } from '@/lib/theme';
import type { WorkoutExercise, WorkoutSession } from '@/lib/workout-model';

export type SaveExerciseRest = (
  sessionId: string,
  exerciseId: string,
  seconds: number | undefined,
) => Promise<boolean>;

export function ExerciseRestControls({
  session,
  exercise,
  preference,
  busy,
  update,
  save: savePreference,
}: {
  session: WorkoutSession;
  exercise: WorkoutExercise;
  preference?: number;
  busy: boolean;
  update: (transform: (session: WorkoutSession) => WorkoutSession) => void;
  save?: SaveExerciseRest;
}) {
  const s = useWorkoutStyles();
  const { t, locale } = useLocalization();
  const [input, setInput] = useState<string>();
  const [failed, setFailed] = useState(false);
  const save = findExercise(exercise.libraryId) ? savePreference : undefined;
  const label = t('workout.exerciseRestDefault');
  const effective = restSecondsForExercise(session, exercise, preference);
  const close = () => {
    if (!busy) setInput(undefined);
  };
  const seconds = parseOptionalRest(input ?? '');
  return (
    <>
      {exercise.plannedRestSeconds !== undefined ? (
        <Text style={s.previous}>
          {t('editor.restSeconds')}{' '}
          {formatNumber(locale, exercise.plannedRestSeconds)}
        </Text>
      ) : null}
      {exercise.target &&
      exercise.target.restMin !== exercise.target.restMax ? (
        <AppButton
          title={t('workout.changeRest', {
            seconds: formatNumber(locale, effective),
          })}
          secondary
          disabled={busy}
          onPress={() =>
            update((current) =>
              current.id === session.id
                ? toggleTargetRest(current, exercise.id)
                : current,
            )
          }
        />
      ) : null}
      {save ? (
        <AppButton
          title={label}
          value={formatNumber(
            locale,
            preference ??
              session.baseRestSeconds ??
              session.restDurationSeconds,
          )}
          presentation="settings"
          disabled={busy}
          onPress={() => {
            setFailed(false);
            setInput(
              preference === undefined
                ? ''
                : formatEntryNumber(locale, String(preference)),
            );
          }}
        />
      ) : null}
      {save && input !== undefined ? (
        <GlassDialog onClose={close} avoidKeyboard>
          <ContentScrollView
            style={{ flexGrow: 0, flexShrink: 1 }}
            contentContainerStyle={{ gap: spacing.sm }}
            keyboardShouldPersistTaps="handled"
          >
            <RestSecondsInput
              label={label}
              value={input}
              onChange={(value) => {
                setInput(value);
                setFailed(false);
              }}
              disabled={busy}
            />
            {failed ? (
              <Text accessibilityRole="alert" style={s.error}>
                {t('error.workoutOperation')}
              </Text>
            ) : null}
            <AppButton
              title={busy ? t('workout.saving') : t('common.done')}
              disabled={busy || seconds === null}
              onPress={() => {
                if (seconds === null) return;
                void save(session.id, exercise.id, seconds).then((saved) => {
                  if (saved) setInput(undefined);
                  else setFailed(true);
                });
              }}
            />
            <AppButton
              title={t('common.cancel')}
              onPress={close}
              disabled={busy}
              secondary
            />
          </ContentScrollView>
        </GlassDialog>
      ) : null}
    </>
  );
}
