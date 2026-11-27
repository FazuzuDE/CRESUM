import { ExerciseArtworkWordmark } from './ExerciseArtworkWordmark';
import {
  createThemedStyles,
  useAppColors,
} from '@/components/AppThemeProvider';
import {
  LocalizedText as Text,
  DirectionalIcon as Ionicons,
} from '@/components/LayoutDirection';

import { Image, View } from 'react-native';
import { resolveExerciseArtwork } from '@/lib/exercise-artwork';
import {
  resolveExerciseDisplayFrame,
  resolveNeutralExerciseThumbnail,
} from '@/lib/exercise-artwork-display';
import { palettes, radius, typography } from '@/lib/theme';
import { useLocalization } from './LocalizationProvider';
import { catalogLabel } from '@/lib/i18n/catalog';
import { useExerciseCharacter } from './ExerciseCharacterProvider';

export function ExerciseArtwork({
  imageKey,
  size = 56,
}: {
  imageKey: string;
  size?: number;
}) {
  const colors = useAppColors();
  const s = useStyles();
  const { t, locale } = useLocalization();
  const { model } = useExerciseCharacter();
  const name = catalogLabel(locale, 'exercise', imageKey, imageKey);
  const thumbnail = resolveNeutralExerciseThumbnail(imageKey, model);
  const source = thumbnail ?? resolveExerciseArtwork(imageKey, 'start', model);
  const frame = thumbnail
    ? undefined
    : resolveExerciseDisplayFrame(imageKey, model);
  if (source)
    return (
      <View style={[s.artwork, { width: size, height: size }]}>
        <Image
          source={source}
          resizeMode="contain"
          accessibilityLabel={name}
          style={[{ width: size, height: size }, frame]}
        />
        <ExerciseArtworkWordmark imageKey={imageKey} />
      </View>
    );
  return (
    <View
      accessibilityLabel={
        model === 'female'
          ? `${name}. ${t('character.femalePending')}`
          : name === imageKey
            ? t('artwork.generic')
            : t('artwork.placeholder', { name })
      }
      style={[s.placeholder, { width: size, height: size }]}
    >
      <Ionicons
        name="barbell-outline"
        size={Math.round(size * (model === 'female' ? 0.32 : 0.42))}
        color={colors.primary}
      />
      {model === 'female' ? (
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
          style={s.pending}
        >
          {t('character.pendingShort')}
        </Text>
      ) : null}
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  pending: {
    ...typography.caption,
    color: colors.textSecondary,
    maxWidth: '100%',
  },
  artwork: {
    direction: 'ltr',
    flexShrink: 0,
    overflow: 'hidden',
    borderRadius: radius.md,
    backgroundColor: palettes.light.surface,
  },
  placeholder: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
  },
}));
