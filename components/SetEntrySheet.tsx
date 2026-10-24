import { Fragment, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { AppPicker } from './AppPicker';
import { AppButton } from './AppButton';
import { useLocalization } from './LocalizationProvider';
import { formatEntryNumber, formatNumber } from '@/lib/i18n/format';
import {
  adjustEntry,
  entryIsValid,
  entryStep,
  normalizedEntry,
  repOptions,
  weightOptions,
  type SetValues,
} from '@/lib/set-entry';
import type { WorkoutSet } from '@/lib/workout-model';
import { colors, radius, spacing, typography } from '@/lib/theme';

/** Mounted per snapshot; drafts never reach storage before Save. */
export function SetEntrySheet({
  set,
  setNumber,
  libraryId,
  previous,
  busy = false,
  onCancel,
  onSave,
}: {
  set: WorkoutSet;
  setNumber: number;
  libraryId: string;
  previous?: WorkoutSet;
  busy?: boolean;
  onCancel: () => void;
  onSave: (values: SetValues) => void;
}) {
  const { t, locale } = useLocalization();
  const [draft, setDraft] = useState<SetValues>(() => ({
    weight: set.weight,
    reps: set.reps,
    ...(set.otherSideReps === undefined
      ? {}
      : { otherSideReps: set.otherSideReps }),
  }));
  const [mode, setMode] = useState<'wheel' | 'keypad'>(
    entryIsValid(set, libraryId) ? 'wheel' : 'keypad',
  );
  const [error, setError] = useState(false),
    step = entryStep(libraryId),
    valid = entryIsValid(draft, libraryId),
    bilateral = draft.otherSideReps !== undefined;
  const [wheelActive, setWheelActive] = useState(false);
  const locked = busy || wheelActive;
  const { width, fontScale } = useWindowDimensions();
  const compact = bilateral || width < 375 || fontScale > 1.2;
  const keys: (keyof SetValues)[] = bilateral
    ? ['weight', 'reps', 'otherSideReps']
    : ['weight', 'reps'];
  const labels = bilateral
    ? [
        t('entry.weightHeading'),
        t('entry.leftHeading'),
        t('entry.rightHeading'),
      ]
    : [t('entry.weightHeading'), t('entry.repsHeading')];
  const adjustLabels = {
    weight: { minus: 'entry.decreaseWeight', plus: 'entry.increaseWeight' },
    reps: {
      minus: bilateral ? 'entry.decreaseLeft' : 'entry.decreaseReps',
      plus: bilateral ? 'entry.increaseLeft' : 'entry.increaseReps',
    },
    otherSideReps: {
      minus: 'entry.decreaseRight',
      plus: 'entry.increaseRight',
    },
  } as const;
  const entrySummary = (value: SetValues) =>
    value.otherSideReps === undefined
      ? t('entry.singleSummary', {
          weight: formatEntryNumber(locale, value.weight),
          reps: formatEntryNumber(locale, value.reps),
        })
      : t('entry.bilateralSummary', {
          weight: formatEntryNumber(locale, value.weight),
          reps: formatEntryNumber(locale, value.reps),
          other: formatEntryNumber(locale, value.otherSideReps),
        });
  const columns = keys.map((k) =>
    k === 'weight' ? weightOptions(draft.weight, step) : repOptions(draft[k]!),
  );
  const displayColumns = columns.map((column) =>
    column.map((value) => formatEntryNumber(locale, value)),
  );
  const selected = keys.map((k, i) =>
    Math.max(0, columns[i].indexOf(draft[k]!.trim().replace(',', '.'))),
  );
  const change = (key: keyof SetValues, value: string) =>
    setDraft((d) => ({ ...d, [key]: value }));
  const switchMode = (next: 'wheel' | 'keypad') => {
    if (locked) return;
    if (next === 'wheel') {
      const initialized = {
        ...draft,
        weight: draft.weight.trim() ? draft.weight : '0',
        reps: draft.reps.trim() ? draft.reps : '1',
        ...(bilateral
          ? {
              otherSideReps: draft.otherSideReps!.trim()
                ? draft.otherSideReps
                : '1',
            }
          : {}),
      };
      if (!entryIsValid(initialized, libraryId)) {
        setError(true);
        return;
      }
      setDraft(normalizedEntry(initialized));
      Keyboard.dismiss();
    }
    setMode(next);
    setError(false);
  };
  const adjust = (key: keyof SetValues, sign: number) => {
    if (locked) return;
    const current = draft[key]!,
      next = adjustEntry(
        current,
        sign,
        key === 'weight' ? step : 1,
        key === 'weight' ? 0 : 1,
      );
    if (next !== current) {
      change(key, next);
      void Haptics.selectionAsync?.().catch(() => {});
    }
  };
  const values = normalizedEntry(draft),
    summary = entrySummary(values);
  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      allowSwipeDismissal
      onRequestClose={onCancel}
    >
      <SafeAreaView style={s.root}>
        <KeyboardAvoidingView
          style={s.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            style={s.header}
            contentContainerStyle={s.headerContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={s.titleRow}>
              <Text accessibilityRole="header" style={s.title}>
                {t('entry.title', { index: setNumber })}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('entry.cancelLabel')}
                onPress={onCancel}
                style={s.cancel}
              >
                <Text style={s.link}>{t('common.cancel')}</Text>
              </Pressable>
            </View>
            <Text style={s.previous}>
              {previous
                ? t('entry.previous', { summary: entrySummary(previous) })
                : t('entry.noPrevious')}
            </Text>
            <View style={s.modes}>
              {(['wheel', 'keypad'] as const).map((m) => (
                <Pressable
                  key={m}
                  accessibilityRole="button"
                  accessibilityLabel={t(
                    m === 'wheel' ? 'entry.useWheel' : 'entry.useKeypad',
                  )}
                  accessibilityState={{
                    selected: mode === m,
                    disabled: locked,
                  }}
                  disabled={locked}
                  style={[s.mode, mode === m && s.selected]}
                  onPress={() => switchMode(m)}
                >
                  <Text style={[s.modeText, mode === m && s.modeActive]}>
                    {t(m === 'wheel' ? 'entry.wheel' : 'entry.keypad')}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
          <View style={s.fields}>
            <View style={s.labels}>
              {labels.map((l) => (
                <Text key={l} style={s.label}>
                  {l}
                </Text>
              ))}
            </View>
            {mode === 'wheel' ? (
              <View
                style={s.wheel}
                pointerEvents={busy ? 'none' : 'auto'}
                accessibilityElementsHidden={busy}
                importantForAccessibility={
                  busy ? 'no-hide-descendants' : 'auto'
                }
              >
                <AppPicker
                  flexible
                  columns={displayColumns}
                  selected={selected}
                  labels={labels}
                  onInteractionChange={setWheelActive}
                  onChange={(component, row) => {
                    if (
                      !busy &&
                      keys[component] &&
                      columns[component][row] !== undefined
                    )
                      change(keys[component], columns[component][row]);
                  }}
                />
              </View>
            ) : (
              <ScrollView keyboardShouldPersistTaps="handled" style={s.keypad}>
                <View style={s.inputs}>
                  {keys.map((k) => (
                    <TextInput
                      key={k}
                      accessibilityLabel={
                        k === 'weight'
                          ? t('entry.exactWeight')
                          : k === 'otherSideReps'
                            ? t('entry.exactRight')
                            : bilateral
                              ? t('entry.exactLeft')
                              : t('entry.exactReps')
                      }
                      keyboardType={
                        k === 'weight' ? 'decimal-pad' : 'number-pad'
                      }
                      value={draft[k]}
                      editable={!busy}
                      onChangeText={(value) => change(k, value)}
                      style={s.input}
                      placeholder={k === 'weight' ? '0' : t('entry.phReps')}
                      placeholderTextColor={colors.textTertiary}
                    />
                  ))}
                </View>
              </ScrollView>
            )}
          </View>
          <ScrollView
            style={s.footer}
            contentContainerStyle={s.footerContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={s.adjusters}>
              {keys.map((k) => (
                <View key={k} style={s.adjuster}>
                  <View style={s.buttons}>
                    {([-1, 1] as const).map((sign) => (
                      <Fragment key={sign}>
                        {sign === 1 && !compact ? (
                          <Text style={[s.step, { flex: 1 }]}>
                            {k === 'weight'
                              ? t('entry.stepWeight', {
                                  step: formatNumber(locale, step),
                                })
                              : t('entry.stepReps')}
                          </Text>
                        ) : null}
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={t(
                            adjustLabels[k][sign < 0 ? 'minus' : 'plus'],
                          )}
                          disabled={
                            locked ||
                            !draft[k]!.trim() ||
                            !Number.isFinite(
                              Number(draft[k]!.replace(',', '.')),
                            ) ||
                            (sign < 0 &&
                              Number(draft[k]!.replace(',', '.')) <=
                                (k === 'weight' ? 0 : 1))
                          }
                          onPress={() => adjust(k, sign)}
                          style={s.stepButton}
                        >
                          <Text style={s.stepSymbol}>
                            {sign < 0 ? '−' : '+'}
                          </Text>
                        </Pressable>
                      </Fragment>
                    ))}
                  </View>
                  {compact ? (
                    <Text style={s.step}>
                      {k === 'weight'
                        ? t('entry.stepWeight', {
                            step: formatNumber(locale, step),
                          })
                        : t('entry.stepReps')}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
            {error || !valid ? (
              <Text accessibilityRole="alert" style={s.error}>
                {libraryId === 'bodyweight-step-up'
                  ? t('entry.errorStepUp')
                  : t('entry.errorNumbers')}
              </Text>
            ) : null}
            <AppButton
              accessibilityLabel={t('entry.saveValues')}
              title={
                valid ? t('entry.saveSummary', { summary }) : t('entry.saveSet')
              }
              disabled={locked || !valid}
              onPress={() => {
                if (!locked && valid) onSave(values);
              }}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  header: { flexGrow: 0, flexShrink: 1, minHeight: 44 },
  headerContent: { gap: spacing.lg },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: { ...typography.title2, color: colors.textPrimary, flex: 1 },
  cancel: { minHeight: 44, justifyContent: 'center', flexShrink: 1 },
  link: { ...typography.body, color: colors.primary, maxWidth: '100%' },
  previous: { ...typography.subheadline, color: colors.textSecondary },
  modes: {
    flexDirection: 'row',
    padding: spacing.xxs,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
  },
  mode: {
    flex: 1,
    minHeight: 44,
    padding: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  selected: { backgroundColor: colors.surface },
  modeText: {
    ...typography.callout,
    color: colors.textSecondary,
    maxWidth: '100%',
    textAlign: 'center',
  },
  modeActive: { fontWeight: '600', color: colors.textPrimary },
  fields: { flex: 1, minHeight: 88, gap: spacing.xs },
  labels: { flexDirection: 'row', gap: spacing.xs },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
    textAlign: 'center',
  },
  wheel: { flex: 1 },
  keypad: { flex: 1 },
  inputs: { flexDirection: 'row', gap: spacing.sm },
  input: {
    ...typography.title2,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    minHeight: 60,
    padding: spacing.sm,
    flex: 1,
    textAlign: 'center',
  },
  footer: { flexGrow: 0, flexShrink: 1, minHeight: 56 },
  footerContent: { gap: spacing.md },
  adjusters: { flexDirection: 'row', gap: spacing.sm },
  adjuster: { flex: 1, gap: spacing.xs },
  buttons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xxs,
  },
  stepButton: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepSymbol: { ...typography.title2, color: colors.primary },
  step: {
    ...typography.footnote,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  error: { ...typography.footnote, color: colors.danger },
});
