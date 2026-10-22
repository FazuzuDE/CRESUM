import { BrandHeader } from './BrandHeader';
import { LanguageSettings } from './LanguageSettings';
import { programEligibilityIssue } from '@/lib/training-programs/eligibility';
import { normalizeBirthDate } from '@/lib/personal-profile';
import { DatePickerSheet } from './DatePickerSheet';
import { calendarTime } from '@/lib/picker-date';
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
import { useLocalization } from './LocalizationProvider';
import { catalogLabel } from '@/lib/i18n/catalog';
import { formatDate } from '@/lib/i18n/format';
import { presentAppError } from '@/lib/i18n/errors';
import { AppError } from '@/lib/app-error';
import { programDayLabel } from '@/lib/i18n/program';

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
  const { t, locale } = useLocalization();
  const dateLabel = (date: string) =>
    formatDate(locale, new Date(`${date}T00:00:00`).getTime());
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
  const [birthPicker, setBirthPicker] = useState<{
    value: number;
    maximum: number;
    minimum: number;
  } | null>(null);
  const [lockedProposal, setLockedProposal] = useState<ProgramAssignment>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>('');
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
  let proposalError: unknown = '';
  let missingExercises: string[] | undefined;
  try {
    const eligibility = programEligibilityIssue(state.answers);
    if (eligibility) throw eligibility;
    if (base) {
      if (frequency !== undefined && frequency !== base.schedule[0].length)
        throw new AppError(
          'program_frequency',
          'No checked program for this frequency. Keep the recommended frequency or use manual setup.',
        );
      const program = offsets ? adjustProgramSchedule(base, offsets) : base;
      const readiness = projectProgramReadiness(program, exerciseLibrary);
      if (!readiness.ready) {
        missingExercises = readiness.blockers;
        throw new AppError(
          'program_missing_exercises',
          `Required exercises unavailable: ${readiness.blockers.join(', ')}`,
        );
      }
      proposal = makeAssignment(program, proposalId, startDate, reduced);
    } else
      proposalError = new AppError(
        'program_selection',
        'Choose a goal and experience to prepare your program.',
      );
  } catch (problem) {
    proposalError = problem;
  }
  if (lockedProposal) {
    proposal = lockedProposal;
    proposalError = '';
  }
  const complete = async () => {
    setSaving(true);
    setError('');
    try {
      if (!proposal) throw proposalError;
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
      setError(problem || true);
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
  const field = (label: string, name: 'heightCm' | 'bodyWeightKg') => (
    <View style={s.field} key={name}>
      <Text style={s.label}>{t('onboarding.optional', { label })}</Text>
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
        placeholder={t('onboarding.notProvided')}
        placeholderTextColor={colors.textTertiary}
        style={s.input}
        maxLength={32}
      />
    </View>
  );
  const back: Partial<Record<OnboardingStep, OnboardingStep>> = {
    goal: 'profile',
    experience: 'goal',
    environment: 'experience',
    profile: 'welcome',
    complete: 'experience',
    self_setup: 'welcome',
  };
  const continueFromProfile = () => {
    const { dateOfBirth, heightCm, bodyWeightKg } = state.answers;
    if (dateOfBirth?.trim() && !normalizeBirthDate(dateOfBirth)) {
      setError(
        new AppError(
          'invalid_birth_date',
          'Enter a valid date of birth, or leave it empty.',
        ),
      );
      return;
    }
    for (const [value, label, max, code] of [
      [heightCm, 'height', 300, 'invalid_height'],
      [bodyWeightKg, 'body weight', 1000, 'invalid_body_weight'],
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
        setError(
          new AppError(code, `Enter a valid ${label}, or leave it empty.`),
        );
        return;
      }
    }
    setError('');
    change({
      ...state,
      step:
        state.answers.goal && state.answers.experience ? 'complete' : 'goal',
      answers: {
        ...state.answers,
        dateOfBirth: dateOfBirth?.trim() ? normalizeBirthDate(dateOfBirth) : '',
        ...(dateOfBirth?.trim() ? { age: undefined } : {}),
      },
    });
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
        <BrandHeader tagline={false} />
        {state.step === 'welcome' ? <LanguageSettings /> : null}
        {step === 'self_setup' ? (
          <>
            <Text style={s.title} accessibilityRole="header">
              {t('onboarding.firstWorkout')}
            </Text>
            <Text style={s.sub}>{t('onboarding.firstWorkoutHelp')}</Text>
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
                  {t('onboarding.welcome')}
                </Text>
                <Text style={s.sub}>{t('onboarding.intro')}</Text>
                <View style={s.field}>
                  <Text style={s.label}>{t('onboarding.nameQuestion')}</Text>
                  <TextInput
                    accessibilityLabel={t('onboarding.name')}
                    value={state.answers.displayName ?? ''}
                    autoCapitalize="words"
                    autoComplete="given-name"
                    maxLength={80}
                    placeholder={t('onboarding.name')}
                    placeholderTextColor={colors.textTertiary}
                    style={s.input}
                    onChangeText={(displayName) => {
                      setError('');
                      change({
                        ...state,
                        answers: { ...state.answers, displayName },
                      });
                    }}
                  />
                </View>
                <AppButton
                  title={t('onboarding.continue')}
                  disabled={busy || !state.answers.displayName?.trim()}
                  onPress={() => {
                    const displayName = state.answers.displayName?.trim();
                    if (!displayName) {
                      setError(
                        new AppError(
                          'name_required',
                          'Enter your name to continue.',
                        ),
                      );
                      return;
                    }
                    change({
                      ...state,
                      step: 'profile',
                      answers: { ...state.answers, displayName },
                    });
                  }}
                />
              </>
            ) : null}
            {step === 'goal' ? (
              <>
                <Text style={s.title} accessibilityRole="header">
                  {t('onboarding.goal')}
                </Text>
                <Text style={s.sub}>{t('onboarding.goalHelp')}</Text>
                {option(
                  t('onboarding.muscle'),
                  'goal',
                  'build_muscle',
                  'experience',
                )}
                {option(
                  t('onboarding.strength'),
                  'goal',
                  'get_stronger',
                  'experience',
                )}
                {option(
                  t('onboarding.fitness'),
                  'goal',
                  'general_fitness',
                  'experience',
                )}
                {state.answers.goal ? (
                  <AppButton
                    title={t('onboarding.next')}
                    onPress={() => go('experience')}
                  />
                ) : null}
                <AppButton
                  title={t('onboarding.manual')}
                  secondary
                  onPress={() => go('self_setup')}
                />
              </>
            ) : null}
            {step === 'experience' ? (
              <>
                <Text style={s.title} accessibilityRole="header">
                  {t('onboarding.experience')}
                </Text>
                <Text style={s.sub}>{t('onboarding.experienceHelp')}</Text>
                {option(
                  t('onboarding.beginner'),
                  'experience',
                  'beginner',
                  'complete',
                )}
                {option(t('onboarding.some'), 'experience', 'some', 'complete')}
                {option(
                  t('onboarding.experienced'),
                  'experience',
                  'experienced',
                  'complete',
                )}
                {state.answers.experience ? (
                  <AppButton
                    title={t('onboarding.next')}
                    onPress={() => go('complete')}
                  />
                ) : null}
              </>
            ) : null}
            {step === 'profile' ? (
              <>
                <Text style={s.title} accessibilityRole="header">
                  {t('onboarding.body')}
                </Text>
                <Text style={s.sub}>{t('onboarding.bodyHelp')}</Text>
                <View style={s.field}>
                  <Text style={s.label}>
                    {t('onboarding.optional', { label: t('onboarding.birth') })}
                  </Text>
                  <AppButton
                    title={
                      normalizeBirthDate(state.answers.dateOfBirth ?? '')
                        ? formatDate(
                            locale,
                            new Date(
                              `${normalizeBirthDate(state.answers.dateOfBirth ?? '')}T00:00:00`,
                            ).getTime(),
                          )
                        : t('onboarding.chooseDate')
                    }
                    accessibilityLabel={t('onboarding.birth')}
                    secondary
                    onPress={() => {
                      const today = new Date();
                      const maximum = calendarTime(
                        today.getFullYear(),
                        today.getMonth(),
                        today.getDate(),
                      );
                      const stored = normalizeBirthDate(
                        state.answers.dateOfBirth ?? '',
                      );
                      setBirthPicker({
                        maximum,
                        minimum: calendarTime(today.getFullYear() - 120, 0, 1),
                        value: stored
                          ? new Date(`${stored}T00:00:00`).getTime()
                          : calendarTime(
                              today.getFullYear() - 18,
                              today.getMonth(),
                              today.getDate(),
                            ),
                      });
                    }}
                  />
                </View>
                {field(t('onboarding.height'), 'heightCm')}
                {field(t('onboarding.weight'), 'bodyWeightKg')}
                <AppButton
                  title={
                    state.answers.dateOfBirth ||
                    state.answers.heightCm ||
                    state.answers.bodyWeightKg
                      ? t('onboarding.continue')
                      : t('onboarding.skipBody')
                  }
                  onPress={continueFromProfile}
                />
              </>
            ) : null}
            {step === 'complete' ? (
              <>
                <Text style={s.title} accessibilityRole="header">
                  {proposal ? t('onboarding.ready') : t('onboarding.review')}
                </Text>
                {proposal ? (
                  <>
                    <Text style={s.label}>
                      {catalogLabel(
                        locale,
                        'program',
                        proposal.program.id,
                        proposal.program.name,
                      )}
                    </Text>
                    <Text style={s.sub}>
                      {t('onboarding.summary', {
                        count: proposal.program.schedule[0].length,
                        date: dateLabel(proposal.startDate),
                      })}
                    </Text>
                    <Text style={s.support}>{t('onboarding.attribution')}</Text>
                    <AppButton
                      title={
                        preview
                          ? t('onboarding.hideProgram')
                          : t('onboarding.viewProgram')
                      }
                      secondary
                      onPress={() => setPreview(!preview)}
                    />
                    {preview ? (
                      <View style={s.field}>
                        {proposal.program.schedule.map((week, i) => (
                          <Text key={i} style={s.label}>
                            {t('onboarding.week', {
                              index: i + 1,
                              schedule: week
                                .map((slot) =>
                                  t('onboarding.slot', {
                                    key: slot.dayKey,
                                    date: dateLabel(
                                      addCalendarDays(
                                        proposal!.startDate,
                                        i * 7 + slot.offset,
                                      ),
                                    ),
                                  }),
                                )
                                .join(' / '),
                            })}
                          </Text>
                        ))}
                        {proposal.program.days.map((day) => (
                          <View key={day.key} style={s.field}>
                            <Text style={s.label}>
                              {t('onboarding.day', {
                                key: day.key,
                                name: programDayLabel(t, day.key, day.name),
                              })}
                            </Text>
                            {day.movements.map((m) => (
                              <Text key={m.exerciseId} style={s.support}>
                                {t(
                                  m.perSide
                                    ? 'onboarding.movementPerSide'
                                    : 'onboarding.movement',
                                  {
                                    name: catalogLabel(
                                      locale,
                                      'exercise',
                                      m.exerciseId,
                                      findExercise(m.exerciseId)?.name ??
                                        m.exerciseId,
                                    ),
                                    sets: m.sets,
                                    min: m.repMin,
                                    max: m.repMax,
                                    restMin: m.restMin,
                                    restMax: m.restMax,
                                  },
                                )}
                              </Text>
                            ))}
                          </View>
                        ))}
                        <Text style={s.support}>{t('onboarding.warmup')}</Text>
                        {proposal.program.cardio.length ? (
                          <Text style={s.support}>
                            {t('onboarding.cardio')}
                          </Text>
                        ) : null}
                      </View>
                    ) : null}
                  </>
                ) : (
                  <Text accessibilityRole="alert" style={s.error}>
                    {missingExercises
                      ? t('onboarding.missing', {
                          exercises: missingExercises
                            .map((id) =>
                              catalogLabel(
                                locale,
                                'exercise',
                                id,
                                findExercise(id)?.name ?? id,
                              ),
                            )
                            .join(', '),
                        })
                      : presentAppError(
                          t,
                          proposalError,
                          'error.programProposal',
                        )}
                  </Text>
                )}
                <AppButton
                  title={
                    scheduleOpen
                      ? t('onboarding.hideSchedule')
                      : t('onboarding.schedule')
                  }
                  secondary
                  disabled={saving || Boolean(lockedProposal)}
                  onPress={() => setScheduleOpen(!scheduleOpen)}
                />
                {scheduleOpen && base ? (
                  <View style={s.field}>
                    <AppButton
                      title={t('onboarding.startDateValue', {
                        date: dateLabel(startDate),
                      })}
                      secondary
                      disabled={saving || Boolean(lockedProposal)}
                      onPress={() => setDateOpen(!dateOpen)}
                    />
                    {dateOpen ? (
                      <DatePickerSheet
                        title={t('onboarding.startDate')}
                        value={new Date(`${startDate}T00:00:00`).getTime()}
                        onCancel={() => setDateOpen(false)}
                        onConfirm={(time) => {
                          setStartDate(localDate(new Date(time)));
                          setDateOpen(false);
                        }}
                      />
                    ) : null}
                    <Text style={s.label}>{t('onboarding.frequency')}</Text>
                    {[2, 3, 4].map((n) => (
                      <AppButton
                        key={n}
                        title={t('onboarding.workouts', { count: n })}
                        secondary
                        selected={(frequency ?? base.schedule[0].length) === n}
                        disabled={saving || Boolean(lockedProposal)}
                        onPress={() => setFrequency(n)}
                      />
                    ))}
                    <Text style={s.support}>
                      {t('onboarding.frequencyHelp')}
                    </Text>
                    {base.schedule[0].map((slot, i) => (
                      <View key={i} style={s.field}>
                        <Text style={s.label}>
                          {t('onboarding.sessionDay', { index: i + 1 })}
                        </Text>
                        <TextInput
                          accessibilityLabel={t('onboarding.sessionDayLabel', {
                            index: i + 1,
                          })}
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
                      reduced ? t('onboarding.reduced') : t('onboarding.reduce')
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
                      ? t('onboarding.retryStart')
                      : saving
                        ? t('onboarding.saving')
                        : t('onboarding.start')
                  }
                  disabled={!proposal || saving || busy}
                  onPress={() => void complete()}
                />
                {!lockedProposal ? (
                  <AppButton
                    title={t('onboarding.manual')}
                    secondary
                    disabled={saving || busy}
                    onPress={() => go('self_setup')}
                  />
                ) : null}
                {lockedProposal && error && onExit ? (
                  <AppButton
                    title={t('onboarding.openSaved')}
                    secondary
                    disabled={saving || busy}
                    onPress={onExit}
                  />
                ) : null}
              </>
            ) : null}
            {error ? (
              <Text style={s.error} accessibilityRole="alert">
                {presentAppError(t, error, 'error.programSave')}
              </Text>
            ) : null}
            {back[step] ? (
              <AppButton
                title={t('onboarding.back')}
                disabled={saving || busy || Boolean(lockedProposal)}
                secondary
                onPress={() => go(back[step]!)}
              />
            ) : null}
            {editing && onExit ? (
              <AppButton
                title={t('onboarding.backProfile')}
                secondary
                disabled={saving || busy || Boolean(lockedProposal)}
                onPress={onExit}
              />
            ) : null}
          </GlassCard>
        )}
      </AppScrollView>
      {birthPicker ? (
        <DatePickerSheet
          title={t('onboarding.birth')}
          value={birthPicker.value}
          maximum={birthPicker.maximum}
          minimum={birthPicker.minimum}
          onCancel={() => setBirthPicker(null)}
          onConfirm={(time) => {
            setError('');
            change({
              ...state,
              answers: {
                ...state.answers,
                dateOfBirth: localDate(new Date(time)),
                age: undefined,
              },
            });
            setBirthPicker(null);
          }}
          onClear={() => {
            change({
              ...state,
              answers: { ...state.answers, dateOfBirth: '' },
            });
            setBirthPicker(null);
          }}
        />
      ) : null}
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
