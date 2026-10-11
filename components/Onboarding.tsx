import { HistoryDatePicker } from './HistoryDatePicker';
import { selectProgram } from '@/lib/training-programs/selectors';
import { projectProgramReadiness } from '@/lib/training-programs/readiness';
import {
  makeAssignment,
  type ProgramAssignment,
} from '@/lib/training-programs/assignment';
import {
  addCalendarDays,
  adjustProgramSchedule,
  localDate,
} from '@/lib/training-programs/schedule';
import { exerciseLibrary, findExercise } from '@/lib/exercise-library';
import { AppScrollView } from './AppScrollView';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AppButton } from './AppButton';
import { GlassCard } from './GlassCard';
import { TemplateEditor } from './TemplateEditor';
import type { OnboardingState, OnboardingStep } from '@/lib/onboarding';
import type { TemplateMutationResult } from '@/lib/workout-store';
import type { TemplateDraft } from '@/lib/workout-templates';
import { colors, radius, spacing, typography } from '@/lib/theme';

type Props = {
  state: OnboardingState;
  editing?: boolean;
  busy: boolean;
  onChange: (next: OnboardingState) => void;
  onComplete: (
    next: OnboardingState,
    proposal?: ProgramAssignment,
  ) => Promise<void>;
  onCreateWorkout: (draft: TemplateDraft) => Promise<TemplateMutationResult>;
  onExit?: () => void;
};

export function Onboarding({
  state: initial,
  editing = false,
  busy,
  onChange,
  onComplete,
  onCreateWorkout,
  onExit,
}: Props) {
  const [state, setState] = useState(() =>
    initial.step === 'environment'
      ? { ...initial, step: 'profile' as const }
      : initial,
  );
  const [proposalId] = useState(
    () =>
      `accept-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
  );
  const [startDate, setStartDate] = useState(() => localDate());
  const [offsets, setOffsets] = useState<number[]>();
  const [frequency, setFrequency] = useState<number>();
  const [reduced, setReduced] = useState(false);
  const [preview, setPreview] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [lockedProposal, setLockedProposal] = useState<ProgramAssignment>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const change = (next: OnboardingState) => {
    setState(next);
    onChange(next);
  };
  const go = (step: OnboardingStep) => change({ ...state, step });
  const base =
    state.answers.goal && state.answers.experience
      ? selectProgram(state.answers.goal, state.answers.experience)
      : undefined;
  let proposal: ProgramAssignment | undefined;
  let proposalError = '';
  try {
    if (base) {
      if (frequency !== undefined && frequency !== base.schedule[0].length)
        throw Error(
          'No checked program for this frequency. Keep the recommended frequency or use manual setup.',
        );
      const program = offsets ? adjustProgramSchedule(base, offsets) : base;
      const readiness = projectProgramReadiness(program, exerciseLibrary);
      if (!readiness.ready)
        throw Error(
          `Required exercises unavailable: ${readiness.blockers.join(', ')}`,
        );
      proposal = makeAssignment(program, proposalId, startDate, reduced);
    } else
      proposalError = 'Choose a goal and experience to prepare your program.';
  } catch (problem) {
    proposalError = (problem as Error).message;
  }
  if (lockedProposal) {
    proposal = lockedProposal;
    proposalError = '';
  }
  const complete = async () => {
    setSaving(true);
    setError('');
    try {
      if (!proposal) throw Error(proposalError);
      setLockedProposal(proposal);
      await onComplete(
        {
          ...state,
          status: 'completed',
          step: 'complete',
          answers: { ...state.answers, environment: 'gym' },
        },
        proposal,
      );
    } catch (problem) {
      setError(
        problem instanceof Error
          ? problem.message
          : 'Could not save program. Retry; your workouts are safe.',
      );
    } finally {
      setSaving(false);
    }
  };
  const option = (
    title: string,
    field: 'goal' | 'experience' | 'environment',
    value: NonNullable<OnboardingState['answers'][typeof field]>,
    next: OnboardingStep,
  ) => (
    <AppButton
      key={value}
      title={title}
      accessibilityLabel={title}
      selected={state.answers[field] === value}
      secondary={state.answers[field] !== value}
      disabled={saving || Boolean(lockedProposal)}
      onPress={() => {
        if (field === 'goal' || field === 'experience') {
          setOffsets(undefined);
          setFrequency(undefined);
          setReduced(false);
        }
        change({
          ...state,
          step: next,
          answers: { ...state.answers, [field]: value },
        });
      }}
    />
  );
  const field = (label: string, name: 'age' | 'heightCm' | 'bodyWeightKg') => (
    <View style={s.field} key={name}>
      <Text style={s.label}>{label} · optional</Text>
      <TextInput
        accessibilityLabel={label}
        value={state.answers[name] ?? ''}
        onChangeText={(value) => {
          setError('');
          change({
            ...state,
            answers: { ...state.answers, [name]: value },
          });
        }}
        keyboardType="decimal-pad"
        placeholder="Not provided"
        placeholderTextColor={colors.textTertiary}
        style={s.input}
        maxLength={32}
      />
    </View>
  );
  const back: Partial<Record<OnboardingStep, OnboardingStep>> = {
    goal: 'welcome',
    experience: 'goal',
    environment: 'experience',
    profile: 'experience',
    complete: 'profile',
    self_setup: 'welcome',
  };
  const continueFromProfile = () => {
    const { age, heightCm, bodyWeightKg } = state.answers;
    if (
      age?.trim() &&
      (!/^\d+$/.test(age.trim()) || Number(age) < 1 || Number(age) > 120)
    ) {
      setError('Enter a valid age, or leave it empty.');
      return;
    }
    for (const [value, label, max] of [
      [heightCm, 'height', 300],
      [bodyWeightKg, 'body weight', 1000],
    ] as const) {
      if (!value?.trim()) continue;
      const normalized = value.trim().replace(',', '.');
      const number = Number(normalized);
      if (
        !/^\d+(?:\.\d+)?$/.test(normalized) ||
        !Number.isFinite(number) ||
        number <= 0 ||
        number > max
      ) {
        setError(`Enter a valid ${label}, or leave it empty.`);
        return;
      }
    }
    setError('');
    go('complete');
  };
  const step = state.step;
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={s.root}
    >
      <AppScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.content}
      >
        <Text style={s.brand}>CRESUM</Text>
        {step === 'self_setup' ? (
          <>
            <Text style={s.title} accessibilityRole="header">
              Your first workout
            </Text>
            <Text style={s.sub}>
              Create a workout you can start and edit later. Planned values are
              not completed sets.
            </Text>
            <TemplateEditor
              mode="create"
              busy={busy}
              onSave={onCreateWorkout}
              onCancel={() => go('welcome')}
            />
          </>
        ) : (
          <GlassCard style={s.card}>
            {step === 'welcome' ? (
              <>
                <Text style={s.title} accessibilityRole="header">
                  Welcome to CRESUM
                </Text>
                <Text style={s.sub}>Choose how you want to begin.</Text>
                <View style={s.choice}>
                  <AppButton
                    title="Personalize my training"
                    accessibilityLabel="Personalize my training"
                    onPress={() => go('goal')}
                  />
                  <Text style={s.support}>CRESUM will help me get started</Text>
                </View>
                <View style={s.choice}>
                  <AppButton
                    title="Set up workouts myself"
                    accessibilityLabel="Set up workouts myself"
                    secondary
                    onPress={() => go('self_setup')}
                  />
                  <Text style={s.support}>Skip personalization for now</Text>
                </View>
              </>
            ) : null}
            {step === 'goal' ? (
              <>
                <Text style={s.title} accessibilityRole="header">
                  Training goal
                </Text>
                <Text style={s.sub}>What would you like to focus on?</Text>
                {option('Build muscle', 'goal', 'build_muscle', 'experience')}
                {option('Get stronger', 'goal', 'get_stronger', 'experience')}
                {option(
                  'General fitness',
                  'goal',
                  'general_fitness',
                  'experience',
                )}
                {state.answers.goal ? (
                  <AppButton title="Next" onPress={() => go('experience')} />
                ) : null}
              </>
            ) : null}
            {step === 'experience' ? (
              <>
                <Text style={s.title} accessibilityRole="header">
                  Training experience
                </Text>
                <Text style={s.sub}>Choose the closest fit.</Text>
                {option('Beginner', 'experience', 'beginner', 'profile')}
                {option('Some experience', 'experience', 'some', 'profile')}
                {option('Experienced', 'experience', 'experienced', 'profile')}
                {state.answers.experience ? (
                  <AppButton title="Next" onPress={() => go('profile')} />
                ) : null}
              </>
            ) : null}
            {step === 'profile' ? (
              <>
                <Text style={s.title} accessibilityRole="header">
                  Body details
                </Text>
                <Text style={s.sub}>
                  Optional details for your profile. They do not determine a
                  working weight.
                </Text>
                {field('Age', 'age')}
                {field('Height (cm)', 'heightCm')}
                {field('Body weight (kg)', 'bodyWeightKg')}
                <AppButton
                  title={
                    state.answers.age ||
                    state.answers.heightCm ||
                    state.answers.bodyWeightKg
                      ? 'Continue'
                      : 'Continue without body details'
                  }
                  onPress={continueFromProfile}
                />
              </>
            ) : null}
            {step === 'complete' ? (
              <>
                <Text style={s.title} accessibilityRole="header">
                  {proposal ? 'You’re ready to start' : 'Review your program'}
                </Text>
                {proposal ? (
                  <>
                    <Text style={s.label}>{proposal.program.name}</Text>
                    <Text style={s.sub}>
                      {proposal.program.schedule[0].length} strength workouts
                      per week · Gym · starts {proposal.startDate}
                    </Text>
                    <Text style={s.support}>
                      CRESUM adaptation of published training programs from
                      ACSM, NSCA, ACE, HSS and NHS guidance. Working weights are
                      chosen manually; planned values do not count as completed
                      sets.
                    </Text>
                    <AppButton
                      title={
                        preview ? 'Hide full program' : 'View full program'
                      }
                      secondary
                      onPress={() => setPreview(!preview)}
                    />
                    {preview ? (
                      <View style={s.field}>
                        {proposal.program.schedule.map((week, i) => (
                          <Text key={i} style={s.label}>
                            Week {i + 1}:{' '}
                            {week
                              .map(
                                (slot) =>
                                  `${slot.dayKey} · ${addCalendarDays(proposal!.startDate, i * 7 + slot.offset)}`,
                              )
                              .join(' / ')}
                          </Text>
                        ))}
                        {proposal.program.days.map((day) => (
                          <View key={day.key} style={s.field}>
                            <Text style={s.label}>
                              {day.key} · {day.name}
                            </Text>
                            {day.movements.map((m) => (
                              <Text key={m.exerciseId} style={s.support}>
                                {findExercise(m.exerciseId)?.name ??
                                  m.exerciseId}{' '}
                                · {m.sets} × {m.repMin}–{m.repMax}
                                {m.perSide ? ' per side' : ''} · rest{' '}
                                {m.restMin}–{m.restMax}s
                              </Text>
                            ))}
                          </View>
                        ))}
                        <Text style={s.support}>
                          Warm up separately. Use a manageable load with 2–3
                          reps in reserve. Progress manually when the upper rep
                          target feels controlled; no automatic load increases.
                        </Text>
                        {proposal.program.cardio.length ? (
                          <Text style={s.support}>
                            Walking or cycling: gradual target of 150 moderate
                            minutes per week; start with manageable 10–15 minute
                            sessions. Cardio guidance is separate from strength
                            logging.
                          </Text>
                        ) : null}
                      </View>
                    ) : null}
                  </>
                ) : (
                  <Text accessibilityRole="alert" style={s.error}>
                    {proposalError}
                  </Text>
                )}
                <AppButton
                  title={
                    scheduleOpen ? 'Hide schedule options' : 'Schedule options'
                  }
                  secondary
                  disabled={saving || Boolean(lockedProposal)}
                  onPress={() => setScheduleOpen(!scheduleOpen)}
                />
                {scheduleOpen && base ? (
                  <View style={s.field}>
                    <AppButton
                      title={`Start date · ${startDate}`}
                      secondary
                      disabled={saving || Boolean(lockedProposal)}
                      onPress={() => setDateOpen(!dateOpen)}
                    />
                    {dateOpen ? (
                      <HistoryDatePicker
                        value={new Date(`${startDate}T12:00:00`).getTime()}
                        onChange={(time) => {
                          setStartDate(localDate(new Date(time)));
                          setDateOpen(false);
                        }}
                      />
                    ) : null}
                    <Text style={s.label}>Workouts per week</Text>
                    {[2, 3, 4].map((n) => (
                      <AppButton
                        key={n}
                        title={`${n} workouts`}
                        secondary
                        selected={(frequency ?? base.schedule[0].length) === n}
                        disabled={saving || Boolean(lockedProposal)}
                        onPress={() => setFrequency(n)}
                      />
                    ))}
                    <Text style={s.support}>
                      Only the recommended frequency has a checked variant for
                      this goal and experience. Other frequencies use manual
                      setup.
                    </Text>
                    {base.schedule[0].map((slot, i) => (
                      <View key={i} style={s.field}>
                        <Text style={s.label}>
                          Session {i + 1} · day of the plan week (1–7)
                        </Text>
                        <TextInput
                          accessibilityLabel={`Session ${i + 1} day of plan week`}
                          keyboardType="number-pad"
                          value={String(
                            (offsets ?? base.schedule[0].map((s) => s.offset))[
                              i
                            ] + 1,
                          )}
                          editable={!saving && !lockedProposal}
                          style={s.input}
                          onChangeText={(value) => {
                            const next = [
                              ...(offsets ??
                                base.schedule[0].map((s) => s.offset)),
                            ];
                            next[i] = Number(value) - 1;
                            setOffsets(next);
                          }}
                        />
                      </View>
                    ))}
                  </View>
                ) : null}
                {base?.firstSessionSetCap ? (
                  <AppButton
                    title={
                      reduced
                        ? 'First session: 1 set per exercise'
                        : 'New to training? Reduce first session to 1 set'
                    }
                    secondary
                    selected={reduced}
                    disabled={saving || Boolean(lockedProposal)}
                    onPress={() => setReduced(!reduced)}
                  />
                ) : null}
                <AppButton
                  title={
                    error && lockedProposal
                      ? 'Retry START!'
                      : saving
                        ? 'Saving program…'
                        : 'START!'
                  }
                  disabled={!proposal || saving || busy}
                  onPress={() => void complete()}
                />
                {!lockedProposal ? (
                  <AppButton
                    title="Set up workouts myself"
                    secondary
                    disabled={saving || busy}
                    onPress={() => go('self_setup')}
                  />
                ) : null}
                {lockedProposal && error && onExit ? (
                  <AppButton
                    title="Open saved workouts"
                    secondary
                    disabled={saving || busy}
                    onPress={onExit}
                  />
                ) : null}
              </>
            ) : null}
            {error ? (
              <Text style={s.error} accessibilityRole="alert">
                {error}
              </Text>
            ) : null}
            {back[step] ? (
              <AppButton
                title="Back"
                disabled={saving || busy || Boolean(lockedProposal)}
                secondary
                onPress={() => go(back[step]!)}
              />
            ) : null}
            {editing && onExit ? (
              <AppButton
                title="Back to Profile"
                secondary
                disabled={saving || busy || Boolean(lockedProposal)}
                onPress={onExit}
              />
            ) : null}
          </GlassCard>
        )}
      </AppScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    padding: spacing.md,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  brand: { ...typography.caption, color: colors.primary },
  card: { gap: spacing.md },
  title: { ...typography.title1, color: colors.textPrimary },
  sub: { ...typography.body, color: colors.textSecondary },
  support: { ...typography.footnote, color: colors.textSecondary },
  choice: { gap: spacing.xs },
  field: { gap: spacing.xs },
  label: { ...typography.subheadline, color: colors.textPrimary },
  input: {
    ...typography.body,
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
  },
  error: { ...typography.footnote, color: colors.danger },
});
