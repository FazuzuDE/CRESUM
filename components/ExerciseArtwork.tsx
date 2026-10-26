import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, View } from 'react-native';
import { resolveExerciseArtwork } from '@/lib/exercise-artwork';
import { colors, radius } from '@/lib/theme';
import { useLocalization } from './LocalizationProvider';
import { catalogLabel } from '@/lib/i18n/catalog';

export function ExerciseArtwork({
  imageKey,
  size = 56,
}: {
  imageKey: string;
  size?: number;
}) {
  const { t, locale } = useLocalization();
  const name = catalogLabel(locale, 'exercise', imageKey, imageKey);
  const source = resolveExerciseArtwork(imageKey, 'start', 'male');
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
        name === imageKey
          ? t('artwork.generic')
          : t('artwork.placeholder', { name })
      }
      style={[s.placeholder, { width: size, height: size }]}
    >
      <Ionicons
        name="barbell-outline"
        size={Math.round(size * 0.42)}
        color={colors.primary}
      />
    </View>
  );
}

const s = StyleSheet.create({
  placeholder: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
  },
});
