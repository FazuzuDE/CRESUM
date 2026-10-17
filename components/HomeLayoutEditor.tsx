import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppScrollView } from './AppScrollView';
import { AppButton } from './AppButton';
import { GlassCard } from './GlassCard';
import {
  defaultHomeLayout,
  HOME_WIDGET_LABELS,
  type HomeLayout,
} from '@/lib/home-layout';
import { colors, radius, spacing, typography } from '@/lib/theme';

export function HomeLayoutEditor({
  initial,
  saving,
  error,
  onSave,
  onClose,
}: {
  initial: HomeLayout;
  saving: boolean;
  error: boolean;
  onSave: (layout: HomeLayout) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  function move(index: number, delta: number) {
    const widgets = [...draft.widgets];
    [widgets[index], widgets[index + delta]] = [
      widgets[index + delta],
      widgets[index],
    ];
    setDraft({ version: 1, widgets });
  }
  const close = () => {
    if (!saving) onClose();
  };
  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={close}
    >
      <SafeAreaView style={s.screen}>
        <AppScrollView contentContainerStyle={s.content}>
          <AppButton
            title="Cancel"
            secondary
            disabled={saving}
            onPress={close}
          />
          <Text accessibilityRole="header" style={s.title}>
            Customize Home
          </Text>
          <Text style={s.copy}>
            Choose which blocks appear and their order. The workout action stays
            visible.
          </Text>
          {draft.widgets.map((widget, index) => {
            const label = HOME_WIDGET_LABELS[widget.id];
            return (
              <GlassCard key={widget.id} style={s.card}>
                <Text style={s.label}>{label}</Text>
                <View style={s.controls}>
                  {([-1, 1] as const).map((delta) => {
                    const direction = delta === -1 ? 'up' : 'down';
                    const disabled =
                      saving ||
                      index + delta < 0 ||
                      index + delta >= draft.widgets.length;
                    return (
                      <Pressable
                        key={delta}
                        accessibilityRole="button"
                        accessibilityLabel={`Move ${label} ${direction}`}
                        accessibilityState={{ disabled }}
                        disabled={disabled}
                        onPress={() => move(index, delta)}
                        style={({ pressed }) => [
                          s.move,
                          (disabled || pressed) && s.dim,
                        ]}
                      >
                        <Ionicons
                          name={delta === -1 ? 'arrow-up' : 'arrow-down'}
                          size={22}
                          color={colors.primary}
                        />
                      </Pressable>
                    );
                  })}
                  {widget.id === 'primary' ? (
                    <Text style={s.copy}>Always shown</Text>
                  ) : (
                    <>
                      <Text style={s.copy}>
                        {widget.visible ? 'Shown' : 'Hidden'}
                      </Text>
                      <Switch
                        accessibilityLabel={`Show ${label}`}
                        disabled={saving}
                        value={widget.visible}
                        onValueChange={(visible) =>
                          setDraft({
                            version: 1,
                            widgets: draft.widgets.map((item) =>
                              item.id === widget.id
                                ? { ...item, visible }
                                : item,
                            ),
                          })
                        }
                        trackColor={{ true: colors.primary }}
                      />
                    </>
                  )}
                </View>
              </GlassCard>
            );
          })}
          <Text style={s.copy}>
            Saved on this device. Some blocks appear only when data is
            available. Your Home layout stays when workout data is reset and is
            not included in backup files or cloud sync.
          </Text>
          {error ? (
            <Text accessibilityRole="alert" style={s.error}>
              Could not save Home layout. Try again or cancel.
            </Text>
          ) : null}
          <AppButton
            title={saving ? 'Saving layout…' : 'Save layout'}
            disabled={saving}
            onPress={() => onSave(draft)}
          />
          <AppButton
            title="Restore default order"
            secondary
            disabled={saving}
            onPress={() => setDraft(defaultHomeLayout())}
          />
        </AppScrollView>
      </SafeAreaView>
    </Modal>
  );
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: spacing.md,
    gap: spacing.md,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  title: { ...typography.title1, color: colors.textPrimary },
  copy: {
    ...typography.subheadline,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  label: { ...typography.headline, color: colors.textPrimary },
  card: { gap: spacing.sm },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  move: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSubtle,
  },
  dim: { opacity: 0.6 },
  error: { ...typography.body, color: colors.danger },
});
