import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import type { TechniquePhase } from '@/lib/exercise-technique';
import { colors, radius, spacing, typography } from '@/lib/theme';

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
  return (
    <View
      accessibilityLabel={`${phase} artwork placeholder for ${imageKey}`}
      style={[s.frame, expanded && s.expanded]}
    >
      <Ionicons name="image-outline" size={56} color={colors.primary} />
      <Text style={s.label}>
        {expanded ? 'Illustration unavailable' : 'Image coming soon'}
      </Text>
      <Text style={s.phase}>{phase}</Text>
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
