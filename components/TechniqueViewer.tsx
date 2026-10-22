import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppScrollView } from './AppScrollView';
import { TechniqueArtwork } from './TechniqueArtwork';
import { TechniquePhaseControl } from './TechniquePhaseControl';
import type { TechniquePhase } from '@/lib/exercise-technique';
import { colors, spacing, typography } from '@/lib/theme';
import { useLocalization } from './LocalizationProvider';
export function TechniqueViewer({
  name,
  imageKey,
  phase,
  onPhase,
  onClose,
}: {
  name: string;
  imageKey: string;
  phase: TechniquePhase;
  onPhase: (phase: TechniquePhase) => void;
  onClose: () => void;
}) {
  const { t } = useLocalization();
  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={s.root}>
        <View style={s.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('technique.closeViewer')}
            onPress={onClose}
            style={s.close}
          >
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text accessibilityRole="header" style={s.title}>
            {name}
          </Text>
          <Text style={s.context}>{phase === 'START' ? '1 / 2' : '2 / 2'}</Text>
        </View>
        <AppScrollView contentContainerStyle={s.content}>
          <TechniqueArtwork imageKey={imageKey} phase={phase} expanded />
          <TechniquePhaseControl phase={phase} onChange={onPhase} />
          <Text style={s.context}>{t('technique.viewerNote')}</Text>
        </AppScrollView>
      </SafeAreaView>
    </Modal>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  close: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...typography.headline, color: colors.textPrimary, flex: 1 },
  content: { padding: spacing.md, gap: spacing.lg },
  context: {
    ...typography.footnote,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
