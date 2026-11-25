import { workoutExerciseLabel } from '@/lib/i18n/catalog';
import {
  createThemedStyles,
  useAppColors,
} from '@/components/AppThemeProvider';
import { BrandHeader } from './BrandHeader';
import {
  LocalizedText as Text,
  LocalizedTextInput as TextInput,
  DirectionalIcon as Ionicons,
} from '@/components/LayoutDirection';
import { ScreenModal } from './ScreenModal';
import { AppScrollView } from './AppScrollView';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassCard } from './GlassCard';
import { EstimatedOneRepMaxSeries } from './EstimatedOneRepMaxSeries';
import { useLocalization } from './LocalizationProvider';
import { formatNumber } from '@/lib/i18n/format';
import {
  exerciseSearchScore,
  prepareExerciseQuery,
} from '@/lib/i18n/search/engine';
import { progressDate, periodLabel, volumeNumber } from '@/lib/i18n/progress';
import {
  listPerformanceExercises,
  projectEstimatedOneRepMaxSeries,
  projectExercisePerformance,
} from '@/lib/exercise-performance';
import type { ProgressPeriodId } from '@/lib/progress-periods';
import type { WorkoutSession } from '@/lib/workout-model';
import { progressTypography, radius, spacing, typography } from '@/lib/theme';

type Props = {
  history: readonly WorkoutSession[];
  period: ProgressPeriodId;
  now: number;
};

export function ExercisePerformance({ history, period, now }: Props) {
  const colors = useAppColors();
  const s = useStyles();
  const { t, locale } = useLocalization();
  const [identityKey, setIdentityKey] = useState<string>();
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [setsOpen, setSetsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const choices = useMemo(
    () =>
      listPerformanceExercises(history, now).map((choice) => ({
        ...choice,
        label: workoutExerciseLabel(locale, {
          libraryId: choice.sourceId,
          name: choice.name,
        }),
      })),
    [history, now, locale],
  );
  const selected = choices.find((choice) => choice.identityKey === identityKey);
  const choiceLabel = (choice: (typeof choices)[number]) =>
    choices.some(
      (other) =>
        other.identityKey !== choice.identityKey &&
        other.label.toLocaleLowerCase() === choice.label.toLocaleLowerCase(),
    )
      ? `${choice.label} (${choice.sourceId})`
      : choice.label;
  const entries = useMemo(
    () =>
      identityKey
        ? projectExercisePerformance(history, period, now, identityKey)
        : [],
    [history, period, now, identityKey],
  );
  const estimates = useMemo(
    () =>
      identityKey
        ? projectEstimatedOneRepMaxSeries(history, period, now, identityKey)
        : [],
    [history, period, now, identityKey],
  );
  const searchQuery = prepareExerciseQuery(query);
  const matches = choices
    .map((choice) => ({
      choice,
      score: exerciseSearchScore(
        choice.sourceId,
        searchQuery,
        locale,
        choice.name,
      ),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ choice }) => choice);
  const close = () => {
    setQuery('');
    setSelectorOpen(false);
  };

  return (
    <GlassCard style={s.card}>
      <Text style={s.title} accessibilityRole="header">
        {t('performance.title')}
      </Text>
      <Text style={s.subtitle}>{t('performance.subtitle')}</Text>
      {choices.length === 0 ? (
        <Text style={s.empty}>
          {history.length === 0
            ? t('performance.first')
            : t('performance.empty')}
        </Text>
      ) : (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('performance.chooseA11y')}
            onPress={() => setSelectorOpen(true)}
            style={({ pressed }) => [s.choose, pressed && s.pressed]}
          >
            <Text style={[s.chooseText, !selected && s.choosePlaceholder]}>
              {selected ? choiceLabel(selected) : t('performance.choose')}
            </Text>
            <Ionicons
              name="chevron-down"
              size={20}
              color={colors.textSecondary}
              accessible={false}
            />
          </Pressable>
          {selected ? (
            <>
              {entries.some((entry) =>
                entry.sets.some((set) => set.otherSideReps !== undefined),
              ) ? (
                <Text style={s.empty}>{t('performance.paired')}</Text>
              ) : null}
              {entries.some((entry) =>
                entry.sets.some((set) => set.weight === 0),
              ) ? (
                <Text style={s.empty}>{t('performance.zero')}</Text>
              ) : null}
              <EstimatedOneRepMaxSeries
                points={estimates}
                period={period}
                now={now}
              />
              {entries.length === 0 ? (
                <Text style={s.empty}>
                  {t('performance.noSets', { period: periodLabel(t, period) })}
                </Text>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('performance.viewSets')}
                  style={s.close}
                  onPress={() => setSetsOpen(true)}
                >
                  <Text style={s.closeText}>{t('performance.viewSets')}</Text>
                </Pressable>
              )}
            </>
          ) : null}
        </>
      )}
      <ScreenModal
        visible={setsOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSetsOpen(false)}
      >
        <SafeAreaView edges={['top', 'left', 'right']} style={s.sheet}>
          <BrandHeader
            back={{
              accessibilityLabel: t('performance.closeSets'),
              onPress: () => setSetsOpen(false),
            }}
          />
          <View style={s.header}>
            <Text
              style={s.sheetTitle}
              numberOfLines={2}
              accessibilityLabel={t('performance.loggedTitle', {
                name: selected?.label ?? '',
              })}
            >
              {t('performance.loggedTitle', { name: selected?.label ?? '' })}
            </Text>
          </View>
          <AppScrollView
            safeAreaEdges={['bottom']}
            contentContainerStyle={s.results}
          >
            <View style={s.entries}>
              {entries.map((entry) => (
                <View
                  key={`${entry.workoutId}:${entry.exerciseSnapshotId}`}
                  style={s.entry}
                >
                  <Text style={s.date}>
                    {progressDate(locale, entry.finishedAt)}
                  </Text>
                  <Text style={s.workout}>{entry.workoutName}</Text>
                  <View style={s.loggedSets}>
                    {entry.sets.map((set, index) => (
                      <View key={set.id} style={s.setRow}>
                        <Text style={s.setNumber}>
                          {formatNumber(locale, index + 1)}
                        </Text>
                        <Text style={s.set}>
                          {set.otherSideReps === undefined
                            ? t('progress.loggedSet', {
                                weight: volumeNumber(locale, set.weight),
                                reps: formatNumber(locale, set.reps),
                              })
                            : t('progress.loggedBilateral', {
                                weight: volumeNumber(locale, set.weight),
                                reps: formatNumber(locale, set.reps),
                                other: formatNumber(locale, set.otherSideReps),
                              })}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </AppScrollView>
        </SafeAreaView>
      </ScreenModal>
      <ScreenModal
        visible={selectorOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={close}
      >
        <SafeAreaView edges={['top', 'left', 'right']} style={s.sheet}>
          <BrandHeader
            back={{
              accessibilityLabel: t('performance.closeSelector'),
              onPress: close,
            }}
          />
          <View style={s.header}>
            <Text style={s.sheetTitle}>{t('performance.selectorTitle')}</Text>
          </View>
          <TextInput
            accessibilityLabel={t('performance.search')}
            value={query}
            onChangeText={setQuery}
            placeholder={t('performance.search')}
            placeholderTextColor={colors.textTertiary}
            returnKeyType="search"
            style={s.search}
          />
          <AppScrollView
            safeAreaEdges={['bottom']}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={s.results}
          >
            {matches.length === 0 ? (
              <Text style={s.empty}>{t('performance.noMatches')}</Text>
            ) : (
              matches.map((choice) => (
                <Pressable
                  key={choice.identityKey}
                  accessibilityRole="button"
                  accessibilityLabel={t('performance.choice', {
                    name: choiceLabel(choice),
                  })}
                  accessibilityState={{
                    selected: choice.identityKey === identityKey,
                  }}
                  onPress={() => {
                    setSetsOpen(false);
                    setIdentityKey(choice.identityKey);
                    close();
                  }}
                  style={({ pressed }) => [s.result, pressed && s.pressed]}
                >
                  <Text style={s.resultText}>{choiceLabel(choice)}</Text>
                </Pressable>
              ))
            )}
          </AppScrollView>
        </SafeAreaView>
      </ScreenModal>
    </GlassCard>
  );
}

const useStyles = createThemedStyles((colors) => ({
  card: { padding: spacing.md, borderRadius: radius.xxl },
  title: { ...progressTypography.sectionTitle, color: colors.textEmphasis },
  subtitle: {
    ...typography.footnote,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
  empty: {
    ...typography.footnote,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  choose: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 44,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    marginTop: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
    paddingVertical: spacing.sm,
  },
  chooseText: {
    ...progressTypography.selector,
    color: colors.textPrimary,
    flex: 1,
  },
  choosePlaceholder: { color: colors.textSecondary },
  entries: { marginTop: spacing.sm },
  entry: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
  },
  date: { ...typography.footnote, color: colors.textSecondary },
  workout: {
    ...typography.headline,
    color: colors.textPrimary,
    marginTop: spacing.xxs,
  },
  set: {
    ...typography.body,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
    flex: 1,
  },
  loggedSets: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.xl,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  setNumber: {
    ...typography.footnote,
    minWidth: spacing.lg,
    color: colors.textSecondary,
  },
  sheet: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
  },
  header: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sheetTitle: { ...typography.title2, color: colors.textPrimary, flex: 1 },
  close: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { ...typography.headline, color: colors.primary },
  search: {
    ...typography.body,
    minHeight: 48,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    marginVertical: spacing.sm,
  },
  results: { paddingBottom: spacing.xxl },
  result: {
    minHeight: 48,
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
  },
  resultText: { ...typography.body, color: colors.textPrimary },
  pressed: { opacity: 0.6 },
}));
