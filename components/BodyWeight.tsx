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
import { useLocalization } from './LocalizationProvider';
import { formatDate } from '@/lib/i18n/format';
import { volumeNumber, periodLabel } from '@/lib/i18n/progress';
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
  const { t, locale } = useLocalization();
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
    } catch {
      setProblem('invalid');
      return;
    }
    try {
      setSaving(true);
      setProblem('');
      await onRecord(value);
      setAdding(false);
      setValue('');
    } catch {
      setProblem('save');
    } finally {
      setSaving(false);
    }
  };
  return (
    <GlassCard style={s.card}>
      <View style={s.row}>
        <Text accessibilityRole="header" style={s.heading}>
          {t('body.title')}
        </Text>
        <AppButton
          title={t('body.add')}
          presentation="text"
          disabled={busy}
          onPress={() => {
            setValue('');
            setProblem('');
            setAdding(true);
          }}
        />
      </View>
      <Text style={s.sub}>{t('body.recorded')}</Text>
      {error ? (
        <>
          <Text style={s.error} accessibilityRole="alert">
            {t('body.loadError')}
          </Text>
          <AppButton
            title={t('body.retry')}
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
              <Text style={s.label}>{t('body.initial')}</Text>
              <Text style={s.value}>
                {volumeNumber(locale, initial.kg)}{' '}
                <Text style={s.unit}>{t('progress.kg')}</Text>
              </Text>
            </View>
            <View>
              <Text style={s.label}>{t('body.current')}</Text>
              <Text style={s.value}>
                {volumeNumber(locale, latest.kg)}{' '}
                <Text style={s.unit}>{t('progress.kg')}</Text>
              </Text>
            </View>
          </View>
          <Text style={s.sub}>
            {t('body.change', {
              change: `${latest.kg - initial.kg >= 0 ? '+' : ''}${volumeNumber(locale, Number((latest.kg - initial.kg).toFixed(2)))}`,
            })}
          </Text>
        </>
      ) : !error ? (
        <Text style={s.sub}>{t('body.empty')}</Text>
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
          measureLabel={t('body.title')}
          itemLabel={t('chart.measurement')}
          valueRange={range}
          formatPoint={(p) =>
            t('body.point', {
              date: formatDate(locale, p.finishedAt),
              value: volumeNumber(locale, p.volume),
            })
          }
          singlePointMessage={t('body.one')}
        />
      ) : initial ? (
        <Text style={s.sub}>
          {t('body.noPeriod', { period: periodLabel(t, period) })}
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
                {t('body.title')}
              </Text>
              <Text style={s.sub}>
                {t('body.addCurrent', { date: formatDate(locale, now) })}
              </Text>
              <View style={s.field}>
                <Text style={s.label}>{t('body.input')}</Text>
                <TextInput
                  accessibilityLabel={t('body.input')}
                  keyboardType="decimal-pad"
                  placeholder={t('progress.kg')}
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
                  {t(problem === 'invalid' ? 'body.invalid' : 'body.saveError')}
                </Text>
              ) : null}
              <AppButton
                title={t(saving ? 'progress.saving' : 'body.save')}
                disabled={saving || busy || !value.trim()}
                onPress={() => void save()}
              />
              <AppButton
                title={t('common.cancel')}
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
