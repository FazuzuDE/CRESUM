import { Pressable, Text, View } from 'react-native';
import { useLocalization } from './LocalizationProvider';
import { ExerciseEquipmentRow } from './ExerciseEquipmentRow';
import { ExerciseArtwork } from './ExerciseArtwork';
import { AppButton } from './AppButton';
import { workoutStyles as s } from './workout-styles';
import { setNumberInGroup } from '@/lib/exercise-groups';
import { formatEntryNumber, formatNumber } from '@/lib/i18n/format';
import { findExercise } from '@/lib/exercise-library';
import { exerciseIdsMatch, addSet } from '@/lib/workout-engine';
import {
  isSetComplete,
  type WorkoutSession,
  type LibraryExercise,
} from '@/lib/workout-model';
import { spacing } from '@/lib/theme';
export function ExerciseAttachmentBlock({
  session,
  index,
  history,
  busy,
  update,
  onEdit,
  onTechnique,
  onToggle,
  onRemove,
}: {
  session: WorkoutSession;
  index: number;
  history: WorkoutSession[];
  busy: boolean;
  update: (transform: (session: WorkoutSession) => WorkoutSession) => void;
  onEdit: (entry: {
    sessionId: string;
    exerciseId: string;
    setId: string;
  }) => void;
  onTechnique: (exercise: LibraryExercise | null) => void;
  onToggle: (index: number) => void;
  onRemove: (index: number) => void;
}) {
  const { t, locale } = useLocalization();
  const exercise = session.exercises[index];
  const previous = history
    .flatMap((item) => item.exercises)
    .find((item) => exerciseIdsMatch(item.libraryId, exercise.libraryId))
    ?.sets.filter(isSetComplete);
  const toggle = onToggle,
    remove = onRemove;
  return (
    <View style={{ gap: spacing.xs }}>
      <ExerciseEquipmentRow exerciseId={exercise.libraryId} />
      <View style={s.exerciseHeading}>
        <Text style={[s.heading, s.exerciseName]} accessibilityRole="header">
          {exercise.name}
        </Text>
        {findExercise(exercise.libraryId) ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('library.techniqueFor', {
              name: exercise.name,
            })}
            onPress={() =>
              onTechnique(findExercise(exercise.libraryId) ?? null)
            }
            style={s.techniqueEntry}
          >
            <ExerciseArtwork
              imageKey={findExercise(exercise.libraryId)!.imageKey}
              size={76}
            />
            <Text style={s.techniqueLabel}>{t('library.technique')}</Text>
          </Pressable>
        ) : null}
      </View>
      <Text style={s.previous}>
        {previous?.length
          ? t('workout.last', {
              summary: previous
                .map((set) =>
                  set.otherSideReps === undefined
                    ? t('entry.singleSummary', {
                        weight: formatEntryNumber(locale, set.weight),
                        reps: formatEntryNumber(locale, set.reps),
                      })
                    : t('entry.bilateralSummary', {
                        weight: formatEntryNumber(locale, set.weight),
                        reps: formatEntryNumber(locale, set.reps),
                        other: formatEntryNumber(locale, set.otherSideReps),
                      }),
                )
                .join(' · '),
            })
          : t('workout.first')}
      </Text>
      {exercise.target ? (
        <View style={{ gap: spacing.sm }}>
          <Text style={s.previous}>
            {t(
              exercise.target.perSide
                ? 'workout.targetPerSide'
                : 'workout.target',
              {
                min: formatNumber(locale, exercise.target.repMin),
                max: formatNumber(locale, exercise.target.repMax),
                restMin: formatNumber(locale, exercise.target.restMin),
                restMax: formatNumber(locale, exercise.target.restMax),
              },
            )}
          </Text>
          <Text style={s.previous}>{t('workout.warmup')}</Text>
          <AppButton
            title={t('workout.changeRest', {
              seconds: formatNumber(
                locale,
                session.restOverrideSeconds ?? exercise.target.restMin,
              ),
            })}
            secondary
            disabled={busy}
            onPress={() =>
              update((current) => ({
                ...current,
                restOverrideSeconds:
                  (current.restOverrideSeconds ?? exercise.target!.restMin) ===
                  exercise.target!.restMin
                    ? exercise.target!.restMax
                    : exercise.target!.restMin,
              }))
            }
          />
        </View>
      ) : null}
      {exercise.libraryId === 'bodyweight-step-up' ? (
        <Text style={s.previous}>{t('workout.stepUp')}</Text>
      ) : null}
      <View style={s.tableHeader}>
        <Text style={s.number} accessibilityLabel={t('workout.tableSet')}>
          #
        </Text>
        <Text style={s.column}>{t('workout.tableKg')}</Text>
        <Text style={s.column}>{t('workout.tableReps')}</Text>
        <Text style={s.number} accessibilityLabel={t('workout.tableDone')}>
          ✓
        </Text>
      </View>
      {exercise.sets.map((set, i) => {
        const done = isSetComplete(set);
        return (
          <View key={set.id} style={s.setRow}>
            <Pressable
              style={({ pressed }) => [s.target, pressed && s.dim]}
              disabled={busy || exercise.sets.length === 1}
              accessibilityLabel={t('workout.removeNamed', {
                index: setNumberInGroup(session, index, i),
              })}
              accessibilityHint={t('workout.confirmHint')}
              onPress={() => remove(i)}
            >
              <Text style={s.setNumber}>
                {setNumberInGroup(session, index, i)}
              </Text>
            </Pressable>
            {[
              { field: 'weight', value: set.weight, placeholder: '0' },
              {
                field:
                  set.otherSideReps === undefined
                    ? 'repetitions'
                    : 'left repetitions',
                value: set.reps,
                placeholder: t(
                  set.otherSideReps === undefined
                    ? 'entry.phReps'
                    : 'entry.phLeft',
                ),
              },
              ...(set.otherSideReps === undefined
                ? []
                : [
                    {
                      field: 'right repetitions',
                      value: set.otherSideReps,
                      placeholder: t('entry.phRight'),
                    },
                  ]),
            ].map((cell) => (
              <Pressable
                key={cell.field}
                accessibilityRole="button"
                accessibilityLabel={t(
                  cell.field === 'weight'
                    ? 'workout.editWeight'
                    : cell.field === 'right repetitions'
                      ? 'workout.editRight'
                      : cell.field === 'left repetitions'
                        ? 'workout.editLeft'
                        : 'workout.editReps',
                  { index: setNumberInGroup(session, index, i) },
                )}
                accessibilityValue={{
                  text: cell.value
                    ? formatEntryNumber(locale, cell.value)
                    : t('workout.notEntered'),
                }}
                accessibilityState={{ disabled: done || busy }}
                disabled={done || busy}
                style={[s.input, s.valueCell, done && s.completed]}
                onPress={() =>
                  onEdit({
                    sessionId: session.id,
                    exerciseId: exercise.id,
                    setId: set.id,
                  })
                }
              >
                <Text style={s.valueText}>
                  {cell.value
                    ? formatEntryNumber(locale, cell.value)
                    : cell.placeholder}
                </Text>
              </Pressable>
            ))}
            <Pressable
              accessibilityRole="checkbox"
              accessibilityLabel={t('workout.completeNamed', {
                index: setNumberInGroup(session, index, i),
              })}
              accessibilityState={{ checked: done, disabled: busy }}
              disabled={busy}
              onPress={() => toggle(i)}
              style={({ pressed }) => [
                s.target,
                s.check,
                done && s.checked,
                (pressed || busy) && s.dim,
              ]}
            >
              <Text style={[s.checkText, done && s.checkedText]}>
                {done ? '✓' : '○'}
              </Text>
            </Pressable>
          </View>
        );
      })}
      <AppButton
        title={t('workout.addSet')}
        secondary
        disabled={busy || exercise.sets.length >= 20}
        onPress={() => update((current) => addSet(current, index))}
      />
    </View>
  );
}
