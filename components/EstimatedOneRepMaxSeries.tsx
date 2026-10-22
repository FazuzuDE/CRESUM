import { AppFlatList } from './AppFlatList';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { EstimatedOneRepMaxBars } from './EstimatedOneRepMaxBars';
import { VolumeTrendChart } from './VolumeTrendChart';
import { progressPeriodStart } from '@/lib/progress-periods';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { EstimatedOneRepMaxPoint } from '@/lib/exercise-performance';
import type { ProgressPeriodId } from '@/lib/progress-periods';
import { colors, spacing, typography } from '@/lib/theme';
import { useLocalization } from './LocalizationProvider';
import { formatNumber } from '@/lib/i18n/format';
import {
  progressNumber,
  progressDate,
  periodLabel,
  volumeNumber,
} from '@/lib/i18n/progress';
import type { AppLocale } from '@/lib/i18n/registry';
import type { Translate } from '@/lib/i18n/messages';

type Props = {
  points: readonly EstimatedOneRepMaxPoint[];
  period: ProgressPeriodId;
  now: number;
};

const pointLabel = (
  t: Translate,
  locale: AppLocale,
  point: EstimatedOneRepMaxPoint,
) =>
  t('series.point', {
    name: point.workoutName,
    date: progressDate(locale, point.finishedAt),
    value: progressNumber(locale, point.estimatedOneRepMax, true),
    weight: volumeNumber(locale, point.weight),
    reps: formatNumber(locale, point.reps),
  });

function PointRow({ point }: { point: EstimatedOneRepMaxPoint }) {
  const { t, locale } = useLocalization();
  return (
    <View
      accessible
      accessibilityLabel={pointLabel(t, locale, point)}
      style={s.row}
    >
      <View style={s.rowCopy}>
        <Text style={s.date}>{progressDate(locale, point.finishedAt)}</Text>
        <Text style={s.workout}>{point.workoutName}</Text>
      </View>
      <View style={s.estimateCopy}>
        <Text style={s.value}>
          {t('series.value', {
            value: progressNumber(locale, point.estimatedOneRepMax, true),
          })}
        </Text>
        <Text style={s.source}>
          {t('series.source', {
            weight: volumeNumber(locale, point.weight),
            reps: formatNumber(locale, point.reps),
          })}
        </Text>
      </View>
    </View>
  );
}

export function EstimatedOneRepMaxSeries({ points, period, now }: Props) {
  const { t, locale } = useLocalization();
  const periodText = periodLabel(t, period);
  const [allOpen, setAllOpen] = useState(false);
  const recent = period === '1W' ? points.slice(-7) : points;
  const chartPoints = recent.map((point) => ({
    workoutId: point.workoutId,
    workoutName: point.workoutName,
    finishedAt: point.finishedAt,
    volume: point.estimatedOneRepMax,
  }));
  const chartLabel = (point: (typeof chartPoints)[number]) =>
    pointLabel(
      t,
      locale,
      points.find((p) => p.workoutId === point.workoutId)!,
    );
  return (
    <View style={s.section}>
      <Text style={s.title} accessibilityRole="header">
        {t('series.title')}
      </Text>
      {points.length === 0 ? (
        <Text style={s.note}>{t('series.empty', { period: periodText })}</Text>
      ) : (
        <>
          <Text style={s.note}>
            {points.length === 1 && period === '1W'
              ? t('series.one')
              : t('series.count', { count: points.length, period: periodText })}
          </Text>
          {period === '1W' ? (
            <EstimatedOneRepMaxBars
              workouts={chartPoints}
              pointLabel={chartLabel}
            />
          ) : (
            <VolumeTrendChart
              key={period}
              workouts={chartPoints}
              start={
                progressPeriodStart(period, now) ??
                Math.min(now, ...points.map((p) => p.finishedAt))
              }
              end={now}
              measureLabel={t('progress.estimated')}
              formatPoint={chartLabel}
              singlePointMessage={t('series.one')}
            />
          )}
          {points.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('series.viewAllA11y', {
                count: points.length,
                period: periodText,
              })}
              onPress={() => setAllOpen(true)}
              style={({ pressed }) => [s.viewAll, pressed && s.pressed]}
            >
              <Text style={s.action}>
                {t('series.viewAll', { period: periodText })}
              </Text>
            </Pressable>
          ) : null}
        </>
      )}
      <Modal
        visible={allOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setAllOpen(false)}
      >
        <SafeAreaView style={s.sheet}>
          <View style={s.header}>
            <Text style={s.sheetTitle}>
              {t('series.modalTitle', { period: periodText })}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('series.close')}
              onPress={() => setAllOpen(false)}
              style={s.close}
            >
              <Text style={s.action}>{t('progress.close')}</Text>
            </Pressable>
          </View>
          <AppFlatList
            data={points}
            keyExtractor={(point) => point.workoutId}
            contentContainerStyle={s.list}
            renderItem={({ item }) => <PointRow point={item} />}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  section: { marginTop: spacing.lg },
  title: { ...typography.headline, color: colors.textPrimary },
  note: {
    ...typography.footnote,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
  },
  rowCopy: { flex: 1, minWidth: 120 },
  estimateCopy: { flex: 1, minWidth: 120, alignItems: 'flex-end' },
  date: { ...typography.footnote, color: colors.textSecondary },
  workout: { ...typography.headline, color: colors.textPrimary },
  value: {
    ...typography.body,
    color: colors.primary,
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },
  source: {
    ...typography.footnote,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  viewAll: { minHeight: 44, justifyContent: 'center' },
  action: { ...typography.headline, color: colors.primary },
  pressed: { opacity: 0.6 },
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
  close: { minWidth: 44, minHeight: 44, justifyContent: 'center' },
  list: { paddingBottom: spacing.xxl },
});
