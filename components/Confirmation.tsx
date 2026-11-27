import { createThemedStyles } from '@/components/AppThemeProvider';
import { LocalizedText as Text } from '@/components/LayoutDirection';
import { ContentScrollView } from './ContentScrollView';
import { GlassDialog } from './GlassDialog';
import { spacing, typography } from '@/lib/theme';
import { AppButton } from './AppButton';
import { useLocalization } from './LocalizationProvider';

export function Confirmation({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  busy = false,
  busyLabel,
  error,
  destructive = false,
  opaque = false,
  transparency,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  busy?: boolean;
  busyLabel?: string;
  error?: string;
  destructive?: boolean;
  opaque?: boolean;
  transparency?: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const s = useStyles();
  const { t } = useLocalization();
  return (
    <GlassDialog
      visible={visible}
      opaque={opaque}
      transparency={transparency}
      onClose={() => {
        if (!busy) onCancel();
      }}
    >
      <ContentScrollView style={s.scroll} contentContainerStyle={s.content}>
        <Text style={s.title}>{title}</Text>
        <Text style={s.body}>{message}</Text>
        {error ? (
          <Text accessibilityRole="alert" style={s.body}>
            {error}
          </Text>
        ) : null}
        <AppButton
          title={busy ? (busyLabel ?? t('workout.saving')) : confirmLabel}
          disabled={busy}
          destructive={destructive}
          onPress={onConfirm}
        />
        <AppButton
          title={cancelLabel}
          swipeBack
          disabled={busy}
          secondary
          onPress={onCancel}
        />
      </ContentScrollView>
    </GlassDialog>
  );
}
const useStyles = createThemedStyles((colors) => ({
  scroll: { flexGrow: 0, flexShrink: 1 },
  content: { gap: spacing.sm },
  title: { ...typography.title1, color: colors.textPrimary },
  body: { ...typography.body, color: colors.textPrimary },
}));
