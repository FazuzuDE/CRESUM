import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, View } from 'react-native';
import {
  resolveExerciseArtwork,
  resolveExerciseArtworkPlacement,
} from '@/lib/exercise-artwork';
import { catalogLabel } from '@/lib/i18n/catalog';
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
  const { t, locale } = useLocalization();
  const phaseLabel =
    phase === 'START' ? t('technique.start') : t('technique.finish');
  const source = resolveExerciseArtwork(
    imageKey,
    phase === 'START' ? 'start' : 'finish',
    'male',
  );
  if (source)
    return (
      <View style={[s.frame, s.image]}>
        <Image
          source={source}
          resizeMode="contain"
          accessibilityLabel={t('technique.image', {
            phase: phaseLabel,
            name: catalogLabel(locale, 'exercise', imageKey, imageKey),
          })}
          style={[
            s.picture,
            resolveExerciseArtworkPlacement(
              imageKey,
              phase === 'START' ? 'start' : 'finish',
              'male',
            ),
          ]}
        />
      </View>
    );
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
  picture: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  image: { backgroundColor: colors.surface, padding: 0, overflow: 'hidden' },
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
