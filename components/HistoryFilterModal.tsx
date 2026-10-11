import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from './AppButton';
import { GlassCard } from './GlassCard';
import { HistoryCountWheel } from './HistoryCountWheel';
import { HistoryDatePicker } from './HistoryDatePicker';
import { type HistoryFilter, validHistoryRange } from '@/lib/history-filter';
import { colors, radius, spacing, typography } from '@/lib/theme';

export function HistoryFilterModal({
  initial,
  maximum,
  onApply,
  onClose,
}: {
  initial: HistoryFilter;
  maximum: number;
  onApply: (filter: HistoryFilter) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [pane, setPane] = useState<'filter' | 'count' | 'from' | 'to'>(
    'filter',
  );
  const [dateDraft, setDateDraft] = useState(initial.from);
  const [countDraft, setCountDraft] = useState(
    Math.min(initial.count, maximum),
  );
  const back = () => (pane === 'filter' ? onClose() : setPane('filter'));
  const selectMode = (mode: HistoryFilter['mode']) =>
    setDraft({ ...draft, mode });
  const datesValid = validHistoryRange(draft);
  const openDate = (field: 'from' | 'to') => {
    setDateDraft(draft[field]);
    setPane(field);
  };
  const Container = pane === 'count' ? View : ScrollView;
  const containerProps =
    pane === 'count'
      ? { style: [s.content, s.wheelContent] }
      : { contentContainerStyle: s.content };
  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={back}
      onDismiss={onClose}
    >
      <SafeAreaView style={s.screen}>
        <Container {...containerProps}>
          {pane === 'count' ? (
            <ScrollView
              style={s.wheelHeader}
              contentContainerStyle={s.headerContent}
            >
              <AppButton title="Back" secondary onPress={back} />
              <Text accessibilityRole="header" style={s.title}>
                Recent workouts
              </Text>
            </ScrollView>
          ) : (
            <View style={s.headerContent}>
              <AppButton
                title={pane === 'filter' ? 'Cancel' : 'Back'}
                secondary
                onPress={back}
              />
              <Text accessibilityRole="header" style={s.title}>
                {pane === 'filter'
                  ? 'History filter'
                  : pane === 'from'
                    ? 'From date'
                    : 'To date'}
              </Text>
            </View>
          )}
          {pane === 'filter' ? (
            <>
              <GlassCard style={s.option}>
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: draft.mode === 'count' }}
                  accessibilityLabel="Recent workouts"
                  onPress={() => selectMode('count')}
                  style={s.mode}
                >
                  <View style={[s.circle, draft.mode === 'count' && s.checked]}>
                    <Text style={s.check}>
                      {draft.mode === 'count' ? '✓' : ''}
                    </Text>
                  </View>
                  <Text style={s.label}>Recent workouts</Text>
                </Pressable>
                <AppButton
                  title={draft.count === 0 ? 'All' : String(draft.count)}
                  accessibilityLabel="Choose number of workouts"
                  secondary
                  onPress={() => {
                    selectMode('count');
                    setCountDraft(Math.min(draft.count, maximum));
                    setPane('count');
                  }}
                />
                <Text style={s.context}>{maximum} saved workouts</Text>
              </GlassCard>
              <GlassCard style={s.option}>
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: draft.mode === 'range' }}
                  accessibilityLabel="Date range"
                  onPress={() => selectMode('range')}
                  style={s.mode}
                >
                  <View style={[s.circle, draft.mode === 'range' && s.checked]}>
                    <Text style={s.check}>
                      {draft.mode === 'range' ? '✓' : ''}
                    </Text>
                  </View>
                  <Text style={s.label}>Date range</Text>
                </Pressable>
                <AppButton
                  title={`From · ${new Date(draft.from).toLocaleDateString()}`}
                  secondary
                  onPress={() => {
                    selectMode('range');
                    openDate('from');
                  }}
                />
                <AppButton
                  title={`To · ${new Date(draft.to).toLocaleDateString()}`}
                  secondary
                  onPress={() => {
                    selectMode('range');
                    openDate('to');
                  }}
                />
                <Text style={s.context}>Both dates included</Text>
              </GlassCard>
              {draft.mode === 'range' && !datesValid && (
                <Text accessibilityRole="alert" style={s.error}>
                  Choose a To date on or after the From date.
                </Text>
              )}
              <AppButton
                title="Show"
                disabled={draft.mode === 'range' && !datesValid}
                onPress={() =>
                  onApply({
                    ...draft,
                    count:
                      draft.count === 0
                        ? 0
                        : Math.min(draft.count, Math.max(1, maximum)),
                  })
                }
              />
            </>
          ) : pane === 'count' ? (
            <>
              <HistoryCountWheel
                maximum={maximum}
                value={countDraft}
                onChange={setCountDraft}
              />
              <AppButton
                title="Done"
                onPress={() => {
                  setDraft({ ...draft, count: countDraft });
                  setPane('filter');
                }}
              />
            </>
          ) : (
            <>
              <HistoryDatePicker value={dateDraft} onChange={setDateDraft} />
              <AppButton
                title="Done"
                onPress={() => {
                  setDraft({ ...draft, [pane]: dateDraft });
                  setPane('filter');
                }}
              />
            </>
          )}
        </Container>
      </SafeAreaView>
    </Modal>
  );
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  wheelContent: { flex: 1, gap: spacing.xs, paddingVertical: spacing.xs },
  wheelHeader: { flexGrow: 0, flexShrink: 1, minHeight: 44 },
  headerContent: { gap: spacing.lg },
  content: { padding: spacing.md, gap: spacing.lg },
  title: { ...typography.title1, color: colors.textPrimary },
  option: { gap: spacing.sm },
  mode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
  },
  label: { ...typography.headline, color: colors.textPrimary, flexShrink: 1 },
  circle: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.separator,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checked: { backgroundColor: colors.success, borderColor: colors.success },
  check: { ...typography.headline, color: colors.textPrimary },
  context: { ...typography.footnote, color: colors.textSecondary },
  error: { ...typography.footnote, color: colors.danger },
});
