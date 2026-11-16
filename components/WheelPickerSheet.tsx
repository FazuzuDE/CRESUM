import type { ReactNode } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <SafeAreaView style={s.root}>
        <Text accessibilityRole="header" style={s.title}>
          {title}
        </Text>
        <View style={s.wheel}>{children}</View>
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
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: { ...typography.title2, color: colors.textPrimary },
  wheel: { flex: 1, justifyContent: 'center' },
  actions: { gap: spacing.sm },
});
