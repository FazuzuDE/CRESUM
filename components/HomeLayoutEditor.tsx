import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppScrollView } from './AppScrollView';
import { AppButton } from './AppButton';
import { GlassCard } from './GlassCard';
import { defaultHomeLayout, type HomeLayout } from '@/lib/home-layout';
import { colors, radius, spacing, typography } from '@/lib/theme';
import { useLocalization } from './LocalizationProvider';

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
  const { t } = useLocalization();
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
            title={t('home.cancel')}
            secondary
            disabled={saving}
            onPress={close}
          />
          <Text accessibilityRole="header" style={s.title}>
            {t('home.customize')}
          </Text>
          <Text style={s.copy}>{t('home.editorIntro')}</Text>
          {draft.widgets.map((widget, index) => {
            const label = t(`home.widget.${widget.id}`);
            return (
              <GlassCard key={widget.id} style={s.card}>
                <Text style={s.label}>{label}</Text>
                <View style={s.controls}>
                  {([-1, 1] as const).map((delta) => {
                    const disabled =
                      saving ||
                      index + delta < 0 ||
                      index + delta >= draft.widgets.length;
                    return (
                      <Pressable
                        key={delta}
                        accessibilityRole="button"
                        accessibilityLabel={t(
                          delta === -1 ? 'home.moveUp' : 'home.moveDown',
                          { label },
                        )}
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
                    <Text style={s.copy}>{t('home.always')}</Text>
                  ) : (
                    <>
                      <Text style={s.copy}>
                        {widget.visible ? t('home.shown') : t('home.hidden')}
                      </Text>
                      <Switch
                        accessibilityLabel={t('home.show', { label })}
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
          <Text style={s.copy}>{t('home.storage')}</Text>
          {error ? (
            <Text accessibilityRole="alert" style={s.error}>
              {t('home.editorError')}
            </Text>
          ) : null}
          <AppButton
            title={saving ? t('home.saving') : t('home.saveLayout')}
            disabled={saving}
            onPress={() => onSave(draft)}
          />
          <AppButton
            title={t('home.restoreOrder')}
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
