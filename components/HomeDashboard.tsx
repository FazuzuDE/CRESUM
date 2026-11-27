import {
  createThemedStyles,
  useAppColors,
} from '@/components/AppThemeProvider';
import {
  LocalizedText as Text,
  DirectionalIcon as Ionicons,
} from '@/components/LayoutDirection';
import { HomeCalendar } from './HomeCalendar';
import { HomeLayoutEditor } from './HomeLayoutEditor';
import { useHomeLayout } from './useHomeLayout';
import {
  defaultHomeLayout,
  type HomeLayout,
  type HomeWidgetId,
} from '@/lib/home-layout';
import { HomeDragGrid } from './HomeDragGrid';
import { useProgramScroll } from './useProgramScroll';
import { TrainingProgramWeek } from './TrainingProgramWeek';
import { validPlannedSets } from '@/lib/planned-exercise';
import { ExerciseArtwork } from './ExerciseArtwork';
import { useExerciseCharacter } from './ExerciseCharacterProvider';
import { resolveExerciseArtwork } from '@/lib/exercise-artwork';
import { ScreenModal } from './ScreenModal';
import { WorkoutHistory } from './WorkoutHistory';
import { TemplateEditor } from './TemplateEditor';
import type { TemplateDraft } from '@/lib/workout-templates';
import type { TemplateMutationResult } from '@/lib/workout-store';
import { completedSetCount } from '@/lib/workout-engine';
import { volume } from '@/lib/workout-metrics';
import { localDate } from '@/lib/training-programs/schedule';
import type { ProgramAssignment } from '@/lib/training-programs/assignment';
import type { ProjectedProgramSlot } from '@/lib/training-programs/schedule';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppScrollView } from './AppScrollView';
import { useEffect, useRef, useState } from 'react';
import {
  AppState,
  BackHandler,
  Pressable,
  useWindowDimensions,
  View,
} from 'react-native';

import { AppButton } from './AppButton';
import type { DashboardGridItem } from './DashboardGrid';
import { GlassCard } from './GlassCard';
import {
  HOME_WIDGET_LAYOUT,
  projectHomeDashboard,
  shouldShowLatestWorkout,
  projectHomeProgram,
  templateDetails,
  type HomeTemplateDetails,
} from '@/lib/home-dashboard';
import type { WorkoutSession, WorkoutTemplate } from '@/lib/workout-model';
import { radius, spacing, typography } from '@/lib/theme';
import { useLocalization } from './LocalizationProvider';
import { formatDate, formatNumber } from '@/lib/i18n/format';
import { catalogLabel, workoutExerciseLabel } from '@/lib/i18n/catalog';
import {
  programDayLabel,
  programTitle,
  workoutTemplateLabel,
} from '@/lib/i18n/program';
import { findExercise } from '@/lib/exercise-library';
import type { Translate } from '@/lib/i18n/messages';
import type { AppLocale } from '@/lib/i18n/registry';

function templatePresentation(
  details: HomeTemplateDetails,
  t: Translate,
  locale: AppLocale,
) {
  const unavailable =
    details.template.exerciseIds.length - details.availableCount;
  return {
    count: unavailable
      ? t('home.availability', {
          available: details.stationCount ?? details.availableCount,
          unavailable,
        })
      : t('home.exercises', {
          count: details.stationCount ?? details.availableCount,
        }),
    preview: details.template.exerciseIds
      .flatMap((id, index) => {
        const group = details.template.plannedExercises?.find(
          (e) => e.exerciseId === id,
        )?.exerciseGroup;
        if (group) {
          const first = details.template.exerciseIds.findIndex(
            (other) =>
              details.template.plannedExercises?.find(
                (e) => e.exerciseId === other,
              )?.exerciseGroup?.id === group.id,
          );
          return first === index ? [group.name] : [];
        }
        const exercise = findExercise(id);
        return exercise
          ? [catalogLabel(locale, 'exercise', exercise.id, exercise.name)]
          : [];
      })
      .slice(0, 3)
      .join(' · '),
  };
}

type HomeProps = {
  displayName?: string;
  assignment?: ProgramAssignment | null;
  startProgramSlot?: (
    slot: ProjectedProgramSlot,
    template: WorkoutTemplate,
  ) => void;
  history: WorkoutSession[];
  activeWorkout: WorkoutSession | null;
  onResume: () => void;
  startTemplate: (template: WorkoutTemplate) => void;
  templates: WorkoutTemplate[];
  onOpenProfile?: () => void;
  onOpenProgress?: () => void;
  createTemplate?: (draft: TemplateDraft) => Promise<TemplateMutationResult>;
  busy?: boolean;
};

function PrimaryWorkoutWidget({
  state,
  onPreview,
  onAction,
  disabled,
}: {
  state: {
    badge: string;
    context?: string;
    title: string;
    meta?: string;
    preview?: string;
    imageKey?: string;
    action: string;
    progress?: number;
  };
  onPreview?: () => void;
  onAction: () => void;
  disabled: boolean;
}) {
  const colors = useAppColors();
  const s = useStyles();
  const { t } = useLocalization();
  const { width, fontScale } = useWindowDimensions();
  const { model } = useExerciseCharacter();
  const showArt =
    state.imageKey &&
    width >= 350 &&
    fontScale < 1.3 &&
    resolveExerciseArtwork(state.imageKey, 'start', model);
  return (
    <GlassCard style={s.hero}>
      <View style={s.heroTop}>
        <View style={s.badge}>
          <Ionicons name="barbell-outline" size={16} color={colors.primary} />
          <Text style={s.badgeText}>{state.badge}</Text>
        </View>
      </View>
      <View style={s.heroBody}>
        <View style={s.templateCopy}>
          {state.context ? <Text style={s.sub}>{state.context}</Text> : null}
          <Text style={s.heroTitle} accessibilityRole="header">
            {state.title}
          </Text>
          {state.meta ? <Text style={s.meta}>{state.meta}</Text> : null}
          {state.preview ? <Text style={s.sub}>{state.preview}</Text> : null}
        </View>
        {showArt && state.imageKey ? (
          <ExerciseArtwork imageKey={state.imageKey} size={112} />
        ) : null}
      </View>
      {state.progress !== undefined ? (
        <View style={s.progressTrack}>
          <View style={[s.progressFill, { flex: state.progress }]} />
          <View style={{ flex: 1 - state.progress }} />
        </View>
      ) : null}
      {onPreview ? (
        <AppButton
          title={t('plan.title')}
          secondary
          presentation="text"
          disabled={disabled}
          onPress={onPreview}
        />
      ) : null}
      <AppButton
        title={state.action}
        accessibilityLabel={state.action}
        disabled={disabled}
        onPress={onAction}
      />
    </GlassCard>
  );
}

function TrainingSummaryWidget({
  totalVolume,
  completedCount,
  onOpen,
}: {
  totalVolume: number;
  completedCount: number;
  onOpen?: () => void;
}) {
  const s = useStyles();
  const { t, locale } = useLocalization();
  const { width, fontScale } = useWindowDimensions();
  const [measuredWidth, setMeasuredWidth] = useState<number>();
  const available = measuredWidth ?? width - spacing.md * 2;
  const workouts = formatNumber(locale, completedCount);
  const inTonnes = totalVolume >= 1000;
  const volumeParams = {
    value: formatNumber(locale, inTonnes ? totalVolume / 1000 : totalVolume, {
      maximumFractionDigits: 6,
    }),
  };
  const volumeLabel = inTonnes
    ? t('home.tonnes', volumeParams)
    : t('home.kilograms', volumeParams);
  const workoutsLabel = t('stats.workouts');
  const totalLabel = t('home.totalVolume');
  // Keep the numbers intact. The unit can wrap at a locale's normal word boundary.
  const labelWidth =
    Math.max(workoutsLabel.length, totalLabel.length) *
    typography.footnote.fontSize *
    0.62;
  const valueWidth =
    Math.max(
      workouts.length,
      volumeParams.value.length,
      ...volumeLabel.split(/\s+/u).map((part) => part.length),
    ) *
    typography.title1.fontSize *
    0.62;
  const minTileWidth = Math.max(
    152,
    Math.max(labelWidth, valueWidth) * fontScale + spacing.md * 2,
  );
  const stacked = fontScale >= 1.3 || available < minTileWidth * 2 + spacing.sm;
  const tileStyle = stacked ? s.statCard : { ...s.statCard, ...s.statColumn };
  return (
    <View
      testID="home-summary"
      style={s.summary}
      onLayout={({ nativeEvent }) => setMeasuredWidth(nativeEvent.layout.width)}
    >
      <View style={s.heroTop}>
        <Text accessibilityRole="header" style={s.section}>
          {t('home.fourWeeks')}
        </Text>
        {onOpen ? (
          <AppButton
            title={t('nav.progress')}
            secondary
            presentation="text"
            onPress={onOpen}
          />
        ) : null}
      </View>
      {completedCount ? (
        <View
          testID="home-summary-tiles"
          style={[s.statPair, stacked && s.statStack]}
        >
          <GlassCard style={tileStyle}>
            <Text style={s.sub}>{workoutsLabel}</Text>
            <Text testID="home-summary-count" style={s.metric}>
              {workouts}
            </Text>
          </GlassCard>
          <GlassCard style={tileStyle}>
            <Text style={s.sub}>{totalLabel}</Text>
            <Text testID="home-summary-volume" style={s.metric}>
              {volumeLabel}
            </Text>
          </GlassCard>
        </View>
      ) : (
        <GlassCard>
          <Text style={s.sub}>{t('history.empty')}</Text>
        </GlassCard>
      )}
    </View>
  );
}

function TrainingWeekWidget({
  week,
  onOpenCalendar,
}: {
  week: ReturnType<typeof projectHomeDashboard>['week'];
  onOpenCalendar: (date?: number) => void;
}) {
  const colors = useAppColors();
  const s = useStyles();
  const { t, locale } = useLocalization();
  const { width } = useWindowDimensions();
  const [rowWidth, setRowWidth] = useState<number>();
  const available = rowWidth ?? width - spacing.md * 4;
  const diameter = Math.min(
    44,
    Math.max(
      1,
      Math.floor(
        (available - spacing.xxs * (week.days.length - 1)) / week.days.length,
      ),
    ),
  );
  const circleSize = { width: diameter, height: diameter };
  const innerDiameter = Math.max(1, diameter - spacing.xs);

  return (
    <GlassCard style={s.weekCard}>
      <View style={s.heroTop}>
        <Text style={s.section} accessibilityRole="header">
          {t('home.week')}
        </Text>
        <AppButton
          title={t('home.month')}
          accessibilityLabel={t('home.openCalendar')}
          secondary
          presentation="text"
          onPress={() => onOpenCalendar()}
        />
      </View>
      <View
        testID="home-week-days"
        style={s.weekDays}
        onLayout={({ nativeEvent }) => setRowWidth(nativeEvent.layout.width)}
      >
        {week.days.map((day) => (
          <Pressable
            key={day.timestamp}
            style={s.weekDay}
            accessibilityRole="button"
            onPress={() => onOpenCalendar(day.timestamp)}
            accessibilityLabel={t(day.isToday ? 'home.dayToday' : 'home.day', {
              date: formatDate(locale, day.timestamp, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              }),
              completed: t('home.completed', { count: day.completedCount }),
            })}
          >
            <Text style={s.dayLabel}>
              {formatDate(locale, day.timestamp, { weekday: 'short' })}
            </Text>
            <View
              testID="home-week-marker"
              style={[s.dayMarker, circleSize, day.isToday && s.todayCircle]}
            >
              <View
                testID="home-week-marker-fill"
                style={[
                  s.dayCircle,
                  day.isToday
                    ? { width: innerDiameter, height: innerDiameter }
                    : circleSize,
                  day.completedCount > 0 && s.completedCircle,
                ]}
              >
                {day.completedCount > 0 ? (
                  <Ionicons name="checkmark" size={20} color={colors.surface} />
                ) : (
                  <Text style={[s.dayNumber, day.isToday && s.todayNumber]}>
                    {day.dayOfMonth}
                  </Text>
                )}
              </View>
            </View>
          </Pressable>
        ))}
      </View>
    </GlassCard>
  );
}

function LatestWorkoutWidget({
  latest,
  onOpen,
}: {
  latest: ReturnType<typeof projectHomeDashboard>['latestWorkout'];
  onOpen: (id: string) => void;
}) {
  const s = useStyles();
  const { t, locale } = useLocalization();
  return latest ? (
    <GlassCard style={s.recent}>
      <Text style={s.cardLabel}>{t('home.last')}</Text>
      <Text style={s.recentName}>{latest.session.name}</Text>
      <Text style={s.sub}>
        {formatDate(locale, latest.session.finishedAt!, {
          dateStyle: 'medium',
        })}
      </Text>
      <Text style={s.sub}>
        {t('home.volume', { value: formatNumber(locale, latest.volume) })}
      </Text>
      <AppButton
        title={t('history.details')}
        onPress={() => onOpen(latest.session.id)}
        secondary
        presentation="text"
      />
    </GlassCard>
  ) : (
    <Text style={s.empty}>{t('home.empty')}</Text>
  );
}

function WorkoutTemplatesWidget({
  templates,
  activeWorkout,
  assignment,
  startTemplate,
}: {
  templates: HomeTemplateDetails[];
  activeWorkout: WorkoutSession | null;
  assignment?: ProgramAssignment | null;
  startTemplate: HomeProps['startTemplate'];
}) {
  const colors = useAppColors();
  const s = useStyles();
  const { t, locale } = useLocalization();
  return (
    <View style={s.templates}>
      <Text style={s.section} accessibilityRole="header">
        {activeWorkout ? t('home.templates') : t('home.moreTemplates')}
      </Text>
      {activeWorkout ? (
        <Text style={s.sub}>{t('home.finishFirst')}</Text>
      ) : null}
      {templates.map((details) => {
        const { template, availableCount } = details;
        const name = workoutTemplateLabel(t, locale, template, assignment);
        const { count, preview } = templatePresentation(details, t, locale);
        const canStart = !activeWorkout && availableCount > 0;
        return (
          <GlassCard key={template.id}>
            <View style={s.quick}>
              <View style={s.templateCopy}>
                <Text style={s.templateName}>{name}</Text>
                <Text style={s.sub}>{count}</Text>
                {preview ? (
                  <Text style={s.sub} accessibilityLabel={preview}>
                    {preview}
                  </Text>
                ) : null}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('home.startNamed', {
                  name,
                })}
                accessibilityHint={
                  activeWorkout
                    ? t('home.finishHint')
                    : canStart
                      ? undefined
                      : t('home.editTemplate')
                }
                accessibilityState={{ disabled: !canStart }}
                disabled={!canStart}
                onPress={canStart ? () => startTemplate(template) : undefined}
                style={({ pressed }) => [
                  s.templateAction,
                  (pressed || !canStart) && s.pressed,
                ]}
              >
                <Text style={s.templateActionText}>{t('home.start')}</Text>
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={colors.primary}
                />
              </Pressable>
            </View>
          </GlassCard>
        );
      })}
    </View>
  );
}

export function HomeDashboard({
  displayName,
  history,
  activeWorkout,
  onResume,
  startTemplate,
  templates,
  onOpenProfile,
  onOpenProgress,
  createTemplate,
  busy = false,
  assignment,
  startProgramSlot,
}: HomeProps) {
  const colors = useAppColors();
  const s = useStyles();
  const { t, locale } = useLocalization();
  const homeLayout = useHomeLayout();
  const [editingLayout, setEditingLayout] = useState(false);
  const [draft, setDraft] = useState<HomeLayout | null>(null);
  const draftRef = useRef<HomeLayout | null>(null);
  const {
    attachRef,
    control: dragScroll,
    dragging,
    onScroll: onHomeScroll,
    onLayout: onHomeScrollLayout,
    onContentSizeChange,
  } = useProgramScroll();
  function beginEditing() {
    if (
      homeLayout.loading ||
      homeLayout.saving ||
      homeLayout.loadError ||
      editingLayout
    )
      return false;
    if (!draftRef.current) {
      const next = {
        ...homeLayout.layout,
        widgets: homeLayout.layout.widgets.map((item) => ({ ...item })),
      };
      draftRef.current = next;
      setDraft(next);
      homeLayout.clearSaveError();
    }
    return true;
  }
  function cancelEditing() {
    if (homeLayout.saving) return;
    draftRef.current = null;
    setDraft(null);
    dragScroll.stop();
  }
  function moveBlock(id: HomeWidgetId, target: HomeWidgetId) {
    const current = draftRef.current;
    if (!current || homeLayout.saving) return;
    const from = current.widgets.findIndex((item) => item.id === id);
    const to = current.widgets.findIndex((item) => item.id === target);
    if (from < 0 || to < 0 || from === to) return;
    const widgets = [...current.widgets];
    widgets.splice(to, 0, widgets.splice(from, 1)[0]);
    const next = { version: 1 as const, widgets };
    draftRef.current = next;
    setDraft(next);
  }
  async function saveEditing(layout: HomeLayout) {
    if (await homeLayout.save(layout)) {
      draftRef.current = null;
      setDraft(null);
      setEditingLayout(false);
    }
  }
  useEffect(() => {
    if (!draft) return;
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!homeLayout.saving) {
        draftRef.current = null;
        setDraft(null);
        dragScroll.stop();
      }
      return true;
    });
    return () => back.remove();
  }, [draft, homeLayout.saving, dragScroll]);
  const guardedResume = () => {
    if (!draftRef.current) onResume();
  };
  const guardedStart = (template: WorkoutTemplate) => {
    if (!draftRef.current) startTemplate(template);
  };
  const guardedProfile = onOpenProfile
    ? () => {
        if (!draftRef.current) onOpenProfile();
      }
    : undefined;
  const [now, setNow] = useState(Date.now);
  const [calendarDate, setCalendarDate] = useState<number>();
  const [resultId, setResultId] = useState<string>();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const openResult = (id: string) => {
    if (!draftRef.current) setResultId(id);
  };
  const [gridTop, setGridTop] = useState(0);
  const [rowOffsets, setRowOffsets] = useState<Record<string, number>>({});
  useEffect(() => {
    const refresh = () => setNow(Date.now());
    const timer = setInterval(refresh, 60_000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, []);
  const data = projectHomeDashboard(history, activeWorkout, templates, now);
  const program = projectHomeProgram(assignment, history, templates, now);
  const latestToday =
    data.latestWorkout &&
    localDate(new Date(data.latestWorkout.session.finishedAt!)) ===
      localDate(new Date(now))
      ? data.latestWorkout
      : null;
  const featured = program ? program.details : data.primaryTemplate;
  const template = featured?.template;
  const exercise = activeWorkout?.exercises[activeWorkout.currentExerciseIndex];
  const imageKey = activeWorkout
    ? findExercise(exercise?.libraryId ?? '')?.imageKey
    : template?.exerciseIds.map(findExercise).find(Boolean)?.imageKey;
  const templateName = template
    ? workoutTemplateLabel(t, locale, template, assignment)
    : '';
  const scheduledDay = program?.slot.date.split('-').map(Number);
  const scheduledDate =
    scheduledDay &&
    formatDate(
      locale,
      new Date(
        scheduledDay[0],
        scheduledDay[1] - 1,
        scheduledDay[2],
        12,
      ).getTime(),
      {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      },
    );
  const presentation = featured && templatePresentation(featured, t, locale);
  const startFeatured = () => {
    if (draftRef.current || !template || busy) return;
    if (program) {
      if (program.slot.date === localDate() && startProgramSlot) {
        startProgramSlot(program.slot, template);
      }
    } else {
      guardedStart(template);
    }
  };
  const showResult = !activeWorkout && !program?.isToday ? latestToday : null;
  let hero;
  let action: () => void;
  if (activeWorkout) {
    const recorded = completedSetCount(activeWorkout);
    const setCount = activeWorkout.exercises.reduce(
      (total, item) => total + item.sets.length,
      0,
    );
    hero = {
      badge: t('home.inProgress'),
      context: activeWorkout.name,
      title: exercise
        ? workoutExerciseLabel(locale, exercise)
        : activeWorkout.name,
      meta: [
        t('history.completedSets', { count: recorded }),
        t('home.planned', { count: setCount }),
      ].join(' · '),
      progress: setCount ? Math.min(1, recorded / setCount) : undefined,
      imageKey,
      action: t('home.resume', { name: activeWorkout.name }),
    };
    action = guardedResume;
  } else if (showResult) {
    hero = {
      badge: t('workout.saved'),
      title: showResult.session.name,
      meta: [
        t('history.completedSets', {
          count: completedSetCount(showResult.session),
        }),
        t('home.volume', {
          value: formatNumber(locale, volume(showResult.session)),
        }),
      ].join(' · '),
      action: t('history.details'),
    };
    action = () => openResult(showResult.session.id);
  } else if (program && !featured) {
    hero = {
      badge: t('plan.planned'),
      title: programTitle(t, locale, assignment!.program),
      context: scheduledDate || undefined,
      meta: t('plan.unavailable'),
      action: t('plan.manage'),
    };
    action = () => guardedProfile?.();
  } else if (featured && presentation) {
    const day = assignment?.program.days.find(
      (item) => item.key === program?.slot.dayKey,
    );
    hero = {
      badge: program ? t('plan.planned') : t('home.quickStart'),
      context:
        assignment && program
          ? [programTitle(t, locale, assignment.program), scheduledDate].join(
              ' · ',
            )
          : t('home.saved'),
      title: day ? programDayLabel(t, day.key, day.name) : templateName,
      meta: [
        presentation.count,
        t('home.planned', { count: featured.plannedSetCount }),
      ].join(' · '),
      preview: program ? undefined : presentation.preview,
      imageKey,
      action:
        program && !program.isToday
          ? t('plan.title')
          : t('home.startNamed', { name: templateName }),
    };
    action =
      program && !program.isToday
        ? () => {
            if (!draftRef.current) setPreviewOpen(true);
          }
        : startFeatured;
  } else {
    hero = {
      badge: t('home.templates'),
      title: templates.length ? t('home.noAvailable') : t('home.noTemplates'),
      action: t('templates.create'),
    };
    action = () => {
      if (!draftRef.current) setBuilderOpen(true);
    };
  }
  const content = {
    primary: (
      <PrimaryWorkoutWidget
        state={hero}
        onAction={action}
        disabled={busy || Boolean(draft)}
        onPreview={
          !activeWorkout &&
          !showResult &&
          template &&
          (!program || program.isToday)
            ? () => {
                if (!draftRef.current) setPreviewOpen(true);
              }
            : undefined
        }
      />
    ),
    summary: (
      <TrainingSummaryWidget
        totalVolume={data.fourWeeks.totalVolume}
        completedCount={data.fourWeeks.completedCount}
        onOpen={
          onOpenProgress
            ? () => {
                if (!draftRef.current) onOpenProgress();
              }
            : undefined
        }
      />
    ),
    week: (
      <TrainingWeekWidget
        week={data.week}
        onOpenCalendar={(date) => {
          if (!draftRef.current) setCalendarDate(date ?? now);
        }}
      />
    ),
    latest: shouldShowLatestWorkout(
      data.latestWorkout?.session.id,
      showResult?.session.id,
    ) ? (
      <LatestWorkoutWidget latest={data.latestWorkout} onOpen={openResult} />
    ) : null,
    templates:
      templates.length &&
      (program || showResult || data.otherTemplates.length) ? (
        <WorkoutTemplatesWidget
          templates={
            program || showResult
              ? templates
                  .map(templateDetails)
                  .filter(
                    (item) =>
                      item.template.id !== template?.id || Boolean(showResult),
                  )
              : data.otherTemplates
          }
          activeWorkout={activeWorkout}
          assignment={assignment}
          startTemplate={guardedStart}
        />
      ) : null,
  };
  const items: DashboardGridItem[] = (
    draft ?? homeLayout.layout
  ).widgets.flatMap((layout) => {
    const definition = HOME_WIDGET_LAYOUT.find(({ id }) => id === layout.id)!;
    const widget = layout.visible ? content[layout.id] : null;
    return widget
      ? [{ id: layout.id, size: definition.defaultSize, content: widget }]
      : [];
  });

  return (
    <View style={{ flex: 1 }}>
      <AppScrollView
        branded
        dockAware
        ref={attachRef}
        scrollEnabled={!dragging}
        onScroll={onHomeScroll}
        onLayout={onHomeScrollLayout}
        onContentSizeChange={onContentSizeChange}
        contentContainerStyle={[s.content, s.homeContent]}
        sectionPositions={Object.entries(rowOffsets)
          .filter(([id]) => items.some((item) => item.id === id))
          .map(([id, y]) => ({ id, label: id, y: gridTop + y }))}
      >
        <View style={s.header}>
          <View style={s.greetingRow}>
            <View style={s.greetingCopy}>
              <Text style={s.date}>
                {formatDate(locale, now, {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </Text>
              <Text style={s.title} accessibilityRole="header">
                {displayName?.trim()
                  ? t('home.welcomeNamed', { name: displayName.trim() })
                  : history.length
                    ? t('home.welcomeBack')
                    : t('home.welcome')}
              </Text>
            </View>
            {onOpenProfile ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('home.openProfile')}
                onPress={guardedProfile}
                style={({ pressed }) => [s.avatar, pressed && s.pressed]}
              >
                <Ionicons
                  name="person-outline"
                  size={22}
                  color={colors.primary}
                />
              </Pressable>
            ) : null}
          </View>
        </View>
        <AppButton
          title={t('home.customize')}
          secondary
          presentation="text"
          disabled={
            Boolean(draft) ||
            homeLayout.loading ||
            homeLayout.saving ||
            homeLayout.loadError
          }
          onPress={() => {
            homeLayout.clearSaveError();
            setEditingLayout(true);
          }}
        />
        {homeLayout.loadError ? (
          <GlassCard>
            <Text accessibilityRole="alert" style={s.sub}>
              {t('home.loadError')}
            </Text>
            <AppButton
              title={t('home.retry')}
              secondary
              disabled={homeLayout.loading || homeLayout.saving}
              onPress={() => {
                void homeLayout.load();
              }}
            />
            <AppButton
              title={t('home.reset')}
              secondary
              disabled={homeLayout.loading || homeLayout.saving}
              onPress={() => {
                void homeLayout.save(defaultHomeLayout());
              }}
            />
            {homeLayout.saveError ? (
              <Text accessibilityRole="alert" style={s.sub}>
                {t('home.saveError')}
              </Text>
            ) : null}
          </GlassCard>
        ) : null}
        <HomeDragGrid
          items={items}
          editing={Boolean(draft)}
          disabled={
            homeLayout.loading ||
            homeLayout.saving ||
            homeLayout.loadError ||
            editingLayout
          }
          scroll={dragScroll}
          onBegin={beginEditing}
          onMove={moveBlock}
          onLayout={(event) => setGridTop(event.nativeEvent.layout.y)}
          onRowLayout={(id, y) =>
            setRowOffsets((current) =>
              current[id] === y ? current : { ...current, [id]: y },
            )
          }
        />
        {assignment && startProgramSlot ? (
          <AppButton
            title={t('onboarding.weeklySchedule')}
            secondary
            presentation="text"
            disabled={Boolean(draft)}
            onPress={() => setScheduleOpen(true)}
          />
        ) : null}
        {scheduleOpen && assignment && startProgramSlot ? (
          <ScreenModal
            visible
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setScheduleOpen(false)}
          >
            <AppScrollView
              branded
              back={{ onPress: () => setScheduleOpen(false) }}
              contentContainerStyle={s.content}
            >
              <TrainingProgramWeek
                assignment={assignment}
                history={history}
                templates={templates}
                active={Boolean(activeWorkout)}
                now={now}
                onStart={(slot, routine) => {
                  if (busy || slot.date > localDate()) return;
                  setScheduleOpen(false);
                  startProgramSlot(slot, routine);
                }}
                onStartUnscheduled={guardedStart}
                onManage={() => {
                  setScheduleOpen(false);
                  guardedProfile?.();
                }}
                allowFutureStart={false}
              />
            </AppScrollView>
          </ScreenModal>
        ) : null}
        {calendarDate !== undefined ? (
          <HomeCalendar
            history={history}
            now={now}
            initialDate={calendarDate}
            onClose={() => setCalendarDate(undefined)}
          />
        ) : null}
        {previewOpen && template ? (
          <ScreenModal
            visible
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setPreviewOpen(false)}
          >
            <AppScrollView
              branded
              back={{ onPress: () => setPreviewOpen(false) }}
              contentContainerStyle={s.content}
            >
              <Text accessibilityRole="header" style={s.title}>
                {templateName}
              </Text>
              {scheduledDate ? (
                <Text style={s.sub}>{scheduledDate}</Text>
              ) : null}
              {template.exerciseIds.map((id, index) => {
                const item = findExercise(id);
                if (!item) return null;
                const sets = template.plannedExercises?.find(
                  (exercise) => exercise.exerciseId === id,
                )?.sets;
                return (
                  <GlassCard key={index}>
                    <Text style={s.templateName}>
                      {catalogLabel(locale, 'exercise', item.id, item.name)}
                    </Text>
                    <Text style={s.sub}>
                      {t('home.planned', {
                        count: sets && validPlannedSets(sets) ? sets : 3,
                      })}
                    </Text>
                  </GlassCard>
                );
              })}
              {!activeWorkout && !busy && (!program || program.isToday) ? (
                <AppButton title={t('home.start')} onPress={startFeatured} />
              ) : null}
            </AppScrollView>
          </ScreenModal>
        ) : null}
        {resultId ? (
          <ScreenModal
            visible
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setResultId(undefined)}
          >
            <AppScrollView branded contentContainerStyle={s.content}>
              <WorkoutHistory
                history={history}
                initialWorkoutId={resultId}
                onCloseDetails={() => setResultId(undefined)}
              />
            </AppScrollView>
          </ScreenModal>
        ) : null}
        {builderOpen && createTemplate ? (
          <TemplateEditor
            mode="create"
            busy={busy}
            onCancel={() => setBuilderOpen(false)}
            onSave={async (input) => {
              const result = await createTemplate(input);
              if (result.ok) setBuilderOpen(false);
              return result;
            }}
          />
        ) : null}
        {editingLayout ? (
          <HomeLayoutEditor
            initial={draft ?? homeLayout.layout}
            saving={homeLayout.saving}
            error={homeLayout.saveError}
            onClose={() => setEditingLayout(false)}
            onSave={saveEditing}
          />
        ) : null}
      </AppScrollView>
      {draft ? (
        <SafeAreaView edges={['top']} style={s.editBar}>
          <Text style={s.sub}>{t('home.editHint')}</Text>
          <View
            style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}
          >
            <AppButton
              title={t('home.cancel')}
              secondary
              presentation="text"
              disabled={homeLayout.saving}
              onPress={cancelEditing}
            />
            <AppButton
              title={homeLayout.saving ? t('home.saving') : t('home.done')}
              presentation="text"
              disabled={homeLayout.saving || dragging}
              onPress={() => {
                const next = draftRef.current;
                if (next) void saveEditing(next);
              }}
            />
            <AppButton
              title={t('home.order')}
              secondary
              presentation="text"
              disabled={homeLayout.saving || dragging}
              onPress={() => setEditingLayout(true)}
            />
          </View>
          {homeLayout.saveError ? (
            <Text accessibilityRole="alert" style={s.sub}>
              {t('home.saveDraftError')}
            </Text>
          ) : null}
        </SafeAreaView>
      ) : null}
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  editBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    padding: spacing.md,
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  content: { padding: spacing.md, gap: spacing.sm },
  homeContent: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    paddingBottom: spacing.lg,
  },
  header: { gap: spacing.xl, paddingVertical: spacing.sm },
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  greetingCopy: { flex: 1, gap: spacing.xs },
  avatar: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  date: { ...typography.caption, color: colors.textSecondary },
  title: { ...typography.largeTitle, color: colors.textPrimary },
  hero: { gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg },
  heroBody: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  progressTrack: {
    flexDirection: 'row',
    height: 4,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.primary },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    backgroundColor: colors.primaryTint,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  badgeText: { ...typography.footnote, color: colors.textPrimary },
  heroTitle: { ...typography.title1, color: colors.textPrimary },
  meta: { ...typography.subheadline, color: colors.textSecondary },
  summary: { gap: spacing.xs },
  statPair: { flexDirection: 'row', gap: spacing.sm },
  statStack: { flexDirection: 'column' },
  statCard: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.xxl,
  },
  statColumn: { flex: 1, minWidth: 0 },
  weekCard: { gap: spacing.xs, padding: spacing.md, borderRadius: radius.xxl },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xxs,
  },
  weekDay: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  dayLabel: { ...typography.caption, color: colors.textSecondary },
  dayMarker: {
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayCircle: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  completedCircle: { backgroundColor: colors.primary },
  dayNumber: { ...typography.caption, color: colors.textSecondary },
  todayNumber: { color: colors.primary },
  metric: {
    ...typography.title1,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  recent: { gap: spacing.xxs },
  recentName: { ...typography.headline, color: colors.textPrimary },
  empty: { ...typography.footnote, color: colors.textSecondary },
  templateCopy: { flex: 1, minWidth: 0, gap: spacing.xxs },
  templates: { gap: spacing.sm },
  templateName: { ...typography.headline, color: colors.textPrimary },
  templateAction: {
    minWidth: 80,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
  },
  templateActionText: { ...typography.caption, color: colors.primary },
  pressed: { opacity: 0.6 },
  cardLabel: { ...typography.caption, color: colors.textSecondary },
  sub: { ...typography.footnote, color: colors.textSecondary },
  unit: { ...typography.footnote, color: colors.textSecondary },
  quick: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  section: { ...typography.title3, color: colors.textPrimary },
}));
