import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppDatePicker } from './AppDatePicker';
import { AppButton } from './AppButton';
import { colors, spacing, typography } from '@/lib/theme';

/** Mount on open so Cancel/dismiss discards the entire local date draft. */
export function DatePickerSheet({
  title,
  value,
  maximum,
  minimum,
  onCancel,
  onConfirm,
  onClear,
}: {
  title: string;
  value: number;
  maximum?: number;
  minimum?: number;
  onCancel: () => void;
  onConfirm: (time: number) => void;
  onClear?: () => void;
}) {
  const [draft, setDraft] = useState(value);
  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <SafeAreaView style={s.root}>
        <View style={s.content}>
          <ScrollView style={s.header}>
            <Text accessibilityRole="header" style={s.title}>
              {title}
            </Text>
          </ScrollView>
          <AppDatePicker
            flexible
            value={draft}
            minimum={minimum}
            maximum={maximum}
            onChange={setDraft}
          />
          <ScrollView style={s.footer} contentContainerStyle={s.actions}>
            <AppButton title="Done" onPress={() => onConfirm(draft)} />
            <AppButton title="Cancel" secondary onPress={onCancel} />
            {onClear ? (
              <AppButton
                title="Clear date"
                presentation="text"
                secondary
                onPress={onClear}
              />
            ) : null}
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: spacing.md, gap: spacing.sm },
  header: { flexGrow: 0, flexShrink: 1, minHeight: 44 },
  footer: { flexGrow: 0, flexShrink: 1, minHeight: 44 },
  title: { ...typography.title2, color: colors.textPrimary },
  actions: { gap: spacing.sm },
});
