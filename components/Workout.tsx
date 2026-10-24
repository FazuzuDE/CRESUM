import { BrandHeader } from './BrandHeader';
import { useLocalization } from './LocalizationProvider';
import { formatEntryNumber, formatNumber } from '@/lib/i18n/format';
import { presentAppError } from '@/lib/i18n/errors';
import { AppScrollView } from './AppScrollView';
import { useEffect, useRef, useState } from 'react';
import {
  AppState,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { GlassCard } from './GlassCard';
import { AppButton } from './AppButton';
import { Confirmation } from './Confirmation';
import { ExerciseLibrary } from './ExerciseLibrary';
import { ExerciseTechnique } from './ExerciseTechnique';
import { ExerciseArtwork } from './ExerciseArtwork';
import { SetEntrySheet } from './SetEntrySheet';
import { previousEntry, saveSetEntry } from '@/lib/set-entry';
import { findExercise } from '@/lib/exercise-library';
import type { LibraryExercise } from '@/lib/workout-model';
import { WorkoutProgram } from './WorkoutProgram';
import { useProgramScroll } from './useProgramScroll';
import {
  addSet,
  appendExercise,
  completedSetCount,
  exerciseIdsMatch,
  extendRest,
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
import { colors, radius, spacing, typography } from '@/lib/theme';

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
  finish,
  discard,
  busy,
}: {
  session: WorkoutSession | null;
  history: WorkoutSession[];
  update: (transform: (session: WorkoutSession) => WorkoutSession) => void;
  finish: () => void;
  discard?: () => void;
  busy: boolean;
}) {
  const { t, locale } = useLocalization();
  const [now, setNow] = useState(Date.now());
  const [picker, setPicker] = useState(false);
  const [technique, setTechnique] = useState<LibraryExercise | null>(null);
  const [inputError, setInputError] = useState<unknown>(null);
  const [editing, setEditing] = useState<{
    sessionId: string;
    exerciseId: string;
    setId: string;
  } | null>(null);
  const [removeIndex, setRemoveIndex] = useState<number | null>(null);
  const {
    attachRef,
    dragging,
    onScroll,
    onLayout,
    onContentSizeChange,
    control: programScroll,
  } = useProgramScroll();
  const notified = useRef<number | undefined>(undefined);
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
    const refresh = () => setNow(Date.now());
    refresh();
    const timer = setInterval(refresh, 1000);
    const subscription = AppState.addEventListener('change', refresh);
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [session?.id]);
  useEffect(() => {
    if (deadline && now >= deadline && notified.current !== deadline) {
      notified.current = deadline;
      successHaptic();
    }
  }, [deadline, now]);
  if (!session)
    return (
      <View style={s.empty}>
        <Text style={s.title}>{t('workout.noActive')}</Text>
        <Text style={s.sub}>{t('workout.chooseTemplate')}</Text>
      </View>
    );
  const index = session.currentExerciseIndex;
  const exercise = session.exercises[index];
  const rest = remainingRestSeconds(session, now);
  const completed = completedSetCount(session);
  const total = totalSetCount(session);
  const previous =
    exercise &&
    history
      .flatMap((item) => item.exercises)
      .find((item) => exerciseIdsMatch(item.libraryId, exercise.libraryId))
      ?.sets.filter(isSetComplete);
  const toggle = (setIndex: number) => {
    try {
      update((current) => toggleSet(current, index, setIndex).session);
      setNow(Date.now());
      setInputError(null);
      if (!isSetComplete(exercise.sets[setIndex])) successHaptic();
    } catch (error) {
      setInputError(error);
    }
  };
  const remove = (setIndex: number) => setRemoveIndex(setIndex);
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
            update((current) => removeSet(current, index, removeIndex));
          setRemoveIndex(null);
        }}
      />
      <AppScrollView
        ref={attachRef}
        scrollEnabled={!dragging}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onLayout={onLayout}
        onContentSizeChange={onContentSizeChange}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.content}
      >
        <View style={s.header}>
          <BrandHeader />
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
              busy={busy}
              update={update}
              scroll={programScroll}
            />
            <View style={s.exerciseHeading}>
              <Text
                style={[s.heading, s.exerciseName]}
                accessibilityRole="header"
              >
                {exercise.name}
              </Text>
              {findExercise(exercise.libraryId) ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('library.techniqueFor', {
                    name: exercise.name,
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
                        (current.restOverrideSeconds ??
                          exercise.target!.restMin) === exercise.target!.restMin
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
              <Text style={s.number}>{t('workout.tableSet')}</Text>
              <Text style={s.column}>{t('workout.tableKg')}</Text>
              <Text style={s.column}>{t('workout.tableReps')}</Text>
              <Text style={s.number}>{t('workout.tableDone')}</Text>
            </View>
            {exercise.sets.map((set, i) => {
              const done = isSetComplete(set);
              return (
                <View key={set.id} style={s.setRow}>
                  <Pressable
                    style={({ pressed }) => [s.target, pressed && s.dim]}
                    disabled={busy || exercise.sets.length === 1}
                    accessibilityLabel={t('workout.removeNamed', {
                      index: i + 1,
                    })}
                    accessibilityHint={t('workout.confirmHint')}
                    onPress={() => remove(i)}
                  >
                    <Text style={s.setNumber}>{i + 1}</Text>
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
                        { index: i + 1 },
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
                        setEditing({
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
                      index: i + 1,
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
              disabled={busy}
              onPress={() => update((current) => addSet(current, index))}
            />
          </GlassCard>
        )}
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
          {index < session.exercises.length - 1 && (
            <View style={s.action}>
              <AppButton
                title={t('workout.nextExercise')}
                secondary
                disabled={busy}
                onPress={() =>
                  update((current) => setCurrentExercise(current, index + 1))
                }
              />
            </View>
          )}
        </View>
        <AppButton
          title={
            busy
              ? t('workout.saving')
              : workoutIsComplete(session)
                ? t('workout.finishSave')
                : t('workout.finish')
          }
          disabled={busy || completed === 0}
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
        onClose={() => setPicker(false)}
        onAdd={(item) => {
          update((current) => appendExercise(current, item));
          setPicker(false);
        }}
      />
      {technique ? (
        <ExerciseTechnique
          key={technique.id}
          exercise={technique}
          onClose={() => setTechnique(null)}
        />
      ) : null}
      {entryOpen && editing && editedSet && editedExercise ? (
        <SetEntrySheet
          key={`${editing.sessionId}:${editing.exerciseId}:${editing.setId}`}
          set={editedSet}
          setNumber={editedIndex + 1}
          libraryId={editedExercise.libraryId}
          previous={previousEntry(
            history,
            editedExercise.libraryId,
            editedIndex,
          )}
          busy={busy}
          onCancel={() => setEditing(null)}
          onSave={(values) => {
            if (busy) return;
            update((current) =>
              saveSetEntry(
                current,
                editing.sessionId,
                editing.exerciseId,
                editing.setId,
                values,
              ),
            );
            setEditing(null);
            setInputError(null);
          }}
        />
      ) : null}
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  valueCell: { justifyContent: 'center', alignItems: 'center' },
  valueText: {
    maxWidth: '100%',
    ...typography.title3,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  flex: { flex: 1 },
  exerciseHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  exerciseName: { flex: 1, minWidth: 0 },
  techniqueEntry: { width: 76, alignItems: 'center', gap: spacing.xxs },
  techniqueLabel: {
    ...typography.caption,
    color: colors.primary,
    maxWidth: '100%',
    textAlign: 'center',
  },
  content: {
    padding: spacing.md,
    gap: spacing.lg,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  header: { gap: spacing.sm, paddingVertical: spacing.sm },
  titleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: { ...typography.largeTitle, flexShrink: 1, color: colors.textPrimary },
  elapsed: {
    backgroundColor: colors.primaryTint,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  elapsedText: {
    ...typography.headline,
    fontVariant: ['tabular-nums'],
    color: colors.textPrimary,
  },
  summary: { ...typography.subheadline, color: colors.textSecondary },
  heading: { ...typography.title2, color: colors.textPrimary },
  sub: { ...typography.footnote, color: colors.textSecondary },
  error: { ...typography.footnote, color: colors.danger },
  empty: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'center',
    gap: spacing.md,
  },
  exerciseCard: {
    padding: spacing.lg,
    borderRadius: radius.xxl,
    gap: spacing.xs,
  },
  previous: {
    ...typography.footnote,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  tableHeader: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
  },
  setRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
  },
  number: {
    ...typography.caption,
    width: 44,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  column: {
    ...typography.caption,
    flex: 1,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  target: {
    width: 44,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setNumber: { ...typography.subheadline, color: colors.textSecondary },
  check: { borderRadius: radius.md, backgroundColor: colors.surfaceSubtle },
  checked: { backgroundColor: colors.success },
  checkText: { ...typography.title2, color: colors.primary },
  checkedText: { color: colors.textPrimary },
  input: {
    ...typography.headline,
    fontVariant: ['tabular-nums'],
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  completed: { borderColor: colors.success, borderWidth: 2 },
  restCard: {
    padding: spacing.lg,
    borderRadius: radius.xxl,
    backgroundColor: colors.primaryTint,
    gap: spacing.xs,
  },
  restHeading: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  timer: {
    ...typography.largeTitle,
    fontVariant: ['tabular-nums'],
    color: colors.primary,
  },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  action: { flexGrow: 1, flexBasis: 120, minWidth: 0 },
  dim: { opacity: 0.6 },
});
