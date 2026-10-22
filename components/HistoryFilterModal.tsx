import { AppScrollView } from './AppScrollView';
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
import { useLocalization } from './LocalizationProvider';
import { formatDate, formatNumber } from '@/lib/i18n/format';

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
  const { t, locale } = useLocalization();
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
  const wheelPane = pane !== 'filter';
  const Container = wheelPane ? View : AppScrollView;
  const containerProps = wheelPane
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
          {wheelPane ? (
            <ScrollView
              style={s.wheelHeader}
              contentContainerStyle={s.headerContent}
            >
              <AppButton title={t('filter.back')} secondary onPress={back} />
              <Text accessibilityRole="header" style={s.title}>
                {pane === 'count'
                  ? t('filter.recent')
                  : pane === 'from'
                    ? t('filter.fromDate')
                    : t('filter.toDate')}
              </Text>
            </ScrollView>
          ) : (
            <View style={s.headerContent}>
              <AppButton
                title={
                  pane === 'filter' ? t('common.cancel') : t('filter.back')
                }
                secondary
                onPress={back}
              />
              <Text accessibilityRole="header" style={s.title}>
                {pane === 'filter'
                  ? t('filter.title')
                  : pane === 'from'
                    ? t('filter.fromDate')
                    : t('filter.toDate')}
              </Text>
            </View>
          )}
          {pane === 'filter' ? (
            <>
              <GlassCard style={s.option}>
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: draft.mode === 'count' }}
                  accessibilityLabel={t('filter.recent')}
                  onPress={() => selectMode('count')}
                  style={s.mode}
                >
                  <View style={[s.circle, draft.mode === 'count' && s.checked]}>
                    <Text style={s.check}>
                      {draft.mode === 'count' ? '✓' : ''}
                    </Text>
                  </View>
                  <Text style={s.label}>{t('filter.recent')}</Text>
                </Pressable>
                <AppButton
                  title={
                    draft.count === 0
                      ? t('filter.all')
                      : formatNumber(locale, draft.count, {
                          useGrouping: false,
                        })
                  }
                  accessibilityLabel={t('filter.chooseCount')}
                  secondary
                  onPress={() => {
                    selectMode('count');
                    setCountDraft(Math.min(draft.count, maximum));
                    setPane('count');
                  }}
                />
                <Text style={s.context}>
                  {t('filter.saved', { count: maximum })}
                </Text>
              </GlassCard>
              <GlassCard style={s.option}>
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: draft.mode === 'range' }}
                  accessibilityLabel={t('filter.range')}
                  onPress={() => selectMode('range')}
                  style={s.mode}
                >
                  <View style={[s.circle, draft.mode === 'range' && s.checked]}>
                    <Text style={s.check}>
                      {draft.mode === 'range' ? '✓' : ''}
                    </Text>
                  </View>
                  <Text style={s.label}>{t('filter.range')}</Text>
                </Pressable>
                <AppButton
                  title={t('filter.from', {
                    date: formatDate(locale, draft.from),
                  })}
                  secondary
                  onPress={() => {
                    selectMode('range');
                    openDate('from');
                  }}
                />
                <AppButton
                  title={t('filter.to', { date: formatDate(locale, draft.to) })}
                  secondary
                  onPress={() => {
                    selectMode('range');
                    openDate('to');
                  }}
                />
                <Text style={s.context}>{t('filter.inclusive')}</Text>
              </GlassCard>
              {draft.mode === 'range' && !datesValid && (
                <Text accessibilityRole="alert" style={s.error}>
                  {t('filter.invalid')}
                </Text>
              )}
              <AppButton
                title={t('filter.show')}
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
                title={t('common.done')}
                onPress={() => {
                  setDraft({ ...draft, count: countDraft });
                  setPane('filter');
                }}
              />
            </>
          ) : (
            <>
              <HistoryDatePicker
                flexible
                value={dateDraft}
                onChange={setDateDraft}
              />
              <AppButton
                title={t('common.done')}
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
