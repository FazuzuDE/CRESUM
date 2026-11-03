import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, View } from 'react-native';
import { resolveExerciseArtwork } from '@/lib/exercise-artwork';
import { colors, radius, typography } from '@/lib/theme';
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
  const { t, locale } = useLocalization();
  const { model } = useExerciseCharacter();
  const name = catalogLabel(locale, 'exercise', imageKey, imageKey);
  const source = resolveExerciseArtwork(imageKey, 'start', model);
  if (source)
    return (
      <Image
        source={source}
        resizeMode="contain"
        accessibilityLabel={name}
        style={[
          s.placeholder,
          { width: size, height: size, backgroundColor: colors.surface },
        ]}
      />
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

const s = StyleSheet.create({
  pending: {
    ...typography.caption,
    color: colors.textSecondary,
    maxWidth: '100%',
  },
  placeholder: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
  },
});
