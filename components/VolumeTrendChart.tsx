import { useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import type { WorkoutVolume } from '@/lib/progress-analytics';
import { volumeTrendModel, nearestTrendPoint } from '@/lib/volume-trend';
import { volumeChartScale, volumeChartTick } from '@/lib/training-volume-chart';
import { colors, progressTypography, spacing, typography } from '@/lib/theme';
import { useLocalization } from './LocalizationProvider';
import { formatDate } from '@/lib/i18n/format';
import { progressDate, volumeNumber } from '@/lib/i18n/progress';

export function VolumeTrendChart({
  workouts,
  start,
  end,
  measureLabel: customMeasureLabel,
  formatPoint,
  singlePointMessage: customSinglePointMessage,
  valueRange,
  itemLabel: customItemLabel,
  onSelectPoint,
}: {
  workouts: readonly WorkoutVolume[];
  start: number;
  end: number;
  measureLabel?: string;
  formatPoint?: (point: WorkoutVolume) => string;
  singlePointMessage?: string;
  valueRange?: { lower: number; upper: number };
  itemLabel?: string;
  onSelectPoint?: (point: WorkoutVolume) => void;
}) {
  const { t, locale } = useLocalization();
  const measureLabel = customMeasureLabel ?? t('chart.workoutVolume');
  const singlePointMessage = customSinglePointMessage ?? t('chart.oneWorkout');
  const itemLabel = customItemLabel ?? t('chart.workout');
  const { width, fontScale } = useWindowDimensions();
  const [measured, setMeasured] = useState<number>();
  const [selectedId, setSelectedId] = useState<string>();
  const height = spacing.xxxl * 2 * Math.max(1, fontScale);
  const axisWidth = Math.max(
    spacing.xxl,
    ...(valueRange
      ? Array.from(
          { length: 5 },
          (_, i) =>
            valueRange.upper - ((valueRange.upper - valueRange.lower) * i) / 4,
        )
      : volumeChartScale(workouts.map((p) => p.volume)).ticks
    ).map(
      (tick) =>
        volumeChartTick(tick, locale).length *
        progressTypography.chart.fontSize *
        0.5 *
        Math.max(1, fontScale),
    ),
  );
  const chartWidth = Math.max(
    1,
    (measured ?? Math.min(width, 600) - spacing.md * 4) -
      axisWidth -
      spacing.xs,
  );
  const model = useMemo(
    () =>
      volumeTrendModel(
        workouts,
        start,
        end,
        Math.max(1, chartWidth - spacing.sm),
        height,
        valueRange,
      ),
    [workouts, start, end, chartWidth, height, valueRange],
  );
  const selectedIndex = Math.max(
    0,
    model.points.findIndex((p) => p.data.workoutId === selectedId),
  );
  const selected =
    model.points.find((p) => p.data.workoutId === selectedId) ??
    model.points.at(-1);
  const label = (p: WorkoutVolume) =>
    formatPoint
      ? formatPoint(p)
      : t('progress.point', {
          name: p.workoutName,
          date: progressDate(locale, p.finishedAt),
          value: volumeNumber(locale, p.volume),
        });
  return (
    <View onLayout={(event) => setMeasured(event.nativeEvent.layout.width)}>
      <View style={s.row}>
        <View
          style={{ width: axisWidth }}
          accessibilityLabel={t('chart.scale', { measure: measureLabel })}
        >
          {model.scale.ticks.map((tick, i) => (
            <Text
              key={i}
              style={[
                s.axis,
                {
                  top:
                    spacing.xs +
                    (i * height) / 4 -
                    (progressTypography.chart.lineHeight *
                      Math.max(1, fontScale)) /
                      2,
                },
              ]}
            >
              {volumeChartTick(tick, locale)}
            </Text>
          ))}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Pressable
            style={{ height: height + spacing.md }}
            accessibilityRole="adjustable"
            accessible
            accessibilityLabel={
              selected
                ? t('chart.curveSelected', {
                    measure: measureLabel,
                    point: label(selected.data),
                  })
                : t('chart.curve', { measure: measureLabel })
            }
            accessibilityHint={t('chart.hint', { item: itemLabel })}
            accessibilityActions={[
              {
                name: 'increment',
                label: t('chart.next', { item: itemLabel }),
              },
              {
                name: 'decrement',
                label: t('chart.previous', { item: itemLabel }),
              },
              ...(onSelectPoint
                ? [
                    {
                      name: 'activate' as const,
                      label: t('chart.viewSelected', { item: itemLabel }),
                    },
                  ]
                : []),
            ]}
            onAccessibilityAction={(event) => {
              if (event.nativeEvent.actionName === 'activate') {
                if (selected) onSelectPoint?.(selected.data);
                return;
              }
              const current = selected
                ? model.points.indexOf(selected)
                : selectedIndex;
              const next = Math.max(
                0,
                Math.min(
                  model.points.length - 1,
                  current +
                    (event.nativeEvent.actionName === 'increment' ? 1 : -1),
                ),
              );
              setSelectedId(model.points[next]?.data.workoutId);
            }}
            onPress={(event) => {
              if (
                !Number.isFinite(event.nativeEvent.locationX) ||
                !Number.isFinite(event.nativeEvent.locationY)
              ) {
                if (selected) onSelectPoint?.(selected.data);
                return;
              }
              const i = nearestTrendPoint(
                model.points,
                event.nativeEvent.locationX - spacing.xxs,
                event.nativeEvent.locationY - spacing.xs,
              );
              const point = model.points[i]?.data;
              setSelectedId(point?.workoutId);
              if (point) onSelectPoint?.(point);
            }}
          >
            {model.scale.ticks.map((_, i) => (
              <View
                key={`grid-${i}`}
                pointerEvents="none"
                style={[s.grid, { top: spacing.xs + (i * height) / 4 }]}
              />
            ))}
            <View
              pointerEvents="none"
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={{
                position: 'absolute',
                left: spacing.xxs,
                top: spacing.xs,
                width: Math.max(1, chartWidth - spacing.sm),
                height,
              }}
            >
              {model.line.slice(1).map((p, i) => {
                const a = model.line[i],
                  dx = p.x - a.x,
                  dy = p.y - a.y,
                  len = Math.hypot(dx, dy);
                return (
                  <View
                    key={`line-${i}`}
                    style={[
                      s.line,
                      {
                        left: (a.x + p.x - len) / 2,
                        top: (a.y + p.y) / 2 - 1,
                        width: len + 1,
                        transform: [{ rotate: `${Math.atan2(dy, dx)}rad` }],
                      },
                    ]}
                  />
                );
              })}
              {model.points.map((p) => (
                <View
                  key={p.data.workoutId}
                  accessibilityLabel={
                    formatPoint
                      ? label(p.data)
                      : t('chart.point', {
                          measure: measureLabel,
                          point: label(p.data),
                        })
                  }
                  style={[
                    s.dot,
                    { left: p.x - 3, top: p.y - 3 },
                    p === selected && s.selectedDot,
                  ]}
                />
              ))}
            </View>
          </Pressable>
          <View style={s.dates}>
            {model.ticks
              .filter((_, i) => fontScale <= 1.3 || i === 0 || i === 3)
              .map((tick, i) => (
                <View key={i} style={s.date}>
                  <Text style={s.day}>
                    {formatDate(locale, tick, {
                      day: 'numeric',
                    })}
                  </Text>
                  <Text style={s.month}>
                    {formatDate(locale, tick, {
                      month: 'short',
                      ...(end - start > 365 * 86400000
                        ? { year: '2-digit' }
                        : {}),
                    })}
                  </Text>
                </View>
              ))}
          </View>
        </View>
      </View>
      {selected && (
        <Text accessibilityLiveRegion="polite" style={s.detail}>
          {label(selected.data)}
        </Text>
      )}
      {model.points.length === 1 && (
        <Text style={s.detail}>{singlePointMessage}</Text>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.xs },
  axis: {
    ...progressTypography.chart,
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'right',
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  grid: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.separator,
  },
  line: {
    position: 'absolute',
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.primary,
  },
  dot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  selectedDot: { backgroundColor: colors.secondary },
  dates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xxs,
  },
  date: { alignItems: 'center', flexShrink: 1 },
  day: {
    ...progressTypography.chartDay,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  month: {
    ...progressTypography.chart,
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  detail: {
    ...typography.footnote,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
});
