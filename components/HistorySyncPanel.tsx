import { useLocalization } from './LocalizationProvider';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from './AppButton';
import type { HistorySyncSnapshot } from '@/lib/sync/history-coordinator';
import { colors, spacing, typography } from '@/lib/theme';
import type {
  HistoryComparison,
  HistoryConflictSummary,
} from '@/lib/sync/history-resolver';
import type { ResolutionChoice } from '@/lib/sync/history-rpc';
export type HistoryReviewActions = {
  conflicts(): Promise<HistoryConflictSummary[]>;
  compare(id: string): Promise<HistoryComparison>;
  resolve(view: HistoryComparison, choice: ResolutionChoice): Promise<void>;
  sync(): Promise<void>;
};
export type HistorySyncControls = {
  snapshot: HistorySyncSnapshot;
  onEnable: () => void;
  onSync: () => void;
  review?: HistoryReviewActions;
  onReview?: () => void;
};
export function HistorySyncPanel({
  snapshot,
  onEnable,
  onSync,
  review,
  onReview,
}: HistorySyncControls) {
  const { t } = useLocalization();
  const { status, kind } = snapshot;
  const title =
    status === 'disabled'
      ? t('sync.off')
      : status === 'paused'
        ? t('sync.paused')
        : status === 'synced'
          ? t('sync.synced')
          : status === 'syncing'
            ? t('sync.syncing')
            : status === 'error'
              ? t('sync.error')
              : status === 'unavailable'
                ? t('sync.unavailable')
                : t('sync.pending');
  const detail =
    status === 'disabled'
      ? t('sync.offHint')
      : status === 'paused'
        ? t('sync.pausedHint')
        : status === 'synced'
          ? t('sync.syncedHint')
          : kind === 'conflict'
            ? t('sync.conflictHint')
            : kind === 'unsupported'
              ? t('equipment.syncPending')
              : kind === 'auth'
                ? t('sync.authHint')
                : kind === 'invalid'
                  ? t('sync.invalidHint')
                  : t('sync.localHint');
  return (
    <View style={s.root}>
      <Text style={s.title} accessibilityLiveRegion="polite">
        {title}
      </Text>
      <Text style={s.copy}>{detail}</Text>
      {kind === 'conflict' && review && onReview ? (
        <AppButton title={t('sync.review')} onPress={onReview} />
      ) : null}
      <AppButton
        title={
          status === 'disabled'
            ? t('sync.enable')
            : status === 'paused'
              ? t('sync.resume')
              : t('sync.now')
        }
        disabled={status === 'syncing' || status === 'unavailable'}
        onPress={
          status === 'disabled' || status === 'paused' ? onEnable : onSync
        }
      />
    </View>
  );
}
const s = StyleSheet.create({
  root: { gap: spacing.sm },
  title: { ...typography.headline, color: colors.textPrimary },
  copy: { ...typography.body, color: colors.textSecondary },
});
