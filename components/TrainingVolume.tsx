import { AppFlatList } from './AppFlatList';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from './GlassCard';
import { VolumeTrendChart } from './VolumeTrendChart';
import { Ionicons } from '@expo/vector-icons';
import type { VolumeComparison } from '@/lib/progress-volume-comparison';
import type { WorkoutVolume } from '@/lib/progress-analytics';
import {
  progressPeriodStart,
  type ProgressPeriodId,
} from '@/lib/progress-periods';
import {
  colors,
  progressTypography,
  radius,
  spacing,
  typography,
} from '@/lib/theme';
import { volumeChartScale, volumeChartTick } from '@/lib/training-volume-chart';
import { useLocalization } from './LocalizationProvider';
import { formatDate } from '@/lib/i18n/format';
import {
  volumeNumber as localizedVolume,
  progressDate,
  periodLabel,
} from '@/lib/i18n/progress';

type Props = {
  totalVolume: number;
  workoutVolumes: readonly WorkoutVolume[];
  period: ProgressPeriodId;
  comparison?: VolumeComparison;
  now: number;
};

export function TrainingVolume({
  totalVolume,
  workoutVolumes,
  period,
  comparison,
  now,
}: Props) {
  const { t, locale } = useLocalization();
  const periodText = periodLabel(t, period);
  const volumeNumber = (v: number) => localizedVolume(locale, v);
  const volumeLabel = (v: number) =>
    t('progress.valueKg', { value: volumeNumber(v) });
  const fullDate = (v: number) => progressDate(locale, v);
  const shortMonth = (v: number) => formatDate(locale, v, { month: 'short' });
  const pointLabel = (p: WorkoutVolume) =>
    t('progress.point', {
      name: p.workoutName,
      date: fullDate(p.finishedAt),
      value: volumeNumber(p.volume),
    });
  const [allOpen, setAllOpen] = useState(false);
  const { width, fontScale } = useWindowDimensions();
  const [measuredWidth, setMeasuredWidth] = useState<number>();
  const recent = workoutVolumes.slice(0, 7).reverse();
  const scale = volumeChartScale(recent.map((point) => point.volume));
  const textScale = Math.max(1, fontScale);
  const plotHeight = spacing.xxxl * 2 * textScale;
  const axisWidth = Math.max(
    spacing.xxl,
    ...scale.ticks.map(
      (tick) =>
        volumeChartTick(tick, locale).length *
        progressTypography.chart.fontSize *
        0.5 *
        textScale,
    ),
  );
  const chartWidth =
    measuredWidth ?? Math.max(0, Math.min(width, 600) - spacing.md * 4);
  const columnsPerRow = Math.max(
    1,
    Math.min(
      7,
      Math.floor(
        (chartWidth - axisWidth - spacing.xs + spacing.xxs) /
          (spacing.lg * textScale + spacing.xxs),
      ),
    ),
  );
  const columnCount = Math.max(1, Math.min(columnsPerRow, recent.length));
  const columnWidth = Math.max(
    1,
    Math.min(
      spacing.xxxl * textScale,
      (chartWidth - axisWidth - spacing.xs - (columnCount - 1) * spacing.xxs) /
        columnCount,
    ),
  );
  const valueLines = Math.max(
    1,
    ...recent.map((point) =>
      Math.ceil(
        (volumeNumber(point.volume).length *
          progressTypography.chartValue.fontSize *
          0.6 *
          textScale) /
          columnWidth,
      ),
    ),
  );
  const largest = Math.max(0, ...recent.map((point) => point.volume));
  const labelRoom = Math.max(
    0,
    valueLines * progressTypography.chartValue.lineHeight * textScale +
      spacing.xxs -
      plotHeight * (1 - largest / scale.upper),
  );
  const rows = Array.from(
    { length: Math.ceil(recent.length / columnsPerRow) },
    (_, index) =>
      recent.slice(index * columnsPerRow, (index + 1) * columnsPerRow),
  );
  const changeColor =
    comparison?.kind === 'increase'
      ? colors.volumeIncrease
      : comparison?.kind === 'decrease'
        ? colors.volumeDecrease
        : colors.textSecondary;
  const changeAmount =
    comparison && comparison.kind !== 'unavailable'
      ? volumeNumber(Math.abs(comparison.delta))
      : undefined;
  const changeText =
    !comparison || comparison.kind === 'unavailable'
      ? t('volume.noData')
      : comparison.kind === 'unchanged'
        ? t('volume.noChange')
        : t('progress.valueKg', {
            value: `${comparison.delta > 0 ? '+' : '−'}${changeAmount}`,
          });
  const changeLabel =
    !comparison || comparison.kind === 'unavailable'
      ? t('volume.noComparison')
      : comparison.kind === 'unchanged'
        ? t('volume.unchanged')
        : t(
            comparison.kind === 'increase'
              ? 'volume.increased'
              : 'volume.decreased',
            { amount: changeAmount! },
          );

  return (
    <GlassCard style={s.card}>
      <Text style={s.cardLabel}>{t('volume.heading')}</Text>
      <View style={s.totalRow}>
        <Text style={[s.big, { flexBasis: spacing.xxxl * 4 * textScale }]}>
          {volumeNumber(totalVolume)}{' '}
          <Text style={s.unit}>{t('progress.kg')}</Text>
        </Text>
        {comparison ? (
          <View
            accessible
            accessibilityLabel={changeLabel}
            style={s.comparison}
          >
            <View style={s.changeRow}>
              {(comparison.kind === 'increase' ||
                comparison.kind === 'decrease') && (
                <Ionicons
                  name={
                    comparison.kind === 'increase' ? 'arrow-up' : 'arrow-down'
                  }
                  size={16 * textScale}
                  color={changeColor}
                  accessible={false}
                />
              )}
              <Text style={[s.change, { color: changeColor }]}>
                {changeText}
              </Text>
            </View>
            <Text style={[s.subtitle, s.comparisonContext]}>
              {t('progress.vsPrevious')}
            </Text>
          </View>
        ) : null}
      </View>
      <Text style={s.subtitle}>
        {t('volume.workouts', {
          count: workoutVolumes.length,
          period: periodText,
        })}
      </Text>
      {recent.length === 0 ? (
        <Text style={s.empty}>{t('volume.empty')}</Text>
      ) : (
        <>
          <View style={s.chartHeader}>
            <Text style={s.context}>
              {period === '1W'
                ? t('volume.recent', {
                    shown: recent.length,
                    total: workoutVolumes.length,
                  })
                : period === '1M'
                  ? t('volume.lastThirty')
                  : t('volume.byWorkout')}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('volume.viewAllA11y', {
                count: workoutVolumes.length,
                period: periodText,
              })}
              onPress={() => setAllOpen(true)}
              style={({ pressed }) => [s.viewAll, pressed && s.pressed]}
            >
              <Text style={s.viewAllText}>
                {t('volume.viewAll', { period: periodText })}
              </Text>
            </Pressable>
          </View>
          {period !== '1W' ? (
            <VolumeTrendChart
              key={period}
              workouts={workoutVolumes}
              start={
                progressPeriodStart(period, now) ??
                Math.min(now, ...workoutVolumes.map((p) => p.finishedAt))
              }
              end={now}
            />
          ) : (
            <View
              accessibilityLabel={t('volume.recentSummary', {
                points: recent.map(pointLabel).join('; '),
              })}
            >
              <View
                accessibilityLabel={t('chart.title', {
                  measure: t('chart.workoutVolume'),
                })}
                onLayout={(event) =>
                  setMeasuredWidth(event.nativeEvent.layout.width)
                }
                style={s.chartRows}
              >
                {rows.map((row, rowIndex) => (
                  <View key={rowIndex} style={s.plotRow}>
                    <View
                      accessibilityLabel={t('chart.scale', {
                        measure: t('chart.workoutVolume'),
                      })}
                      style={{ width: axisWidth }}
                    >
                      {scale.ticks.map((tick, index) => (
                        <Text
                          key={index}
                          style={[
                            s.axisLabel,
                            {
                              top:
                                labelRoom +
                                (index * plotHeight) / 4 -
                                (progressTypography.chart.lineHeight *
                                  textScale) /
                                  2,
                            },
                          ]}
                        >
                          {volumeChartTick(tick, locale)}
                        </Text>
                      ))}
                    </View>
                    <View style={s.plot}>
                      <View
                        pointerEvents="none"
                        accessibilityElementsHidden
                        importantForAccessibility="no-hide-descendants"
                        style={[s.grid, { top: labelRoom, height: plotHeight }]}
                      >
                        {scale.ticks.map((_, index) => (
                          <View
                            key={index}
                            style={[
                              s.gridLine,
                              { top: (index * plotHeight) / 4 },
                            ]}
                          />
                        ))}
                      </View>
                      <View style={s.columns}>
                        {row.map((point) => (
                          <View
                            key={point.workoutId}
                            accessible
                            accessibilityLabel={t('chart.point', {
                              measure: t('chart.workoutVolume'),
                              point: pointLabel(point),
                            })}
                            style={[
                              s.column,
                              { maxWidth: spacing.xxxl * textScale },
                            ]}
                          >
                            <View
                              style={[
                                s.barSlot,
                                { height: plotHeight + labelRoom },
                              ]}
                            >
                              <Text style={s.pointValue}>
                                {volumeNumber(point.volume)}
                              </Text>
                              <View
                                style={[
                                  s.bar,
                                  {
                                    height: Math.max(
                                      0,
                                      Math.min(
                                        plotHeight,
                                        (point.volume / scale.upper) *
                                          plotHeight,
                                      ),
                                    ),
                                    backgroundColor:
                                      point.workoutId ===
                                      recent.at(-1)?.workoutId
                                        ? colors.primary
                                        : colors.secondary,
                                  },
                                ]}
                              />
                            </View>
                            <View style={s.date}>
                              <Text style={s.day}>
                                {formatDate(locale, point.finishedAt, {
                                  day: 'numeric',
                                })}
                              </Text>
                              <Text style={s.month}>
                                {shortMonth(point.finishedAt)}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
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
            <View style={s.headerCopy}>
              <Text style={s.title}>{t('volume.listTitle')}</Text>
              <Text style={s.subtitle}>
                {t('volume.all', {
                  count: workoutVolumes.length,
                  period: periodText,
                })}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('volume.close')}
              onPress={() => setAllOpen(false)}
              style={({ pressed }) => [s.close, pressed && s.pressed]}
            >
              <Text style={s.closeText}>{t('progress.close')}</Text>
            </Pressable>
          </View>
          <AppFlatList
            data={workoutVolumes}
            keyExtractor={(item) => item.workoutId}
            contentContainerStyle={s.list}
            renderItem={({ item }) => (
              <View
                accessible
                accessibilityLabel={pointLabel(item)}
                style={s.row}
              >
                <View style={s.rowCopy}>
                  <Text style={s.rowDate}>{fullDate(item.finishedAt)}</Text>
                  <Text style={s.rowName}>{item.workoutName}</Text>
                </View>
                <Text style={s.rowVolume}>{volumeLabel(item.volume)}</Text>
              </View>
            )}
          />
        </SafeAreaView>
      </Modal>
    </GlassCard>
  );
}

const s = StyleSheet.create({
  card: { padding: spacing.md, borderRadius: radius.xxl },
  cardLabel: {
    ...progressTypography.label,
    color: colors.textSecondary,
    marginBottom: spacing.xxs,
    letterSpacing: 1,
  },
  big: {
    ...progressTypography.statistic,
    color: colors.textEmphasis,
    fontVariant: ['tabular-nums'],
    flexGrow: 1,
    flexShrink: 1,
    maxWidth: '100%',
  },
  totalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  comparison: {
    alignItems: 'flex-end',
    marginLeft: 'auto',
    maxWidth: '100%',
    flexShrink: 1,
    flexBasis: spacing.xxxl * 2,
    flexGrow: 1,
  },
  comparisonContext: {
    ...progressTypography.chart,
    textAlign: 'right',
    maxWidth: '100%',
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    maxWidth: '100%',
  },
  change: {
    ...progressTypography.comparison,
    fontVariant: ['tabular-nums'],
    flexShrink: 1,
    textAlign: 'right',
  },
  unit: { ...progressTypography.unit, color: colors.textSecondary },
  subtitle: { ...typography.footnote, color: colors.textSecondary },
  empty: {
    ...typography.footnote,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  chartHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
    marginTop: spacing.xxs,
  },
  context: {
    ...typography.footnote,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  pointValue: {
    ...progressTypography.chartValue,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    zIndex: 1,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
    alignSelf: 'stretch',
    marginBottom: spacing.xxs,
  },
  chartRows: { gap: spacing.lg },
  plotRow: { flexDirection: 'row', gap: spacing.xs },
  plot: { flex: 1, minWidth: 0 },
  grid: { position: 'absolute', left: 0, right: 0 },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderBottomWidth: 1,
    borderColor: colors.separator,
    borderStyle: 'dashed',
  },
  axisLabel: {
    ...progressTypography.chart,
    fontVariant: ['tabular-nums'],
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'right',
    color: colors.textSecondary,
  },
  columns: { flexDirection: 'row', gap: spacing.xxs },
  column: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: spacing.xs,
  },
  barSlot: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    maxWidth: spacing.xl,
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.sm,
  },
  date: { alignItems: 'center' },
  day: {
    ...progressTypography.chartDay,
    fontVariant: ['tabular-nums'],
    color: colors.textPrimary,
    textAlign: 'center',
  },
  month: {
    ...progressTypography.chart,
    fontVariant: ['tabular-nums'],
    color: colors.textSecondary,
    textAlign: 'center',
  },
  viewAll: { minHeight: 44, justifyContent: 'center', maxWidth: '100%' },
  viewAllText: {
    ...typography.footnote,
    color: colors.primary,
    maxWidth: '100%',
  },
  pressed: { opacity: 0.6 },
  sheet: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
  },
  header: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerCopy: { flex: 1, minWidth: 0 },
  title: { ...typography.title2, color: colors.textEmphasis },
  close: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { ...typography.headline, color: colors.primary },
  list: { paddingBottom: spacing.xxl },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
    gap: spacing.sm,
  },
  rowCopy: { flex: 1, minWidth: 120, gap: spacing.xxs },
  rowDate: { ...typography.footnote, color: colors.textSecondary },
  rowName: { ...typography.headline, color: colors.textPrimary },
  rowVolume: {
    ...typography.body,
    color: colors.textEmphasis,
    fontVariant: ['tabular-nums'],
    flexShrink: 1,
    textAlign: 'right',
  },
});
