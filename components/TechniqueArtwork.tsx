import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import type { TechniquePhase } from '@/lib/exercise-technique';
import { colors, radius, spacing, typography } from '@/lib/theme';
import { useLocalization } from './LocalizationProvider';

/** Future reviewed asset pairs attach here. Never render an unrelated or unapproved image. */
export function TechniqueArtwork({
  imageKey,
  phase,
  expanded = false,
}: {
  imageKey: string;
  phase: TechniquePhase;
  expanded?: boolean;
}) {
  const { t } = useLocalization();
  const phaseLabel =
    phase === 'START' ? t('technique.start') : t('technique.finish');
  return (
    <View
      accessibilityLabel={t('technique.placeholder', {
        phase: phaseLabel,
        imageKey,
      })}
      style={[s.frame, expanded && s.expanded]}
    >
      <Ionicons name="image-outline" size={56} color={colors.primary} />
      <Text style={s.label}>
        {expanded ? t('technique.imageUnavailable') : t('technique.imageSoon')}
      </Text>
      <Text style={s.phase}>{phaseLabel}</Text>
    </View>
  );
}
const s = StyleSheet.create({
  frame: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  expanded: { backgroundColor: colors.background },
  label: {
    ...typography.subheadline,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  phase: { ...typography.caption, color: colors.primary },
});
