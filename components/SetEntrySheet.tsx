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
    ? ['WEIGHT · KG', 'LEFT REPS', 'RIGHT REPS']
    : ['WEIGHT · KG', 'REPETITIONS'];
  const columns = keys.map((k) =>
    k === 'weight' ? weightOptions(draft.weight, step) : repOptions(draft[k]!),
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
    summary = `${values.weight} kg × ${values.reps}${bilateral ? ` / ${values.otherSideReps}` : ''}`;
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
                Set {setNumber}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cancel set editing"
                onPress={onCancel}
                style={s.cancel}
              >
                <Text style={s.link}>Cancel</Text>
              </Pressable>
            </View>
            <Text style={s.previous}>
              {previous
                ? `Previous session · ${previous.weight} kg × ${previous.reps}${previous.otherSideReps === undefined ? '' : ` / ${previous.otherSideReps}`}`
                : 'No previous completed set'}
            </Text>
            <View style={s.modes}>
              {(['wheel', 'keypad'] as const).map((m) => (
                <Pressable
                  key={m}
                  accessibilityRole="button"
                  accessibilityLabel={`Use ${m}`}
                  accessibilityState={{
                    selected: mode === m,
                    disabled: locked,
                  }}
                  disabled={locked}
                  style={[s.mode, mode === m && s.selected]}
                  onPress={() => switchMode(m)}
                >
                  <Text style={[s.modeText, mode === m && s.modeActive]}>
                    {m === 'wheel' ? 'Wheel' : 'Keypad'}
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
                  columns={columns}
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
                          ? 'Exact weight in kilograms'
                          : k === 'otherSideReps'
                            ? 'Exact right repetitions'
                            : bilateral
                              ? 'Exact left repetitions'
                              : 'Exact repetitions'
                      }
                      keyboardType={
                        k === 'weight' ? 'decimal-pad' : 'number-pad'
                      }
                      value={draft[k]}
                      editable={!busy}
                      onChangeText={(value) => change(k, value)}
                      style={s.input}
                      placeholder={k === 'weight' ? '0' : 'Reps'}
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
                            Step · {k === 'weight' ? `${step} kg` : '1 rep'}
                          </Text>
                        ) : null}
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`${sign < 0 ? 'Decrease' : 'Increase'} ${k === 'weight' ? 'weight' : k === 'otherSideReps' ? 'right repetitions' : bilateral ? 'left repetitions' : 'repetitions'}`}
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
                      Step · {k === 'weight' ? `${step} kg` : '1 rep'}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
            {error || !valid ? (
              <Text accessibilityRole="alert" style={s.error}>
                {libraryId === 'bodyweight-step-up'
                  ? 'Unloaded step-up uses 0 kg. Enter positive whole repetitions for each side.'
                  : 'Enter a non-negative weight and positive whole repetitions.'}
              </Text>
            ) : null}
            <AppButton
              accessibilityLabel="Save set values"
              title={valid ? `Save · ${summary}` : 'Save set'}
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
  cancel: { minHeight: 44, justifyContent: 'center' },
  link: { ...typography.body, color: colors.primary },
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
  modeText: { ...typography.callout, color: colors.textSecondary },
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
