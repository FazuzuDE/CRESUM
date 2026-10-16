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
  const { status, kind } = snapshot;
  const title =
    status === 'disabled'
      ? 'Cloud backup is off'
      : status === 'paused'
        ? 'Cloud backup is paused'
        : status === 'synced'
          ? 'Synced'
          : status === 'syncing'
            ? 'Syncing…'
            : status === 'error'
              ? 'Couldn’t sync'
              : status === 'unavailable'
                ? 'Cloud backup unavailable'
                : 'Sync pending';
  const detail =
    status === 'disabled'
      ? 'Enable to add this device’s workouts that aren’t linked to another account, and merge existing cloud history.'
      : status === 'paused'
        ? 'Resume to merge this device’s history with your account. Cloud history has not been deleted.'
        : status === 'synced'
          ? 'Completed workouts linked to this account are backed up. Workouts linked to another account stay separate. Active workouts and settings stay on this device.'
          : kind === 'conflict'
            ? 'A workout differs between this device and your account. Review both versions and choose what to keep, or decide later.'
            : kind === 'auth'
              ? 'Could not confirm your account session. Try again or sign in again.'
              : kind === 'invalid'
                ? 'Some backup data could not be verified. Keep your local copy and try again.'
                : 'Your workouts remain available on this device. Check your connection if sync cannot finish.';
  return (
    <View style={s.root}>
      <Text style={s.title} accessibilityLiveRegion="polite">
        {title}
      </Text>
      <Text style={s.copy}>{detail}</Text>
      {kind === 'conflict' && review && onReview ? (
        <AppButton title="Review conflicting workouts" onPress={onReview} />
      ) : null}
      <AppButton
        title={
          status === 'disabled'
            ? 'Enable cloud backup'
            : status === 'paused'
              ? 'Resume cloud backup'
              : 'Sync Now'
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
