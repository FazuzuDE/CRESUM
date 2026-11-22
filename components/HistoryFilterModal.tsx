import { createThemedStyles } from '@/components/AppThemeProvider';
import { LocalizedText as Text } from '@/components/LayoutDirection';
import { useState } from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';
import { ContentScrollView } from './ContentScrollView';
import { GlassDialog } from './GlassDialog';
import { AppButton } from './AppButton';
import { GlassCard } from './GlassCard';
import { HistoryCountWheel } from './HistoryCountWheel';
import { HistoryDatePicker } from './HistoryDatePicker';
import { type HistoryFilter, validHistoryRange } from '@/lib/history-filter';
import { radius, spacing, typography } from '@/lib/theme';
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
  const s = useStyles();
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
  const { height } = useWindowDimensions();
  return (
    <GlassDialog onClose={back}>
      <Text accessibilityRole="header" style={s.title}>
        {pane === 'filter'
          ? t('filter.title')
          : pane === 'count'
            ? t('filter.recent')
            : pane === 'from'
              ? t('filter.fromDate')
              : t('filter.toDate')}
      </Text>
      {pane === 'filter' ? (
        <ContentScrollView style={s.list} contentContainerStyle={s.content}>
          <GlassCard style={s.option}>
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: draft.mode === 'count' }}
              accessibilityLabel={t('filter.recent')}
              onPress={() => selectMode('count')}
              style={s.mode}
            >
              <View style={[s.circle, draft.mode === 'count' && s.checked]}>
                <Text style={s.check}>{draft.mode === 'count' ? '✓' : ''}</Text>
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
                <Text style={s.check}>{draft.mode === 'range' ? '✓' : ''}</Text>
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
        </ContentScrollView>
      ) : pane === 'count' ? (
        <>
          <View style={{ height: Math.min(220, height * 0.32), flexShrink: 1 }}>
            <HistoryCountWheel
              maximum={maximum}
              value={countDraft}
              onChange={setCountDraft}
            />
          </View>
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
          <View style={{ height: Math.min(220, height * 0.32), flexShrink: 1 }}>
            <HistoryDatePicker
              flexible
              value={dateDraft}
              onChange={setDateDraft}
            />
          </View>
          <AppButton
            title={t('common.done')}
            onPress={() => {
              setDraft({ ...draft, [pane]: dateDraft });
              setPane('filter');
            }}
          />
        </>
      )}
      <AppButton
        title={pane === 'filter' ? t('common.cancel') : t('filter.back')}
        secondary
        onPress={back}
      />
    </GlassDialog>
  );
}
const useStyles = createThemedStyles((colors) => ({
  list: { flexGrow: 0, flexShrink: 1 },
  content: { gap: spacing.sm },
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
}));
