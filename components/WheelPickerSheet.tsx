import { createThemedStyles } from '@/components/AppThemeProvider';
import { LocalizedText as Text } from '@/components/LayoutDirection';
import type { ReactNode } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { GlassDialog } from './GlassDialog';
import { AppButton } from './AppButton';
import { useLocalization } from './LocalizationProvider';
import { spacing, typography } from '@/lib/theme';

export function WheelPickerSheet({
  title,
  children,
  onCancel,
  onConfirm,
  onClear,
  disabled,
}: {
  title: string;
  children: ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
  onClear?: () => void;
  disabled?: boolean;
}) {
  const s = useStyles();
  const { t } = useLocalization();
  const { height } = useWindowDimensions();
  return (
    <GlassDialog onClose={onCancel}>
      <Text accessibilityRole="header" style={s.title}>
        {title}
      </Text>
      <View style={{ height: Math.min(220, height * 0.32), flexShrink: 1 }}>
        {children}
      </View>
      <View style={s.actions}>
        <AppButton
          title={t('common.done')}
          disabled={disabled}
          onPress={onConfirm}
        />
        <AppButton title={t('common.cancel')} secondary onPress={onCancel} />
        {onClear ? (
          <AppButton
            title={t('date.clear')}
            presentation="text"
            secondary
            onPress={onClear}
          />
        ) : null}
      </View>
    </GlassDialog>
  );
}

const useStyles = createThemedStyles((colors) => ({
  title: { ...typography.title2, color: colors.textPrimary },
  actions: { gap: spacing.sm },
}));
