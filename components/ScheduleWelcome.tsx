import { AppButton } from './AppButton';
import { createThemedStyles, useAppColors } from './AppThemeProvider';
import { ContentScrollView } from './ContentScrollView';
import { GlassDialog } from './GlassDialog';
import {
  DirectionalIcon as Icon,
  LocalizedText as Text,
} from './LayoutDirection';
import { useLocalization } from './LocalizationProvider';
import { spacing, typography } from '@/lib/theme';

export function ScheduleWelcome({
  saved,
  onClose,
}: {
  saved: boolean;
  onClose: () => void;
}) {
  const s = useStyles();
  const colors = useAppColors();
  const { t } = useLocalization();
  return (
    <GlassDialog opaque onClose={onClose}>
      <ContentScrollView style={s.scroll} contentContainerStyle={s.content}>
        <Icon
          name="checkmark-circle"
          size={44}
          color={colors.success}
          style={s.icon}
          accessible={false}
        />
        <Text style={s.title} accessibilityRole="header">
          {t('onboarding.scheduleWelcome')}
        </Text>
        <Text style={s.body}>
          {saved
            ? t('onboarding.scheduleSaved')
            : t('onboarding.scheduleReady')}
        </Text>
        <Text style={s.body}>{t('onboarding.personalRecords')}</Text>
        <AppButton title={t('onboarding.welcomeOk')} onPress={onClose} />
      </ContentScrollView>
    </GlassDialog>
  );
}

const useStyles = createThemedStyles((colors) => ({
  scroll: { flexGrow: 0, flexShrink: 1 },
  content: { gap: spacing.sm },
  icon: { alignSelf: 'center' },
  title: {
    ...typography.title2,
    textAlign: 'center',
    color: colors.textPrimary,
  },
  body: {
    ...typography.body,
    textAlign: 'center',
    color: colors.textSecondary,
  },
}));
