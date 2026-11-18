import {
  LocalizedText as Text,
  LocalizedTextInput as TextInput,
  DirectionalIcon as Ionicons,
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
import { ContentScrollView } from './ContentScrollView';
import { useRef, useState } from 'react';

import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
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

const decimalDigits = Array.from({ length: 10 }, (_, i) => String(i));

const maxContentWidth = 600;
const welcomeArtworkRatio = 852 / 822;

const onboardingArtwork = {
  welcome: require('../assets/onboarding/welcome.webp'),
  profile: require('../assets/onboarding/body-details.webp'),
  start_path: require('../assets/onboarding/start-path.webp'),
  goal: require('../assets/onboarding/training-goal.webp'),
  complete: require('../assets/onboarding/plan-review.webp'),
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
  const dateLabel = (date: string) =>
    formatDate(locale, new Date(`${date}T00:00:00`).getTime());
  const [state, setState] = useState(() =>
    initial.step === 'environment' || (editing && initial.step === 'character')
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
  const [openWorkout, setOpenWorkout] = useState<number>();
  const completing = useRef(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
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
  const complete = async (manual = false) => {
    if (completing.current || busy) return;
    completing.current = true;
    setSaving(true);
    setError('');
    try {
      if (!manual && !proposal) throw proposalError;
      if (!manual) setLockedProposal(proposal);
      const answers = { ...state.answers };
      if (manual) {
        delete answers.goal;
        delete answers.experience;
      } else {
        answers.environment = 'gym';
      }
      await onComplete(
        {
          ...state,
          status: 'completed',
          step: 'complete',
          answers,
        },
        manual ? undefined : proposal,
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
  const FlowScroll = polished ? ContentScrollView : AppScrollView;
  const Frame = polished ? View : GlassCard;
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
      <BrandHeader tagline={false} />
      {previous ? (
        <Pressable
          testID="onboarding-back"
          accessibilityRole="button"
          accessibilityLabel={t('onboarding.back')}
          accessibilityState={{ disabled: navigationDisabled }}
          disabled={navigationDisabled}
          onPress={() => {
            setError('');
            go(previous);
          }}
          style={s.characterBack}
        >
          <Ionicons name="chevron-back" size={26} color={colors.primary} />
        </Pressable>
      ) : null}
      {showLanguage ? (
        <View style={s.headerLanguage}>
          <LanguageSettings compact />
        </View>
      ) : null}
    </View>
  );
  const movementLabel = (
    m: ProgramAssignment['program']['days'][number]['movements'][number],
  ) =>
    t(m.perSide ? 'onboarding.movementPerSide' : 'onboarding.movement', {
      name: catalogLabel(
        locale,
        'exercise',
        m.exerciseId,
        findExercise(m.exerciseId)?.name ?? m.exerciseId,
      ),
      sets: m.sets,
      min: m.repMin,
      max: m.repMax,
      restMin: m.restMin,
      restMax: m.restMax,
    });
  if (step === 'character') {
    return (
      <ContentScrollView
        style={[s.root, s.white]}
        safeAreaEdges={['top', 'bottom']}
        contentContainerStyle={[s.content, s.characterContent]}
      >
        {header('welcome')}
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
        contentContainerStyle={[s.content, polished && s.polishedContent]}
      >
        {polished ? (
          header(backTarget, step === 'welcome')
        ) : (
          <BrandHeader tagline={false} />
        )}
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
                      setOffsets(undefined);
                      setFrequency(undefined);
                      setReduced(false);
                      setPreview(false);
                      setScheduleOpen(false);
                      setOpenWorkout(undefined);
                      change({ ...state, answers: { ...state.answers, goal } });
                    }}
                  />
                ))}
                <View style={polished && s.footer}>
                  <AppButton
                    title={t('onboarding.continue')}
                    disabled={!state.answers.goal || navigationDisabled}
                    onPress={() =>
                      change({
                        ...state,
                        step: 'complete',
                        answers: {
                          ...state.answers,
                          experience: state.answers.experience ?? 'beginner',
                        },
                      })
                    }
                  />
                </View>
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
                <Text
                  style={[s.title, polished && s.center]}
                  accessibilityRole="header"
                >
                  {proposal
                    ? t(
                        state.answers.goal === 'get_stronger'
                          ? 'onboarding.strengthPlan'
                          : 'onboarding.trainingPlan',
                      )
                    : t('onboarding.review')}
                </Text>
                {proposal ? (
                  <>
                    <Text style={[s.sub, polished && s.center]}>
                      {t('onboarding.weeklyCount', {
                        count: proposal.program.schedule[0].length,
                      })}
                    </Text>
                    {polished ? artwork('complete') : null}
                    <Text style={s.scheduleTitle} accessibilityRole="header">
                      {t('onboarding.weeklySchedule')}
                    </Text>
                    <View style={s.bodyGroup}>
                      {proposal.program.schedule[0].map((slot, index) => {
                        const day = proposal?.program.days.find(
                          (entry) => entry.key === slot.dayKey,
                        );
                        if (!day) return null;
                        const focus = [
                          ...new Set(
                            day.movements.flatMap(
                              (m) =>
                                findExercise(m.exerciseId)?.primaryMuscles ??
                                [],
                            ),
                          ),
                        ].slice(0, 3);
                        return (
                          <View
                            key={slot.offset}
                            style={index > 0 ? s.bodyDivider : undefined}
                          >
                            <AppButton
                              title={t('onboarding.workoutIndex', {
                                index: index + 1,
                              })}
                              detail={
                                focus.length
                                  ? focus
                                      .map((id) =>
                                        catalogLabel(locale, 'muscle', id, id),
                                      )
                                      .join(' · ')
                                  : programDayLabel(t, day.key, day.name)
                              }
                              presentation="row"
                              secondary
                              onPress={() =>
                                setOpenWorkout(
                                  openWorkout === index ? undefined : index,
                                )
                              }
                            />
                            {openWorkout === index ? (
                              <View style={s.workoutDetails}>
                                <Text style={s.label}>
                                  {programDayLabel(t, day.key, day.name)}
                                </Text>
                                {day.movements.map((m) => (
                                  <Text key={m.exerciseId} style={s.support}>
                                    {movementLabel(m)}
                                  </Text>
                                ))}
                              </View>
                            ) : null}
                          </View>
                        );
                      })}
                    </View>
                    {openWorkout !== undefined || editing ? (
                      <AppButton
                        title={
                          preview
                            ? t('onboarding.hideProgram')
                            : t('onboarding.viewProgram')
                        }
                        secondary
                        onPress={() => setPreview(!preview)}
                      />
                    ) : null}
                    {preview && (openWorkout !== undefined || editing) ? (
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
                                {movementLabel(m)}
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
                {openWorkout !== undefined || editing ? (
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
                ) : null}
                {scheduleOpen &&
                base &&
                (openWorkout !== undefined || editing) ? (
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
                {base?.firstSessionSetCap &&
                (openWorkout !== undefined || editing) ? (
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
                <View style={polished && s.footer}>
                  <AppButton
                    title={
                      error && lockedProposal
                        ? t('onboarding.retryStart')
                        : saving
                          ? t('onboarding.saving')
                          : t('onboarding.begin')
                    }
                    disabled={!proposal || saving || busy}
                    onPress={() => void complete()}
                  />
                </View>
                {!lockedProposal && (!proposal || editing) ? (
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
            {!polished && backTarget ? (
              <AppButton
                title={t('onboarding.back')}
                disabled={saving || busy || Boolean(lockedProposal)}
                secondary
                onPress={() => go(backTarget)}
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

const s = StyleSheet.create({
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
  characterHeader: { justifyContent: 'center', minHeight: 44 },
  headerLanguage: { position: 'absolute', right: 0 },
  characterBack: {
    position: 'absolute',
    left: 0,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
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
