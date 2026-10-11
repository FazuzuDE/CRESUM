import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppScrollView } from './AppScrollView';
import { AppButton } from './AppButton';
import { GlassCard } from './GlassCard';
import { VolumeTrendChart } from './VolumeTrendChart';
import { parseBodyWeight, type BodyWeightEntry } from '@/lib/body-weight';
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
export type BodyWeightProps = {
  entries: BodyWeightEntry[];
  busy: boolean;
  error?: string;
  onRecord: (value: string) => Promise<void>;
  onRetry: () => void;
};
export function BodyWeight({
  entries,
  busy,
  error,
  onRecord,
  onRetry,
  period,
  now,
}: { period: ProgressPeriodId; now: number } & BodyWeightProps) {
  const [adding, setAdding] = useState(false),
    [value, setValue] = useState(''),
    [problem, setProblem] = useState(''),
    [saving, setSaving] = useState(false);
  const available = entries.filter((p) => p.recordedAt <= now),
    initial = available[0],
    latest = available.at(-1);
  const start = progressPeriodStart(period, now) ?? initial?.recordedAt ?? now;
  const selected = available.filter((p) => p.recordedAt >= start);
  const min = Math.min(...selected.map((p) => p.kg)),
    max = Math.max(...selected.map((p) => p.kg)),
    padding = Math.max(1, (max - min) * 0.2);
  const range = selected.length
    ? {
        lower: Math.max(0, Math.floor((min - padding) * 2) / 2),
        upper: Math.ceil((max + padding) * 2) / 2,
      }
    : undefined;
  const close = () => {
    if (!saving) {
      setAdding(false);
      setProblem('');
    }
  };
  const save = async () => {
    try {
      parseBodyWeight(value);
      setSaving(true);
      setProblem('');
      await onRecord(value);
      setAdding(false);
      setValue('');
    } catch (e) {
      setProblem(
        e instanceof Error
          ? e.message
          : 'Could not save measurement. Try again.',
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <GlassCard style={s.card}>
      <View style={s.row}>
        <Text accessibilityRole="header" style={s.heading}>
          Body weight
        </Text>
        <AppButton
          title="Add measurement"
          presentation="text"
          disabled={busy}
          onPress={() => {
            setValue('');
            setProblem('');
            setAdding(true);
          }}
        />
      </View>
      <Text style={s.sub}>Recorded measurements · kg</Text>
      {error ? (
        <>
          <Text style={s.error} accessibilityRole="alert">
            {error}
          </Text>
          <AppButton
            title="Retry measurements"
            secondary
            onPress={onRetry}
            disabled={busy}
          />
        </>
      ) : null}
      {initial && latest ? (
        <>
          <View style={s.row}>
            <View>
              <Text style={s.label}>Initial</Text>
              <Text style={s.value}>
                {initial.kg} <Text style={s.unit}>kg</Text>
              </Text>
            </View>
            <View>
              <Text style={s.label}>Current</Text>
              <Text style={s.value}>
                {latest.kg} <Text style={s.unit}>kg</Text>
              </Text>
            </View>
          </View>
          <Text style={s.sub}>
            {latest.kg - initial.kg >= 0 ? '+' : ''}
            {Number((latest.kg - initial.kg).toFixed(2))} kg since first
            measurement
          </Text>
        </>
      ) : !error ? (
        <Text style={s.sub}>
          Add your first measurement to start tracking body weight.
        </Text>
      ) : null}
      {selected.length ? (
        <VolumeTrendChart
          workouts={selected.map((p) => ({
            workoutId: p.id,
            workoutName: 'Body weight',
            finishedAt: p.recordedAt,
            volume: p.kg,
            completedSetCount: 0,
          }))}
          start={start}
          end={now}
          measureLabel="Body weight"
          itemLabel="measurement"
          valueRange={range}
          formatPoint={(p) =>
            `${new Date(p.finishedAt).toLocaleDateString()} · ${p.volume} kg`
          }
          singlePointMessage="One measurement saved. Add another to see your trend."
        />
      ) : initial ? (
        <Text style={s.sub}>
          No measurements in {period}. Your earlier measurements are retained.
        </Text>
      ) : null}
      <Modal
        visible={adding}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={close}
      >
        <SafeAreaView style={s.screen}>
          <KeyboardAvoidingView
            style={s.screen}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <AppScrollView
              contentContainerStyle={s.content}
              keyboardShouldPersistTaps="handled"
            >
              <Text accessibilityRole="header" style={s.title}>
                Body weight
              </Text>
              <Text style={s.sub}>
                Add your current measurement. {new Date().toLocaleDateString()}
              </Text>
              <View style={s.field}>
                <Text style={s.label}>Current body weight (kg)</Text>
                <TextInput
                  accessibilityLabel="Current body weight (kg)"
                  keyboardType="decimal-pad"
                  placeholder="kg"
                  placeholderTextColor={colors.textTertiary}
                  style={s.input}
                  maxLength={32}
                  value={value}
                  editable={!saving}
                  onChangeText={setValue}
                />
              </View>
              {problem ? (
                <Text style={s.error} accessibilityRole="alert">
                  {problem}
                </Text>
              ) : null}
              <AppButton
                title={saving ? 'Saving…' : 'Save measurement'}
                disabled={saving || busy || !value.trim()}
                onPress={() => void save()}
              />
              <AppButton
                title="Cancel"
                secondary
                disabled={saving}
                onPress={close}
              />
            </AppScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </GlassCard>
  );
}
const s = StyleSheet.create({
  card: { gap: spacing.sm, borderRadius: radius.xxl },
  heading: { ...progressTypography.sectionTitle, color: colors.textEmphasis },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sub: { ...typography.footnote, color: colors.textSecondary },
  label: { ...typography.subheadline, color: colors.textPrimary },
  value: {
    ...typography.title1,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  unit: { ...typography.body, color: colors.textSecondary },
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: spacing.md,
    gap: spacing.lg,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  title: { ...typography.largeTitle, color: colors.textPrimary },
  field: { gap: spacing.xs },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceSubtle,
    minHeight: 48,
    padding: spacing.sm,
    borderRadius: radius.md,
  },
  error: { ...typography.footnote, color: colors.danger },
});
