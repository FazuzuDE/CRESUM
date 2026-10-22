import { BrandHeader } from './BrandHeader';
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
import type { ProgramAssignment } from '@/lib/training-programs/assignment';
import type { ProjectedProgramSlot } from '@/lib/training-programs/schedule';
import { AppScrollView } from './AppScrollView';
import { useEffect, useRef, useState } from 'react';
import {
  AppState,
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from './AppButton';
import type { DashboardGridItem } from './DashboardGrid';
import { GlassCard } from './GlassCard';
import {
  HOME_WIDGET_LAYOUT,
  projectHomeDashboard,
  type HomeTemplateDetails,
} from '@/lib/home-dashboard';
import type { WorkoutSession, WorkoutTemplate } from '@/lib/workout-model';
import { colors, radius, spacing, typography } from '@/lib/theme';
import { useLocalization } from './LocalizationProvider';
import { formatDate, formatNumber } from '@/lib/i18n/format';
import { catalogLabel } from '@/lib/i18n/catalog';
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
          available: details.availableCount,
          unavailable,
        })
      : t('home.exercises', { count: details.availableCount }),
    preview: details.template.exerciseIds
      .flatMap((id) => {
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
};

function PrimaryWorkoutWidget({
  activeWorkout,
  featured,
  hasTemplates,
  onResume,
  startTemplate,
}: {
  activeWorkout: WorkoutSession | null;
  featured?: HomeTemplateDetails;
  hasTemplates: boolean;
  onResume: () => void;
  startTemplate: HomeProps['startTemplate'];
}) {
  const { t, locale } = useLocalization();
  const presentation = featured
    ? templatePresentation(featured, t, locale)
    : null;
  if (!activeWorkout && !featured) {
    return (
      <GlassCard>
        <Text style={s.heroTitle}>
          {hasTemplates ? t('home.noAvailable') : t('home.noTemplates')}
        </Text>
        <Text style={s.sub}>
          {hasTemplates ? t('home.editTemplate') : t('home.createTemplate')}
        </Text>
      </GlassCard>
    );
  }
  const title = activeWorkout
    ? t('home.resume', { name: activeWorkout.name })
    : t('home.startNamed', { name: featured!.template.name });
  return (
    <GlassCard style={s.hero}>
      <View style={s.heroTop}>
        <View style={s.badge}>
          <Ionicons name="barbell-outline" size={18} color={colors.primary} />
          <Text style={s.badgeText}>
            {activeWorkout ? t('home.inProgress') : t('home.quickStart')}
          </Text>
        </View>
        <Text style={s.sub}>
          {activeWorkout ? t('home.active') : t('home.saved')}
        </Text>
      </View>
      <Text style={s.heroTitle} accessibilityRole="header">
        {activeWorkout?.name ?? featured?.template.name}
      </Text>
      {activeWorkout ? (
        <Text style={s.sub}>{t('home.ready')}</Text>
      ) : (
        <>
          <Text style={s.meta}>
            {presentation?.count} ·{' '}
            {t('home.planned', { count: featured!.plannedSetCount })}
          </Text>
          {presentation?.preview ? (
            <Text style={s.sub} accessibilityLabel={presentation.preview}>
              {presentation.preview}
            </Text>
          ) : null}
        </>
      )}
      <AppButton
        title={title}
        accessibilityLabel={title}
        onPress={
          activeWorkout ? onResume : () => startTemplate(featured!.template)
        }
      />
    </GlassCard>
  );
}

function TrainingSummaryWidget({
  totalVolume,
  completedCount,
}: {
  totalVolume: number;
  completedCount: number;
}) {
  const { t, locale } = useLocalization();
  return (
    <View style={s.statPair}>
      <GlassCard style={s.statCard}>
        <Text style={s.sub}>{t('home.fourWeeks')}</Text>
        <Text style={s.metric}>
          {t('home.completed', { count: completedCount })}
        </Text>
        <Text style={s.sub}>{t('home.local')}</Text>
      </GlassCard>
      <GlassCard style={s.statCard}>
        <Text style={s.sub}>{t('home.totalVolume')}</Text>
        <Text style={s.metric}>
          {t(totalVolume >= 1000 ? 'home.tonnes' : 'home.kilograms', {
            value: formatNumber(
              locale,
              totalVolume >= 1000 ? totalVolume / 1000 : totalVolume,
              { maximumFractionDigits: 6 },
            ),
          })}
        </Text>
        <Text style={s.sub}>{t('home.fourWeeks')}</Text>
      </GlassCard>
    </View>
  );
}

function TrainingWeekWidget({
  week,
  onOpenCalendar,
}: {
  week: ReturnType<typeof projectHomeDashboard>['week'];
  onOpenCalendar: () => void;
}) {
  const { t, locale } = useLocalization();
  return (
    <GlassCard style={s.weekCard}>
      <View style={s.heroTop}>
        <Text style={s.section} accessibilityRole="header">
          {t('home.week')}
        </Text>
        <View style={s.badge}>
          <Text style={s.badgeText}>
            {t('home.workouts', { count: week.completedCount })}
          </Text>
        </View>
      </View>
      <AppButton
        title={t('home.month')}
        accessibilityLabel={t('home.openCalendar')}
        secondary
        presentation="text"
        onPress={onOpenCalendar}
      />
      <View style={s.weekDays}>
        {week.days.map((day) => (
          <View
            key={day.timestamp}
            style={s.weekDay}
            accessible
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
            <View style={[s.dayMarker, day.isToday && s.todayCircle]}>
              <View
                style={[
                  s.dayCircle,
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
          </View>
        ))}
      </View>
    </GlassCard>
  );
}

function LatestWorkoutWidget({
  latest,
}: {
  latest: ReturnType<typeof projectHomeDashboard>['latestWorkout'];
}) {
  const { t, locale } = useLocalization();
  return latest ? (
    <GlassCard style={s.recent}>
      <Text style={s.cardLabel}>{t('home.last')}</Text>
      <Text style={s.recentName}>{latest.session.name}</Text>
      <Text style={s.sub}>
        {t('home.volume', { value: formatNumber(locale, latest.volume) })}
      </Text>
    </GlassCard>
  ) : (
    <Text style={s.empty}>{t('home.empty')}</Text>
  );
}

function WorkoutTemplatesWidget({
  templates,
  activeWorkout,
  startTemplate,
}: {
  templates: HomeTemplateDetails[];
  activeWorkout: WorkoutSession | null;
  startTemplate: HomeProps['startTemplate'];
}) {
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
        const { count, preview } = templatePresentation(details, t, locale);
        const canStart = !activeWorkout && availableCount > 0;
        return (
          <GlassCard key={template.id}>
            <View style={s.quick}>
              <View style={s.templateCopy}>
                <Text style={s.templateName}>{template.name}</Text>
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
                  name: template.name,
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
  assignment,
  startProgramSlot,
}: HomeProps) {
  const { t } = useLocalization();
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
  const [calendarOpen, setCalendarOpen] = useState(false);
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
  const program =
    assignment && startProgramSlot ? (
      <TrainingProgramWeek
        assignment={assignment}
        history={history}
        templates={templates}
        active={Boolean(activeWorkout)}
        now={now}
        onStart={(slot, template) => {
          if (!draftRef.current) startProgramSlot(slot, template);
        }}
        onManage={guardedProfile}
      />
    ) : null;
  const content = {
    primary:
      program && !activeWorkout ? (
        program
      ) : (
        <PrimaryWorkoutWidget
          activeWorkout={activeWorkout}
          featured={data.primaryTemplate}
          hasTemplates={templates.length > 0}
          onResume={guardedResume}
          startTemplate={guardedStart}
        />
      ),
    summary: (
      <TrainingSummaryWidget
        totalVolume={data.fourWeeks.totalVolume}
        completedCount={data.fourWeeks.completedCount}
      />
    ),
    week: (
      <TrainingWeekWidget
        week={data.week}
        onOpenCalendar={() => {
          if (!draftRef.current) setCalendarOpen(true);
        }}
      />
    ),
    latest: <LatestWorkoutWidget latest={data.latestWorkout} />,
    templates: data.otherTemplates.length ? (
      <WorkoutTemplatesWidget
        templates={data.otherTemplates}
        activeWorkout={activeWorkout}
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

  if (program && activeWorkout) {
    const primary = items.find((item) => item.id === 'primary')!;
    primary.content = (
      <View style={{ gap: spacing.lg }}>
        {primary.content}
        {program}
      </View>
    );
  }
  return (
    <View style={{ flex: 1 }}>
      <AppScrollView
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
          <BrandHeader />
          <View style={s.greetingRow}>
            <View style={s.greetingCopy}>
              <Text style={s.title} accessibilityRole="header">
                {displayName?.trim()
                  ? t('home.welcomeNamed', { name: displayName.trim() })
                  : history.length
                    ? t('home.welcomeBack')
                    : t('home.welcome')}
              </Text>
              <Text style={s.greeting}>{t('home.greeting')}</Text>
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
        {calendarOpen ? (
          <HomeCalendar
            history={history}
            now={now}
            onClose={() => setCalendarOpen(false)}
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
        <View style={s.editBar}>
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
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
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
  content: { padding: spacing.md, gap: spacing.lg },
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
  greeting: { ...typography.body, color: colors.textSecondary },
  title: { ...typography.largeTitle, color: colors.textPrimary },
  hero: { gap: spacing.lg, padding: spacing.lg, borderRadius: radius.xxl },
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
  statPair: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statCard: {
    flex: 1,
    minWidth: 140,
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.xxl,
  },
  weekCard: { gap: spacing.lg, padding: spacing.md, borderRadius: radius.xxl },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xxs,
  },
  weekDay: { flex: 1, minWidth: 0, alignItems: 'center', gap: spacing.sm },
  dayLabel: { ...typography.caption, color: colors.textSecondary },
  dayMarker: {
    width: '100%',
    maxWidth: 44,
    aspectRatio: 1,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: '100%',
    flex: 1,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayCircle: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    padding: spacing.xxs,
  },
  completedCircle: { backgroundColor: colors.primary },
  dayNumber: { ...typography.footnote, color: colors.textSecondary },
  todayNumber: { color: colors.primary },
  metric: {
    ...typography.largeTitle,
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
});
