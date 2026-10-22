import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import type { WorkoutVolume } from '@/lib/progress-analytics';
import { colors, progressTypography, radius, spacing } from '@/lib/theme';
import { volumeChartScale, volumeChartTick } from '@/lib/training-volume-chart';
import { useLocalization } from './LocalizationProvider';
import { formatDate } from '@/lib/i18n/format';
import { progressNumber } from '@/lib/i18n/progress';
export function EstimatedOneRepMaxBars({
  workouts,
  pointLabel,
  measureLabel: customMeasureLabel,
  onSelectPoint,
  pointLimit = 7,
}: {
  workouts: readonly WorkoutVolume[];
  pointLabel: (p: WorkoutVolume) => string;
  measureLabel?: string;
  onSelectPoint?: (point: WorkoutVolume) => void;
  pointLimit?: number;
}) {
  const { t, locale } = useLocalization();
  const measureLabel = customMeasureLabel ?? t('progress.estimated');
  const volumeNumber = (value: number) =>
    progressNumber(locale, value, value !== 0);
  const shortMonth = (time: number) =>
    formatDate(locale, time, { month: 'short' });
  const { width, fontScale } = useWindowDimensions();
  const [measuredWidth, setMeasuredWidth] = useState<number>();
  const recent = workouts.slice(-pointLimit);
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
  return (
    <View
      accessibilityLabel={t('chart.summary', {
        measure: measureLabel,
        points: recent.map(pointLabel).join('; '),
      })}
    >
      <View
        accessibilityLabel={t('chart.title', { measure: measureLabel })}
        onLayout={(event) => setMeasuredWidth(event.nativeEvent.layout.width)}
        style={s.chartRows}
      >
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={s.plotRow}>
            <View
              accessibilityLabel={t('chart.scale', { measure: measureLabel })}
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
                        (progressTypography.chart.lineHeight * textScale) / 2,
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
                    style={[s.gridLine, { top: (index * plotHeight) / 4 }]}
                  />
                ))}
              </View>
              <View style={s.columns}>
                {row.map((point) => (
                  <Pressable
                    key={point.workoutId}
                    accessible
                    accessibilityRole={onSelectPoint ? 'button' : undefined}
                    accessibilityLabel={t('chart.point', {
                      measure: measureLabel,
                      point: pointLabel(point),
                    })}
                    onPress={
                      onSelectPoint ? () => onSelectPoint(point) : undefined
                    }
                    style={[s.column, { maxWidth: spacing.xxxl * textScale }]}
                  >
                    <View
                      style={[s.barSlot, { height: plotHeight + labelRoom }]}
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
                                (point.volume / scale.upper) * plotHeight,
                              ),
                            ),
                            backgroundColor:
                              point.workoutId === recent.at(-1)?.workoutId
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
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
const s = StyleSheet.create({
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
});
