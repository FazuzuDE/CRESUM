import {
  createThemedStyles,
  useAppColors,
} from '@/components/AppThemeProvider';
import {
  LocalizedText as Text,
  LocalizedTextInput as TextInput,
} from '@/components/LayoutDirection';
import { AppPicker } from './AppPicker';
import { WheelPickerSheet } from './WheelPickerSheet';
import { BrandHeader } from './BrandHeader';
import { LanguageSettings } from './LanguageSettings';
import { ExerciseCharacterPicker } from './ExerciseCharacterPicker';
import { programEligibilityIssue } from '@/lib/training-programs/eligibility';
import { normalizeBirthDate } from '@/lib/personal-profile';
import { DatePickerSheet } from './DatePickerSheet';
import { calendarTime } from '@/lib/picker-date';
import { starterProgram } from '@/lib/training-programs/selectors';
import { projectProgramReadiness } from '@/lib/training-programs/readiness';
import {
  makeAssignment,
  type ProgramAssignment,
} from '@/lib/training-programs/assignment';
import {
  localDate,
  recurringProgramSchedule,
} from '@/lib/training-programs/schedule';
import { exerciseLibrary, findExercise } from '@/lib/exercise-library';
import { AppScrollView } from './AppScrollView';
import { ContentScrollView } from './ContentScrollView';
import { useRef, useState } from 'react';

import {
  Image,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  View,
} from 'react-native';
import { AppButton } from './AppButton';
import { GlassCard } from './GlassCard';
import { TemplateEditor } from './TemplateEditor';
import type { OnboardingState, OnboardingStep } from '@/lib/onboarding';
import type { TemplateMutationResult } from '@/lib/workout-store';
import type { TemplateDraft } from '@/lib/workout-templates';
import { radius, spacing, typography } from '@/lib/theme';
import { useLocalization } from './LocalizationProvider';
import { catalogLabel } from '@/lib/i18n/catalog';
import { formatDate } from '@/lib/i18n/format';
import { presentAppError } from '@/lib/i18n/errors';
import { AppError } from '@/lib/app-error';
import { programTitle } from '@/lib/i18n/program';
import { StarterProgramReview } from './StarterProgramReview';
import { StarterProgramSchedule } from './StarterProgramSchedule';
import type { WorkoutSession } from '@/lib/workout-model';

const decimalDigits = Array.from({ length: 10 }, (_, i) => String(i));

const maxContentWidth = 600;
const welcomeArtworkRatio = 852 / 822;

const onboardingArtwork = {
  welcome: require('../assets/onboarding/welcome.webp'),
  profile: require('../assets/onboarding/body-details.webp'),
  start_path: require('../assets/onboarding/start-path.webp'),
  goal: require('../assets/onboarding/training-goal.webp'),
};

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
  history?: readonly WorkoutSession[];
};

export function Onboarding({
  state: initial,
  editing = false,
  busy,
  onChange,
  onComplete,
  onCreateWorkout,
  onExit,
  history = [],
}: Props) {
  const colors = useAppColors();
  const s = useStyles();
  const { t, locale } = useLocalization();
  const { width, height } = useWindowDimensions();
  const welcomeArtworkWidth = Math.min(width, maxContentWidth);
  const welcomeArtworkNaturalHeight = welcomeArtworkWidth / welcomeArtworkRatio;
  const welcomeArtworkHeight = Math.min(
    welcomeArtworkNaturalHeight,
    Math.max(welcomeArtworkNaturalHeight * 0.82, height * 0.39),
  );
  const artworkHeights = {
    profile: Math.min(290, width * 0.66),
    start_path: Math.min(330, height * 0.4),
    goal: Math.min(265, height * 0.29),
  };
  const [state, setState] = useState(() =>
    initial.step === 'environment' || (editing && initial.step === 'character')
      ? { ...initial, step: 'profile' as const }
      : initial,
  );
  const [proposalId] = useState(
    () =>
      `accept-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
  );
  const completing = useRef(false);
  const weekdays = state.answers.scheduleWeekdays ?? [];
  const today = new Date();
  const [birthPicker, setBirthPicker] = useState<{
    value: number;
    maximum: number;
    minimum: number;
  } | null>(null);
  const [measurement, setMeasurement] = useState<{
    field: 'heightCm' | 'bodyWeightKg';
    tenths: number;
    whole: string[];
  }>();
  const [lockedProposal, setLockedProposal] = useState<ProgramAssignment>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>('');
  const change = (next: OnboardingState) => {
    setState(next);
    onChange(next);
  };
  const go = (step: OnboardingStep) => change({ ...state, step });
  const base = state.answers.goal
    ? starterProgram(state.answers.goal, state.answers.experience ?? 'beginner')
    : undefined;
  let proposal: ProgramAssignment | undefined;
  let proposalError: unknown = '';
  let missingExercises: string[] | undefined;
  if (state.step === 'complete' || state.step === 'schedule') {
    try {
      const eligibility = programEligibilityIssue(state.answers);
      if (eligibility) throw eligibility;
      if (!base)
        throw new AppError(
          'program_selection',
          'Choose a goal to prepare your program.',
        );
      const readiness = projectProgramReadiness(base, exerciseLibrary);
      if (!readiness.ready) {
        missingExercises = readiness.blockers;
        throw new AppError(
          'program_missing_exercises',
          'Required exercises are unavailable.',
        );
      }
      if (state.step === 'schedule' && weekdays.length === 3) {
        const { program, startDate } = recurringProgramSchedule(
          base,
          weekdays,
          today,
        );
        proposal = makeAssignment(program, proposalId, startDate);
      }
    } catch (problem) {
      proposalError = problem;
    }
  }
  if (lockedProposal) {
    proposal = lockedProposal;
    proposalError = '';
  }
  const complete = async (manual = false, skipSchedule = false) => {
    if (completing.current || busy) return;
    completing.current = true;
    setSaving(true);
    setError('');
    try {
      const accepted =
        lockedProposal ??
        (skipSchedule && base && !proposalError
          ? makeAssignment(base, proposalId, localDate(today), false, true)
          : proposal);
      if (!manual && !accepted) throw proposalError;
      if (!manual) setLockedProposal(accepted);
      const answers = { ...state.answers };
      if (manual) {
        delete answers.goal;
        delete answers.experience;
        delete answers.scheduleWeekdays;
      } else {
        answers.environment = 'gym';
        answers.scheduleWeekdays = accepted?.scheduleSkipped
          ? []
          : [...weekdays];
      }
      await onComplete(
        {
          ...state,
          status: 'completed',
          step: 'complete',
          answers,
        },
        manual ? undefined : accepted,
      );
    } catch (problem) {
      setError(problem || true);
    } finally {
      completing.current = false;
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
        change({
          ...state,
          step: next,
          answers: { ...state.answers, [field]: value },
        });
      }}
    />
  );
  const field = (
    label: string,
    name: 'heightCm' | 'bodyWeightKg',
    row: boolean,
  ) => {
    const height = name === 'heightCm';
    const value = state.answers[name] ?? '';
    const unit = t(height ? 'onboarding.cm' : 'onboarding.kg');
    if (row) {
      return (
        <View style={[s.bodyRow, s.bodyDivider]}>
          <Text style={s.label}>
            {t(height ? 'onboarding.heightLabel' : 'onboarding.weightLabel')}
          </Text>
          <AppButton
            title={`${value || '—'} ${unit}`}
            accessibilityLabel={label}
            presentation="text"
            secondary
            onPress={() => {
              const max = height ? 300 : 1000;
              const number = Number(value.replace(',', '.'));
              setMeasurement({
                field: name,
                tenths:
                  number > 0
                    ? Math.min(max * 10, Math.round(number * 10))
                    : height
                      ? 1700
                      : 700,
                whole: Array.from({ length: max + 1 }, (_, i) => String(i)),
              });
            }}
          />
        </View>
      );
    }
    return (
      <View style={s.field}>
        <Text style={s.label}>{t('onboarding.optional', { label })}</Text>
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={(next) => {
            setError('');
            change({ ...state, answers: { ...state.answers, [name]: next } });
          }}
          keyboardType="decimal-pad"
          placeholder={t('onboarding.notProvided')}
          placeholderTextColor={colors.textTertiary}
          style={s.input}
          maxLength={32}
        />
      </View>
    );
  };
  const back: Partial<Record<OnboardingStep, OnboardingStep>> = {
    start_path: 'profile',
    goal: 'start_path',
    experience: 'goal',
    environment: 'experience',
    profile: editing ? 'welcome' : 'character',
    character: 'welcome',
    complete: 'goal',
    schedule: 'complete',
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
      step: editing
        ? state.answers.goal && state.answers.experience
          ? 'complete'
          : 'goal'
        : 'start_path',
      answers: {
        ...state.answers,
        dateOfBirth: dateOfBirth?.trim() ? normalizeBirthDate(dateOfBirth) : '',
        ...(dateOfBirth?.trim() ? { age: undefined } : {}),
      },
    });
  };
  const step = state.step;
  const polished = !editing && step in onboardingArtwork;
  const FlowScroll =
    polished || step === 'complete' || step === 'schedule'
      ? ContentScrollView
      : AppScrollView;
  const Frame = polished || step === 'schedule' ? View : GlassCard;
  const backTarget = editing && step === 'goal' ? 'profile' : back[step];
  const navigationDisabled = saving || busy || Boolean(lockedProposal);
  const artwork = (key: keyof typeof onboardingArtwork) => (
    <Image
      source={onboardingArtwork[key]}
      resizeMode={key === 'welcome' ? 'cover' : 'contain'}
      accessible={false}
      style={
        key === 'welcome'
          ? [
              s.welcomeArtwork,
              {
                width: welcomeArtworkWidth,
                height: welcomeArtworkHeight,
              },
            ]
          : [
              s.artwork,
              key === 'profile' || key === 'start_path' || key === 'goal'
                ? { height: artworkHeights[key] }
                : undefined,
            ]
      }
    />
  );
  const header = (previous?: OnboardingStep, showLanguage = false) => (
    <View style={s.characterHeader}>
      <BrandHeader
        back={
          previous
            ? {
                scope: step,
                testID: 'onboarding-back',
                accessibilityLabel: t('onboarding.back'),
                disabled: navigationDisabled,
                onPress: () => {
                  setError('');
                  go(previous);
                },
              }
            : editing && onExit
              ? {
                  scope: step,
                  accessibilityLabel: t('onboarding.backProfile'),
                  disabled: navigationDisabled,
                  onPress: onExit,
                }
              : undefined
        }
      />
      {showLanguage ? (
        <View style={s.headerLanguage}>
          <LanguageSettings compact />
        </View>
      ) : null}
    </View>
  );
  if (step === 'character') {
    return (
      <ContentScrollView
        style={[s.root, s.white]}
        safeAreaEdges={['top', 'bottom']}
        fixedHeader={header('welcome')}
        contentContainerStyle={[s.content, s.characterContent]}
      >
        <ExerciseCharacterPicker
          value={state.answers.artworkModel}
          disabled={busy || saving}
          previews
          onChange={(artworkModel) =>
            change({
              ...state,
              answers: { ...state.answers, artworkModel },
            })
          }
        />
        <AppButton
          title={t('onboarding.continue')}
          disabled={busy || saving || !state.answers.artworkModel}
          onPress={() => {
            if (state.answers.artworkModel) go('profile');
          }}
        />
        {error ? (
          <Text style={s.error} accessibilityRole="alert">
            {presentAppError(t, error, 'error.programSave')}
          </Text>
        ) : null}
      </ContentScrollView>
    );
  }
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[s.root, polished && s.white]}
    >
      <FlowScroll
        key={step}
        style={s.root}
        safeAreaEdges={['top', 'bottom']}
        keyboardShouldPersistTaps="handled"
        fixedHeader={header(backTarget, polished && step === 'welcome')}
        contentContainerStyle={[s.content, polished && s.polishedContent]}
      >
        {step === 'welcome' && !polished ? <LanguageSettings /> : null}
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
          <Frame style={polished ? s.polishedFrame : s.card}>
            {step === 'welcome' ? (
              <>
                {polished ? (
                  <View style={s.welcomeArtworkFrame}>
                    {artwork('welcome')}
                  </View>
                ) : null}
                <Text
                  style={[s.title, polished && s.center]}
                  accessibilityRole="header"
                >
                  {t('onboarding.welcome')}
                </Text>
                <Text style={[s.sub, polished && s.center]}>
                  {t(
                    polished ? 'onboarding.welcomeTagline' : 'onboarding.intro',
                  )}
                </Text>
                <View
                  testID="onboarding-name-slot"
                  style={[s.field, polished && s.centeredSlot]}
                >
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
                <View style={polished && s.footerSpacing}>
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
                        step: editing ? 'profile' : 'character',
                        answers: { ...state.answers, displayName },
                      });
                    }}
                  />
                </View>
              </>
            ) : null}
            {step === 'start_path' ? (
              <>
                <Text style={[s.title, s.center]} accessibilityRole="header">
                  {t('onboarding.startPath')}
                </Text>
                {artwork('start_path')}
                <View
                  testID="onboarding-start-choices"
                  style={[s.centeredSlot, s.startChoices]}
                >
                  <AppButton
                    presentation="choice"
                    highlighted
                    title={t('onboarding.findProgram')}
                    detail={t('onboarding.findProgramHelp')}
                    disabled={saving || busy}
                    onPress={() => {
                      setError('');
                      go('goal');
                    }}
                  />
                  <AppButton
                    presentation="choice"
                    title={t('onboarding.startOwn')}
                    detail={t('onboarding.startOwnHelp')}
                    disabled={saving || busy}
                    onPress={() => void complete(true)}
                  />
                </View>
              </>
            ) : null}
            {step === 'goal' ? (
              <>
                <Text
                  style={[s.title, polished && s.center]}
                  accessibilityRole="header"
                >
                  {t('onboarding.goalQuestion')}
                </Text>
                <Text style={[s.sub, polished && s.center]}>
                  {t('onboarding.goalHelp')}
                </Text>
                {polished ? artwork('goal') : null}
                {(
                  [
                    ['universal', 'program.universal'],
                    ['build_muscle', 'onboarding.muscle'],
                    ['get_stronger', 'onboarding.strength'],
                    ['lose_weight', 'onboarding.loseWeight'],
                    ['general_fitness', 'onboarding.fitness'],
                  ] as const
                ).map(([goal, label]) => (
                  <AppButton
                    key={goal}
                    presentation="choice"
                    title={t(label)}
                    selected={state.answers.goal === goal}
                    disabled={navigationDisabled}
                    onPress={() => {
                      setError('');
                      change({
                        ...state,
                        step: 'complete',
                        answers: {
                          ...state.answers,
                          goal,
                          experience: state.answers.experience ?? 'beginner',
                        },
                      });
                    }}
                  />
                ))}
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
                <Text
                  style={[s.title, polished && s.center]}
                  accessibilityRole="header"
                >
                  {t('onboarding.body')}
                </Text>
                <Text style={[s.sub, polished && s.center]}>
                  {t(
                    polished
                      ? 'onboarding.bodyOptionalHelp'
                      : 'onboarding.bodyHelp',
                  )}
                </Text>
                <View style={polished ? s.bodyGroup : s.field}>
                  <View style={polished ? s.bodyRow : s.field}>
                    <Text style={s.label}>
                      {polished
                        ? t('onboarding.birth')
                        : t('onboarding.optional', {
                            label: t('onboarding.birth'),
                          })}
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
                          : t(
                              polished
                                ? 'onboarding.select'
                                : 'onboarding.chooseDate',
                            )
                      }
                      accessibilityLabel={t('onboarding.birth')}
                      secondary
                      presentation={polished ? 'text' : 'button'}
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
                          minimum: calendarTime(
                            today.getFullYear() - 120,
                            0,
                            1,
                          ),
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
                  {field(t('onboarding.height'), 'heightCm', polished)}
                  {field(t('onboarding.weight'), 'bodyWeightKg', polished)}
                </View>
                {polished ? (
                  <View testID="onboarding-scale-slot" style={s.centeredSlot}>
                    {artwork('profile')}
                  </View>
                ) : null}
                <View style={polished && s.footerSpacing}>
                  <AppButton
                    title={
                      state.answers.dateOfBirth ||
                      state.answers.heightCm ||
                      state.answers.bodyWeightKg
                        ? t('onboarding.continue')
                        : t(
                            polished
                              ? 'onboarding.skipForNow'
                              : 'onboarding.skipBody',
                          )
                    }
                    onPress={continueFromProfile}
                  />
                </View>
              </>
            ) : null}
            {step === 'complete' ? (
              <>
                <Text style={s.title} accessibilityRole="header">
                  {t('onboarding.trainingPlan')}
                </Text>
                {base ? (
                  <Text style={s.sub}>{programTitle(t, locale, base)}</Text>
                ) : null}
                {base && !proposalError ? (
                  <>
                    <StarterProgramReview program={base} history={history} />
                    <AppButton
                      title={t('onboarding.configureSchedule')}
                      disabled={navigationDisabled}
                      onPress={() => go('schedule')}
                    />
                  </>
                ) : (
                  <>
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
                    <AppButton
                      title={t('onboarding.manual')}
                      secondary
                      onPress={() => go('self_setup')}
                    />
                  </>
                )}
              </>
            ) : null}
            {step === 'schedule' ? (
              <>
                <StarterProgramSchedule
                  today={today}
                  selected={weekdays}
                  disabled={saving || busy || !!proposalError}
                  changesDisabled={!!lockedProposal}
                  saving={saving || busy}
                  onToggle={(day) =>
                    change({
                      ...state,
                      answers: {
                        ...state.answers,
                        scheduleWeekdays: weekdays.includes(day)
                          ? weekdays.filter((item) => item !== day)
                          : [...weekdays, day],
                      },
                    })
                  }
                  onDone={() => void complete()}
                  onSkip={() => void complete(false, true)}
                  retrySkipped={!!lockedProposal?.scheduleSkipped}
                />
                {proposalError ? (
                  <Text accessibilityRole="alert" style={s.error}>
                    {presentAppError(t, proposalError, 'error.programProposal')}
                  </Text>
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

            {editing &&
            onExit &&
            backTarget &&
            step !== 'complete' &&
            step !== 'schedule' ? (
              <AppButton
                title={t('onboarding.backProfile')}
                secondary
                disabled={navigationDisabled}
                onPress={onExit}
              />
            ) : null}
          </Frame>
        )}
      </FlowScroll>
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
        />
      ) : null}
      {measurement ? (
        <WheelPickerSheet
          title={t(
            measurement.field === 'heightCm'
              ? 'onboarding.height'
              : 'onboarding.weight',
          )}
          onCancel={() => setMeasurement(undefined)}
          disabled={measurement.tenths === 0}
          onConfirm={() => {
            setError('');
            change({
              ...state,
              answers: {
                ...state.answers,
                [measurement.field]: String(measurement.tenths / 10),
              },
            });
            setMeasurement(undefined);
          }}
        >
          <AppPicker
            flexible
            columns={[
              measurement.whole,
              Math.floor(measurement.tenths / 10) ===
              measurement.whole.length - 1
                ? ['0']
                : decimalDigits,
            ]}
            selected={[
              Math.floor(measurement.tenths / 10),
              measurement.tenths % 10,
            ]}
            labels={[
              t(
                measurement.field === 'heightCm'
                  ? 'onboarding.cm'
                  : 'onboarding.kg',
              ),
              t('onboarding.decimalPart'),
            ]}
            onChange={(column, row) => {
              const next =
                column === 0
                  ? row * 10 + (measurement.tenths % 10)
                  : measurement.tenths - (measurement.tenths % 10) + row;
              setMeasurement({
                ...measurement,
                tenths: Math.min(next, (measurement.whole.length - 1) * 10),
              });
            }}
          />
        </WheelPickerSheet>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const useStyles = createThemedStyles((colors) => ({
  root: { flex: 1 },
  white: { backgroundColor: colors.surface },
  polishedContent: { flexGrow: 1, paddingBottom: spacing.md },
  polishedFrame: { flexGrow: 1, gap: spacing.md },
  footer: { marginTop: 'auto', paddingTop: spacing.sm },
  footerSpacing: { paddingTop: spacing.sm },
  centeredSlot: { flexGrow: 1, justifyContent: 'center' },
  startChoices: { gap: spacing.md },
  center: { textAlign: 'center' },
  artwork: { width: '100%', height: 190, alignSelf: 'center' },
  welcomeArtworkFrame: { marginHorizontal: -spacing.md },
  welcomeArtwork: { maxWidth: '100%', alignSelf: 'center' },
  bodyGroup: {
    borderColor: colors.separator,
    borderWidth: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  bodyDivider: { borderTopColor: colors.separator, borderTopWidth: 1 },
  bodyInput: {
    ...typography.body,
    flex: 1,
    minHeight: 44,
    color: colors.textPrimary,
    textAlign: 'right',
  },
  bodyUnit: { ...typography.body, color: colors.textSecondary },
  scheduleTitle: { ...typography.title3, color: colors.textPrimary },
  workoutDetails: { gap: spacing.xs, padding: spacing.md },
  content: {
    width: '100%',
    maxWidth: maxContentWidth,
    alignSelf: 'center',
    padding: spacing.md,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  characterContent: { flexGrow: 1, paddingBottom: spacing.md },
  characterHeader: {
    width: '100%',
    maxWidth: maxContentWidth,
    alignSelf: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  headerLanguage: { position: 'absolute', end: spacing.md },
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
}));
