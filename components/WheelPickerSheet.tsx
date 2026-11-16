import type { ReactNode } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { GlassDialog } from './GlassDialog';
import { AppButton } from './AppButton';
import { useLocalization } from './LocalizationProvider';
import { colors, spacing, typography } from '@/lib/theme';

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

const s = StyleSheet.create({
  title: { ...typography.title2, color: colors.textPrimary },
  actions: { gap: spacing.sm },
});
