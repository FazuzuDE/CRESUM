import type { SetWriteMarker } from '@/lib/workout-store';
import { CardioCountdown } from './CardioCountdown';
import { cardioExerciseIds, isCardioExerciseId } from '@/lib/cardio-timer';
import { useAppColors } from '@/components/AppThemeProvider';
import {
  LocalizedText as Text,
  DirectionalIcon as Ionicons,
} from '@/components/LayoutDirection';
import { ExerciseEquipmentCatalog } from './ExerciseEquipmentCatalog';
import { useWorkoutStyles } from './workout-styles';
import { ExerciseAttachmentBlock } from './ExerciseAttachmentBlock';
import {
  ExerciseRestControls,
  type SaveExerciseRest,
} from './ExerciseRestControls';
import { ExerciseGroupComposer } from './ExerciseGroupComposer';
import { equipmentPolicyFor } from '@/lib/exercise-equipment';
import { projectExerciseGroups, setNumberInGroup } from '@/lib/exercise-groups';
import { useLocalization } from './LocalizationProvider';
import { catalogLabel, workoutExerciseLabel } from '@/lib/i18n/catalog';
import { formatEntryNumber, formatNumber } from '@/lib/i18n/format';
import { presentAppError } from '@/lib/i18n/errors';
import { AppScrollView } from './AppScrollView';
import { useEffect, useState } from 'react';
import {
  AppState,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { GlassCard } from './GlassCard';
import { AppButton } from './AppButton';
import { Confirmation } from './Confirmation';
import { GlassDialog } from './GlassDialog';
import { ContentScrollView } from './ContentScrollView';
import { ExerciseLibraryAction } from './ExerciseLibraryAction';
import { ExerciseLibrary } from './ExerciseLibrary';
import { ExerciseTechnique } from './ExerciseTechnique';
import { ExerciseArtwork } from './ExerciseArtwork';
import { ProgramTimedActivities } from './StarterProgramReview';
import type {
  CardioGuidance,
  ProgramHold,
} from '@/lib/training-programs/model';
import { SetEntrySheet } from './SetEntrySheet';
import {
  entryIsValid,
  normalizedEntry,
  previousEntry,
  previousExercise,
  suggestSetValues,
  saveSetEntry,
  type SetValues,
} from '@/lib/set-entry';
import {
  canonicalExerciseId,
  findExercise,
  isManualWorkoutExercise,
} from '@/lib/exercise-library';
import type {
  LibraryExercise,
  PlannedExercise,
  WorkoutTemplate,
} from '@/lib/workout-model';
import { WorkoutProgram } from './WorkoutProgram';
import { useProgramScroll } from './useProgramScroll';
import {
  addSet,
  appendExercise,
  completedSetCount,
  exerciseIdsMatch,
  hasExerciseProgress,
  hasWorkoutResults,
  extendRest,
  exerciseRestPreference,
  remainingRestSeconds,
  removeSet,
  restartRest,
  setCurrentExercise,
  skipRest,
  toggleSet,
  totalSetCount,
  workoutIsComplete,
} from '@/lib/workout-engine';
import { isSetComplete, WorkoutSession } from '@/lib/workout-model';
import { volume } from '@/lib/workout-metrics';
import { spacing } from '@/lib/theme';

export const successHaptic = () => {
  void Haptics.notificationAsync(
    Haptics.NotificationFeedbackType.Success,
  ).catch(() => {});
};
export const duration = (milliseconds: number) => {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  return [Math.floor(seconds / 60), seconds % 60]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
};

export function Workout({
  session,
  history,
  update,
  recordSet,
  pendingSet,
  exerciseRestSeconds,
  saveExerciseRest,
  finish,
  discard,
  busy,
  appendGroup,
  removeExercises,
  templates = [],
  onStartTemplate,
  onStartPlan,
  onStartEmpty,
  timedActivities,
}: {
  session: WorkoutSession | null;
  timedActivities?: { hold?: ProgramHold; cardio?: CardioGuidance };
  history: WorkoutSession[];
  update: (transform: (session: WorkoutSession) => WorkoutSession) => void;
  recordSet?: (
    transform: (session: WorkoutSession) => WorkoutSession,
    marker: SetWriteMarker,
  ) => Promise<boolean>;
  pendingSet?: SetWriteMarker | null;
  exerciseRestSeconds?: Readonly<Record<string, number>>;
  saveExerciseRest?: SaveExerciseRest;
  finish: () => void;
  discard?: () => void;
  busy: boolean;
  templates?: readonly WorkoutTemplate[];
  onStartTemplate?: (template: WorkoutTemplate) => void;
  onStartPlan?: () => void;
  onStartEmpty?: () => void;
  removeExercises?: (
    sessionId: string,
    ids: readonly string[],
    save: boolean,
  ) => Promise<boolean>;
  appendGroup?: (
    entries: readonly PlannedExercise[],
    expectedSessionId: string,
  ) => Promise<boolean>;
}) {
  const colors = useAppColors();
  const s = useWorkoutStyles();
  const { t, locale } = useLocalization();
  const [now, setNow] = useState(Date.now());
  const [removal, setRemoval] = useState<{
    sessionId: string;
    ids: string[];
    name: string;
    failed?: boolean;
  }>();
  const [picker, setPicker] = useState(false);
  const [technique, setTechnique] = useState<LibraryExercise | null>(null);
  const [inputError, setInputError] = useState<unknown>(null);
  const [editing, setEditing] = useState<{
    sessionId: string;
    exerciseId: string;
    setId: string;
  } | null>(null);
  const [removeIndex, setRemoveIndex] = useState<{
    exerciseId: string;
    setId: string;
  } | null>(null);
  const [composition, setComposition] = useState<{
    sessionId: string;
    exerciseId: string;
  } | null>(null);
  const {
    attachRef,
    dragging,
    onScroll,
    onLayout,
    onContentSizeChange,
    control: programScroll,
  } = useProgramScroll();
  const deadline = session?.restEndsAt;
  const editedExercise =
    session?.id === editing?.sessionId
      ? session?.exercises.find((e) => e.id === editing?.exerciseId)
      : undefined;
  const editedIndex =
    editedExercise?.sets.findIndex((s) => s.id === editing?.setId) ?? -1;
  const editedSet = editedExercise?.sets[editedIndex];
  const entryOpen = Boolean(
    editedSet &&
    !isSetComplete(editedSet) &&
    session?.exercises[session.currentExerciseIndex]?.id ===
      editing?.exerciseId,
  );
  // Discard the draft immediately when its owning snapshot is no longer active.
  if (editing && !entryOpen) setEditing(null);
  useEffect(() => {
    if (!session?.id) return;
    let foreground =
      AppState.currentState == null || AppState.currentState === 'active';
    let armed = false;
    const refresh = () => {
      const time = Date.now();
      setNow(time);
      // Only a countdown observed in the foreground can play a haptic.
      armed = foreground && deadline !== undefined && time < deadline;
    };
    refresh();
    const timer = setInterval(() => {
      if (!foreground) return;
      const time = Date.now();
      setNow(time);
      if (armed && deadline !== undefined && time >= deadline) {
        armed = false;
        successHaptic();
      }
    }, 1000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (foreground === (state === 'active')) return;
      foreground = state === 'active';
      refresh();
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [session?.id, deadline]);
  if (!session)
    return (
      <AppScrollView branded dockAware contentContainerStyle={s.content}>
        <Text accessibilityRole="header" style={s.title}>
          {t('nav.workout')}
        </Text>
        <View style={s.workoutEmpty}>
          <View style={s.workoutEmptyIcon}>
            <Ionicons
              name="barbell-outline"
              color={colors.primary}
              size={40}
              accessible={false}
            />
          </View>
          <Text style={[s.heading, s.centerCopy]}>{t('workout.noActive')}</Text>
          <Text style={[s.sub, s.centerCopy]}>
            {onStartEmpty
              ? t('workout.startHint')
              : t('workout.chooseTemplate')}
          </Text>
        </View>
        <View style={s.startActions}>
          {onStartPlan ? (
            <AppButton
              title={t('workout.startFromPlan')}
              disabled={busy}
              onPress={onStartPlan}
            />
          ) : null}
          {onStartEmpty ? (
            <AppButton
              title={t('workout.emptyStart')}
              outlined
              disabled={busy}
              onPress={onStartEmpty}
            />
          ) : null}
        </View>
        {templates.length && onStartTemplate ? (
          <View style={s.startActions}>
            <Text accessibilityRole="header" style={s.heading}>
              {t('workout.savedTemplates')}
            </Text>
            {templates.map((template) => (
              <View style={s.templateRow} key={template.id}>
                <AppButton
                  title={catalogLabel(
                    locale,
                    'template',
                    template.id,
                    template.name,
                  )}
                  presentation="settings"
                  onPress={() => onStartTemplate(template)}
                  disabled={busy}
                />
              </View>
            ))}
          </View>
        ) : null}
      </AppScrollView>
    );
  const index = session.currentExerciseIndex;
  const exercise = session.exercises[index];
  const station = projectExerciseGroups(session.exercises).find((g) =>
    g.indices.includes(index),
  );
  const nextStation = (station?.indices.at(-1) ?? index) + 1;
  const rest = remainingRestSeconds(session, now);
  const completed = completedSetCount(session);
  const total = totalSetCount(session);
  const previous =
    exercise &&
    previousExercise(history, exercise.libraryId, session)?.sets.filter(
      isSetComplete,
    );
  const nextSet = exercise?.sets.findIndex((set) => !isSetComplete(set)) ?? -1;
  const previousSet =
    nextSet < 0 || !exercise
      ? undefined
      : previousEntry(history, exercise.libraryId, nextSet, session);
  const repeat =
    previousSet &&
    exercise &&
    (previousSet.otherSideReps === undefined) ===
      (exercise.sets[nextSet].otherSideReps === undefined) &&
    entryIsValid(previousSet, exercise.libraryId)
      ? previousSet
      : undefined;
  const setValues = (i: number) => {
    return suggestSetValues(
      exercise,
      exercise.sets[i],
      i === nextSet ? repeat : undefined,
    );
  };
  const priorSummary =
    repeat &&
    (repeat.otherSideReps === undefined
      ? t('entry.singleSummary', {
          weight: formatEntryNumber(locale, repeat.weight),
          reps: formatEntryNumber(locale, repeat.reps),
        })
      : t('entry.bilateralSummary', {
          weight: formatEntryNumber(locale, repeat.weight),
          reps: formatEntryNumber(locale, repeat.reps),
          other: formatEntryNumber(locale, repeat.otherSideReps),
        }));
  const toggle = (setIndex: number, child = index, values?: SetValues) => {
    const set = session.exercises[child].sets[setIndex];
    const transform = (current: WorkoutSession) => {
      const target = current.exercises[child];
      if (current.id !== session.id || target?.sets[setIndex]?.id !== set.id)
        return current;
      const entered = values
        ? saveSetEntry(current, session.id, target.id, set.id, values, false)
        : current;
      return toggleSet(
        setCurrentExercise(entered, child),
        child,
        setIndex,
        Date.now(),
        exerciseRestPreference(exerciseRestSeconds, target.libraryId),
      ).session;
    };
    const notify = () => {
      setNow(Date.now());
      if (!isSetComplete(set)) successHaptic();
    };
    try {
      setInputError(null);
      if (recordSet) {
        void recordSet(transform, {
          id: set.id,
          index: setNumberInGroup(session, child, setIndex),
        }).then((recorded) => {
          if (recorded) notify();
        }, setInputError);
      } else {
        update(transform);
        notify();
      }
    } catch (error) {
      setInputError(error);
    }
  };
  const remove = (setIndex: number) =>
    setRemoveIndex({
      exerciseId: exercise.id,
      setId: exercise.sets[setIndex].id,
    });
  const addFromLibrary = (item: LibraryExercise) => {
    if (busy) return;
    if (equipmentPolicyFor(item.id)?.supportsSetGroups) {
      setTechnique(null);
      setPicker(true);
      setComposition({ sessionId: session.id, exerciseId: item.id });
      return;
    }
    update((current) =>
      current.exercises.some((entry) =>
        exerciseIdsMatch(entry.libraryId ?? entry.id, item.id),
      )
        ? current
        : appendExercise(current, item),
    );
  };
  const requestRemoval = (item: LibraryExercise) => {
    if (busy || !removeExercises) return;
    const matches = session.exercises.filter((entry) =>
      exerciseIdsMatch(entry.libraryId ?? entry.id, item.id),
    );
    const ids = matches.map((entry) => entry.id);
    if (!ids.length) return;
    const name = catalogLabel(locale, 'exercise', item.id, item.name);
    if (matches.some(hasExerciseProgress)) {
      setRemoval({ sessionId: session.id, ids, name });
    } else {
      void removeExercises(session.id, ids, false);
    }
  };
  const removalDialog =
    removal?.sessionId === session.id ? (
      <GlassDialog
        onClose={() => {
          if (!busy) setRemoval(undefined);
        }}
      >
        <ContentScrollView>
          <Text style={s.heading}>
            {t('library.removeQuestion', { name: removal.name })}
          </Text>
          <Text style={s.previous}>{t('library.removeWarning')}</Text>
          {removal.failed ? (
            <Text accessibilityRole="alert" style={s.error}>
              {t('error.workoutOperation')}
            </Text>
          ) : null}
          {(
            [
              'common.cancel',
              'library.saveAndRemove',
              'library.discardAndRemove',
            ] as const
          ).map((key) => (
            <ExerciseLibraryAction
              key={key}
              showIcon={false}
              selected={false}
              toggle={false}
              unavailable={busy}
              label={t(key)}
              accessibilityLabel={t(key)}
              onPress={async () => {
                if (busy) return;
                if (key === 'common.cancel') {
                  setRemoval(undefined);
                } else if (
                  await removeExercises?.(
                    removal.sessionId,
                    removal.ids,
                    key === 'library.saveAndRemove',
                  )
                ) {
                  setRemoval(undefined);
                } else {
                  setRemoval({ ...removal, failed: true });
                }
              }}
            />
          ))}
        </ContentScrollView>
      </GlassDialog>
    ) : null;

  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Confirmation
        visible={removeIndex !== null}
        title={t('workout.removeTitle')}
        message={t('workout.removeMessage')}
        confirmLabel={t('workout.removeConfirm')}
        cancelLabel={t('workout.keepSet')}
        onCancel={() => setRemoveIndex(null)}
        onConfirm={() => {
          if (removeIndex !== null)
            update((current) => {
              const child = current.exercises.findIndex(
                (e) => e.id === removeIndex.exerciseId,
              );
              const row =
                current.exercises[child]?.sets.findIndex(
                  (s) => s.id === removeIndex.setId,
                ) ?? -1;
              return child >= 0 && row >= 0
                ? removeSet(current, child, row)
                : current;
            });
          setRemoveIndex(null);
        }}
      />
      <AppScrollView
        branded
        dockAware
        ref={attachRef}
        scrollEnabled={!dragging}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onLayout={onLayout}
        onContentSizeChange={onContentSizeChange}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.content}
      >
        <View>
          <View style={s.header}>
            <View style={s.titleRow}>
              <Text style={s.title} accessibilityRole="header">
                {session.name}
              </Text>
              <View style={s.elapsed}>
                <Text
                  style={s.elapsedText}
                  accessibilityLabel={t('workout.elapsed', {
                    time: duration(now - session.startedAt),
                  })}
                >
                  {duration(now - session.startedAt)}
                </Text>
              </View>
            </View>
            <Text style={s.summary}>
              {t('workout.summary', {
                completed: formatNumber(locale, completed),
                count: total,
                volume: formatNumber(locale, volume(session)),
              })}
            </Text>
          </View>
        </View>
        {inputError ? (
          <Text accessibilityRole="alert" style={s.error}>
            {presentAppError(t, inputError, 'error.workoutOperation')}
          </Text>
        ) : null}
        {exercise && (
          <GlassCard style={s.exerciseCard}>
            <WorkoutProgram
              key={`${session.id}:${exercise.id}`}
              session={session}
              now={now}
              busy={busy}
              update={update}
              scroll={programScroll}
            />
            {exercise.exerciseGroup && station ? (
              <>
                <Text style={s.heading} accessibilityRole="header">
                  {exercise.exerciseGroup.name}
                </Text>
                {station.indices.map((child, position) => (
                  <View key={session.exercises[child].id}>
                    {position > 0 ? (
                      <Text style={s.previous}>
                        {t('equipment.changeAttachment')}
                      </Text>
                    ) : null}
                    <ExerciseAttachmentBlock
                      pendingSetId={pendingSet?.id}
                      restPreference={exerciseRestPreference(
                        exerciseRestSeconds,
                        session.exercises[child].libraryId,
                      )}
                      saveExerciseRest={saveExerciseRest}
                      session={session}
                      index={child}
                      history={history}
                      busy={busy}
                      update={update}
                      onTechnique={setTechnique}
                      onEdit={(value) => {
                        update((current) => setCurrentExercise(current, child));
                        setEditing(value);
                      }}
                      onToggle={(i) => toggle(i, child)}
                      onRemove={(i) =>
                        setRemoveIndex({
                          exerciseId: session.exercises[child].id,
                          setId: session.exercises[child].sets[i].id,
                        })
                      }
                    />
                  </View>
                ))}
              </>
            ) : (
              <>
                <View style={s.exerciseHeading}>
                  <Text
                    style={[s.heading, s.exerciseName]}
                    accessibilityRole="header"
                  >
                    {workoutExerciseLabel(locale, exercise)}
                  </Text>
                  {findExercise(exercise.libraryId) ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t('library.techniqueFor', {
                        name: workoutExerciseLabel(locale, exercise),
                      })}
                      onPress={() =>
                        setTechnique(findExercise(exercise.libraryId) ?? null)
                      }
                      style={s.techniqueEntry}
                    >
                      <ExerciseArtwork
                        imageKey={findExercise(exercise.libraryId)!.imageKey}
                        size={76}
                      />
                      <Text style={s.techniqueLabel}>
                        {t('library.technique')}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
                <ExerciseEquipmentCatalog
                  key={exercise.libraryId}
                  exerciseId={exercise.libraryId}
                />
                {exercise.cardio ? (
                  <CardioCountdown
                    key={exercise.id}
                    sessionId={session.id}
                    exerciseId={exercise.cardio.exerciseId}
                    goalSeconds={exercise.cardio.goalSeconds}
                    now={now}
                    history={history}
                    manual={{
                      timer: exercise.cardio,
                      disabled: busy,
                      onChange: (transform) => {
                        update((current) => {
                          const selected =
                            current.exercises[current.currentExerciseIndex];
                          if (selected?.id !== exercise.id || !selected.cardio)
                            return current;
                          const exercises = [...current.exercises];
                          exercises[current.currentExerciseIndex] = {
                            ...selected,
                            cardio: transform(selected.cardio),
                          };
                          return { ...current, exercises };
                        });
                        setNow(Date.now());
                      },
                    }}
                  />
                ) : (
                  <>
                    {nextSet < 0 ? (
                      <Text style={s.previous}>
                        {previous?.length
                          ? t('workout.last', {
                              summary: previous
                                .map((set) =>
                                  set.otherSideReps === undefined
                                    ? t('entry.singleSummary', {
                                        weight: formatEntryNumber(
                                          locale,
                                          set.weight,
                                        ),
                                        reps: formatEntryNumber(
                                          locale,
                                          set.reps,
                                        ),
                                      })
                                    : t('entry.bilateralSummary', {
                                        weight: formatEntryNumber(
                                          locale,
                                          set.weight,
                                        ),
                                        reps: formatEntryNumber(
                                          locale,
                                          set.reps,
                                        ),
                                        other: formatEntryNumber(
                                          locale,
                                          set.otherSideReps,
                                        ),
                                      }),
                                )
                                .join(' · '),
                            })
                          : t('workout.first')}
                      </Text>
                    ) : null}
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
                              restMin: formatNumber(
                                locale,
                                exercise.target.restMin,
                              ),
                              restMax: formatNumber(
                                locale,
                                exercise.target.restMax,
                              ),
                            },
                          )}
                        </Text>
                        <Text style={s.previous}>{t('workout.warmup')}</Text>
                      </View>
                    ) : null}
                    {!exercise.cardio ? (
                      <ExerciseRestControls
                        key={exercise.id}
                        session={session}
                        exercise={exercise}
                        preference={exerciseRestPreference(
                          exerciseRestSeconds,
                          exercise.libraryId,
                        )}
                        busy={busy || !!pendingSet}
                        update={update}
                        save={saveExerciseRest}
                      />
                    ) : null}
                    {exercise.libraryId === 'bodyweight-step-up' ? (
                      <Text style={s.previous}>{t('workout.stepUp')}</Text>
                    ) : null}
                    {exercise.sets
                      .map((set, i) => ({ set, i }))
                      .sort(
                        (a, b) =>
                          Number(b.i === nextSet) - Number(a.i === nextSet),
                      )
                      .map(({ set, i }) => {
                        const done = isSetComplete(set);
                        const focused = i === nextSet;
                        const shown = focused ? setValues(i) : set;
                        return (
                          <View
                            key={set.id}
                            style={focused ? s.activeSet : undefined}
                          >
                            {focused ? (
                              <>
                                <View style={s.activeSetHeader}>
                                  <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel={t(
                                      'workout.removeNamed',
                                      { index: i + 1 },
                                    )}
                                    disabled={
                                      busy || exercise.sets.length === 1
                                    }
                                    onPress={() => remove(i)}
                                    style={s.repeatSet}
                                  >
                                    <Text style={s.setTitle}>
                                      {t('workout.activeSet', {
                                        index: i + 1,
                                        count: exercise.sets.length,
                                      })}
                                    </Text>
                                  </Pressable>
                                  {repeat ? (
                                    <AppButton
                                      title={t('workout.reusePrevious')}
                                      secondary
                                      presentation="text"
                                      disabled={busy}
                                      onPress={() =>
                                        update((current) =>
                                          saveSetEntry(
                                            current,
                                            session.id,
                                            exercise.id,
                                            set.id,
                                            repeat,
                                          ),
                                        )
                                      }
                                    />
                                  ) : null}
                                </View>
                                <Text style={s.previous}>
                                  {priorSummary
                                    ? t('entry.previous', {
                                        summary: priorSummary,
                                      })
                                    : t('entry.noPrevious')}
                                </Text>
                              </>
                            ) : null}
                            <View style={s.setRow}>
                              {!focused ? (
                                <Pressable
                                  style={({ pressed }) => [
                                    s.target,
                                    pressed && s.dim,
                                  ]}
                                  disabled={busy || exercise.sets.length === 1}
                                  accessibilityLabel={t('workout.removeNamed', {
                                    index: i + 1,
                                  })}
                                  accessibilityHint={t('workout.confirmHint')}
                                  onPress={() => remove(i)}
                                >
                                  <Text style={s.setNumber}>{i + 1}</Text>
                                </Pressable>
                              ) : null}
                              {[
                                {
                                  field: 'weight',
                                  value: shown.weight,
                                  placeholder: '—',
                                  label: t('entry.weightHeading'),
                                },
                                {
                                  field:
                                    set.otherSideReps === undefined
                                      ? 'repetitions'
                                      : 'left repetitions',
                                  value: shown.reps,
                                  label:
                                    set.otherSideReps === undefined
                                      ? t('entry.repsHeading')
                                      : t('entry.leftHeading'),
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
                                        value: shown.otherSideReps,
                                        label: t('entry.rightHeading'),
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
                                    { index: i + 1 },
                                  )}
                                  accessibilityValue={{
                                    text: cell.value
                                      ? formatEntryNumber(locale, cell.value)
                                      : t('workout.notEntered'),
                                  }}
                                  accessibilityState={{
                                    disabled: done || busy,
                                  }}
                                  disabled={done || busy}
                                  style={[
                                    s.input,
                                    s.valueCell,
                                    done && s.completed,
                                    focused && s.activeSetCell,
                                  ]}
                                  onPress={() =>
                                    setEditing({
                                      sessionId: session.id,
                                      exerciseId: exercise.id,
                                      setId: set.id,
                                    })
                                  }
                                >
                                  {focused ? (
                                    <Text style={s.activeSetLabel}>
                                      {cell.label}
                                    </Text>
                                  ) : null}
                                  <Text style={s.valueText}>
                                    {cell.value
                                      ? formatEntryNumber(locale, cell.value)
                                      : cell.placeholder}
                                  </Text>
                                </Pressable>
                              ))}
                              {!focused ? (
                                <Pressable
                                  accessibilityRole="checkbox"
                                  accessibilityLabel={t(
                                    'workout.completeNamed',
                                    {
                                      index: i + 1,
                                    },
                                  )}
                                  accessibilityState={{
                                    checked: done,
                                    disabled: busy,
                                  }}
                                  disabled={busy}
                                  onPress={() => toggle(i)}
                                  style={({ pressed }) => [
                                    s.target,
                                    s.check,
                                    done && s.checked,
                                    pendingSet?.id === set.id && s.unsavedSet,
                                    (pressed || busy) && s.dim,
                                  ]}
                                >
                                  <Text
                                    style={[s.checkText, done && s.checkedText]}
                                  >
                                    {pendingSet?.id === set.id
                                      ? '!'
                                      : done
                                        ? '✓'
                                        : '○'}
                                  </Text>
                                </Pressable>
                              ) : null}
                            </View>
                            {focused ? (
                              <AppButton
                                title={
                                  pendingSet?.id === set.id
                                    ? '!'
                                    : t('entry.saveSet')
                                }
                                accessibilityLabel={t('workout.completeNamed', {
                                  index: i + 1,
                                })}
                                checked={false}
                                disabled={
                                  busy ||
                                  !entryIsValid(shown, exercise.libraryId)
                                }
                                onPress={() => toggle(i, index, shown)}
                              />
                            ) : null}
                          </View>
                        );
                      })}
                    <AppButton
                      title={t('workout.addSet')}
                      secondary
                      disabled={busy}
                      onPress={() =>
                        update((current) => addSet(current, index))
                      }
                    />
                  </>
                )}
              </>
            )}
          </GlassCard>
        )}
        {timedActivities ? (
          <>
            <ProgramTimedActivities {...timedActivities} />
            {timedActivities.cardio?.activity ? (
              <CardioCountdown
                key={session.id}
                sessionId={session.id}
                exerciseId={cardioExerciseIds[timedActivities.cardio.activity]}
                goalSeconds={timedActivities.cardio.minutes * 60}
                now={now}
                history={history}
              />
            ) : null}
          </>
        ) : null}
        {deadline !== undefined && (
          <GlassCard style={s.restCard}>
            <View style={s.restHeading}>
              <Text style={s.heading} accessibilityRole="header">
                {t(rest > 0 ? 'workout.restActive' : 'workout.restDone')}
              </Text>
              <Text
                accessibilityLabel={t('workout.remaining', { count: rest })}
                style={s.timer}
              >
                {duration(rest * 1000)}
              </Text>
            </View>
            <View style={s.actionRow}>
              <View style={s.action}>
                <AppButton
                  title={t('workout.minus15')}
                  secondary
                  disabled={busy}
                  onPress={() => update((current) => extendRest(current, -15))}
                />
              </View>
              <View style={s.action}>
                <AppButton
                  title={t('workout.plus15')}
                  secondary
                  disabled={busy}
                  onPress={() => update((current) => extendRest(current, 15))}
                />
              </View>
            </View>
            <View style={s.actionRow}>
              <View style={s.action}>
                <AppButton
                  title={t('workout.restart')}
                  secondary
                  disabled={busy}
                  onPress={() => update(restartRest)}
                />
              </View>
              <View style={s.action}>
                <AppButton
                  title={t(rest ? 'workout.skipRest' : 'workout.continue')}
                  secondary
                  disabled={busy}
                  onPress={() => update(skipRest)}
                />
              </View>
            </View>
          </GlassCard>
        )}
        <View style={s.actionRow}>
          <View style={s.action}>
            <AppButton
              title={t('workout.addExercise')}
              secondary
              disabled={busy}
              onPress={() => setPicker(true)}
            />
          </View>
          {nextStation < session.exercises.length && (
            <View style={s.action}>
              <AppButton
                title={t('workout.nextExercise')}
                secondary
                disabled={busy}
                onPress={() =>
                  update((current) => setCurrentExercise(current, nextStation))
                }
              />
            </View>
          )}
        </View>
        <AppButton
          title={
            busy
              ? t('workout.saving')
              : workoutIsComplete(session, now)
                ? t('workout.finishSave')
                : t('workout.finish')
          }
          disabled={busy || !hasWorkoutResults(session, now)}
          onPress={finish}
        />
        {discard ? (
          <AppButton
            title={t('workout.discard')}
            destructive
            presentation="text"
            disabled={busy}
            onPress={discard}
          />
        ) : null}
      </AppScrollView>
      <ExerciseLibrary
        history={history}
        visible={picker}
        selectedIds={session.exercises.map(
          (exercise) =>
            canonicalExerciseId(exercise.libraryId ?? exercise.id) ??
            exercise.id,
        )}
        onClose={() => setPicker(false)}
        onAdd={addFromLibrary}
        allowCardio
        onRemove={removeExercises ? requestRemoval : undefined}
        actionDialog={picker ? removalDialog : undefined}
        onCloseOverlay={() => setComposition(null)}
        overlay={
          composition && composition.sessionId === session.id ? (
            <AppScrollView contentContainerStyle={s.content}>
              <ExerciseGroupComposer
                initialExerciseId={composition.exerciseId}
                existingOutsideIds={session.exercises.map((e) => e.libraryId)}
                busy={busy}
                onCancel={() => setComposition(null)}
                onApply={async (entries) => {
                  const saved =
                    (await appendGroup?.(entries, composition.sessionId)) ??
                    false;
                  if (saved) setComposition(null);
                  return saved;
                }}
              />
            </AppScrollView>
          ) : undefined
        }
      />
      {technique ? (
        <ExerciseTechnique
          key={technique.id}
          exercise={technique}
          actionDialog={removalDialog}
          renderAction={
            removeExercises
              ? (item, name) => {
                  const selected = session.exercises.some((entry) =>
                    exerciseIdsMatch(entry.libraryId ?? entry.id, item.id),
                  );
                  return (
                    <ExerciseLibraryAction
                      label={t(selected ? 'library.added' : 'library.add')}
                      accessibilityLabel={t(
                        selected ? 'library.removeName' : 'library.addName',
                        { name },
                      )}
                      selected={selected}
                      toggle
                      unavailable={
                        busy ||
                        (!selected &&
                          !isManualWorkoutExercise(item) &&
                          !isCardioExerciseId(item.id))
                      }
                      onPress={() =>
                        selected ? requestRemoval(item) : addFromLibrary(item)
                      }
                    />
                  );
                }
              : undefined
          }
          onClose={() => setTechnique(null)}
        />
      ) : null}
      {entryOpen && editing && editedSet && editedExercise ? (
        <SetEntrySheet
          key={`${editing.sessionId}:${editing.exerciseId}:${editing.setId}`}
          set={
            editedSet.id === exercise.sets[nextSet]?.id
              ? { ...editedSet, ...setValues(nextSet) }
              : editedSet
          }
          setNumber={setNumberInGroup(
            session,
            session.exercises.findIndex((e) => e.id === editedExercise.id),
            editedIndex,
          )}
          libraryId={editedExercise.libraryId}
          previous={previousEntry(
            history,
            editedExercise.libraryId,
            editedIndex,
            session,
          )}
          busy={busy}
          onCancel={() => setEditing(null)}
          onSave={(values) => {
            if (busy) return;
            const plan = normalizedEntry(
              suggestSetValues(editedExercise, editedSet),
            );
            if (
              !editedExercise.target ||
              plan.weight !== values.weight ||
              plan.reps !== values.reps ||
              plan.otherSideReps !== values.otherSideReps
            ) {
              update((current) =>
                saveSetEntry(
                  current,
                  editing.sessionId,
                  editing.exerciseId,
                  editing.setId,
                  values,
                ),
              );
            }
            setEditing(null);
            setInputError(null);
          }}
        />
      ) : null}
    </KeyboardAvoidingView>
  );
}
