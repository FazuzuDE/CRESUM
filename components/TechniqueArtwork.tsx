import { ExerciseArtworkWordmark } from './ExerciseArtworkWordmark';
import {
  createThemedStyles,
  useAppColors,
} from '@/components/AppThemeProvider';
import {
  LocalizedText as Text,
  DirectionalIcon as Ionicons,
} from '@/components/LayoutDirection';

import { useState } from 'react';
import { Image, View } from 'react-native';
import { resolveExerciseDisplayFrame } from '@/lib/exercise-artwork-display';
import { resolveExerciseArtwork } from '@/lib/exercise-artwork';
import { catalogLabel } from '@/lib/i18n/catalog';
import type { TechniquePhase } from '@/lib/exercise-technique';
import { palettes, radius, spacing, typography } from '@/lib/theme';
import { useLocalization } from './LocalizationProvider';
import { useExerciseCharacter } from './ExerciseCharacterProvider';

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
  const colors = useAppColors();
  const s = useStyles();
  const { t } = useLocalization();
  const { model } = useExerciseCharacter();
  const phaseLabel =
    phase === 'START' ? t('technique.start') : t('technique.finish');
  if (
    resolveExerciseArtwork(
      imageKey,
      phase === 'START' ? 'start' : 'finish',
      model,
    )
  )
    return (
      <TechniqueImagePair
        key={JSON.stringify([imageKey, model])}
        imageKey={imageKey}
        phase={phase}
        model={model}
      />
    );
  return (
    <View
      accessibilityLabel={
        model === 'female'
          ? t('character.femalePending')
          : t('technique.placeholder', {
              phase: phaseLabel,
              imageKey,
            })
      }
      style={[s.frame, expanded && s.expanded]}
    >
      <Ionicons name="image-outline" size={56} color={colors.primary} />
      <Text style={s.label}>
        {model === 'female'
          ? t('character.femalePending')
          : expanded
            ? t('technique.imageUnavailable')
            : t('technique.imageSoon')}
      </Text>
      <Text style={s.phase}>{phaseLabel}</Text>
    </View>
  );
}
function TechniqueImagePair({
  imageKey,
  phase,
  model,
}: {
  imageKey: string;
  phase: TechniquePhase;
  model: ReturnType<typeof useExerciseCharacter>['model'];
}) {
  const s = useStyles();
  const { t, locale } = useLocalization();
  const [initialPhase] = useState(phase);
  const [ready, setReady] = useState<Partial<Record<TechniquePhase, boolean>>>(
    {},
  );
  const other: TechniquePhase = phase === 'START' ? 'FINISH' : 'START';
  const shown = ready[phase] ? phase : ready[other] ? other : initialPhase;
  const frame = resolveExerciseDisplayFrame(imageKey, model);
  const name = catalogLabel(locale, 'exercise', imageKey, imageKey);
  return (
    <View style={[s.frame, s.image]}>
      {(['START', 'FINISH'] as const).map((item) => {
        // Load the sibling only after the first frame, or immediately if requested.
        if (item !== initialPhase && item !== phase && !ready[initialPhase])
          return null;
        const source = resolveExerciseArtwork(
          imageKey,
          item === 'START' ? 'start' : 'finish',
          model,
        );
        const visible = shown === item;
        return source ? (
          <Image
            key={item}
            source={source}
            resizeMode="contain"
            fadeDuration={0}
            onLoad={() =>
              setReady((previous) =>
                previous[item] ? previous : { ...previous, [item]: true },
              )
            }
            accessibilityLabel={
              visible
                ? t('technique.image', {
                    phase: t(
                      item === 'START' ? 'technique.start' : 'technique.finish',
                    ),
                    name,
                  })
                : undefined
            }
            accessibilityElementsHidden={!visible}
            importantForAccessibility={visible ? 'auto' : 'no-hide-descendants'}
            style={[s.picture, frame, !visible && s.hiddenPicture]}
          />
        ) : null;
      })}
      <ExerciseArtworkWordmark imageKey={imageKey} />
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  picture: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  hiddenPicture: { opacity: 0 },
  image: {
    direction: 'ltr',
    backgroundColor: palettes.light.surface,
    padding: 0,
    overflow: 'hidden',
  },
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
}));
