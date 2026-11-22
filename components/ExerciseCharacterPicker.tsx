import { createThemedStyles } from '@/components/AppThemeProvider';
import { LocalizedText as Text } from '@/components/LayoutDirection';
import { Image, StyleSheet, View } from 'react-native';
import type { AssetModel } from '@/lib/exercise-variant-model';
import { radius, spacing, typography } from '@/lib/theme';
import { AppButton } from './AppButton';
import { useLocalization } from './LocalizationProvider';
import { useExerciseCharacter } from './ExerciseCharacterProvider';

const characterArtwork = require('../assets/onboarding/exercise-characters.webp');

export function ExerciseCharacterPicker({
  value,
  disabled = false,
  previews = false,
  showSelectedPreview = false,
  onChange,
}: {
  value?: AssetModel;
  disabled?: boolean;
  previews?: boolean;
  showSelectedPreview?: boolean;
  onChange: (model: AssetModel) => void;
}) {
  const s = useStyles();
  const { t } = useLocalization();
  return (
    <View style={[s.root, previews && s.welcome]}>
      <Text
        accessibilityRole="header"
        style={previews ? s.welcomeTitle : s.title}
      >
        {t('character.title')}
      </Text>
      <Text style={[s.copy, previews && s.welcomeCopy]}>
        {t('character.description')}
      </Text>
      {previews ? (
        <View style={s.previewFrame}>
          <Image
            source={characterArtwork}
            resizeMode="contain"
            accessible={false}
            style={s.preview}
          />
        </View>
      ) : showSelectedPreview && value ? (
        <View
          style={s.portraitFrame}
          testID={`exercise-character-preview-${value}`}
        >
          <Image
            source={characterArtwork}
            accessible={false}
            style={[s.portrait, value === 'male' ? s.maleCrop : s.femaleCrop]}
          />
        </View>
      ) : null}
      <View style={s.options}>
        {(['male', 'female'] as const).map((model) => (
          <View key={model} style={s.option}>
            <AppButton
              title={t(
                model === 'male' ? 'character.male' : 'character.female',
              )}
              selected={value === model}
              secondary={value !== model}
              disabled={disabled}
              onPress={() => onChange(model)}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

export function ExerciseCharacterSettings() {
  const s = useStyles();
  const { t } = useLocalization();
  const { model, pendingModel, saving, error, disabled, select, retry } =
    useExerciseCharacter();
  const choose = (next: AssetModel) => {
    void select?.(next);
  };
  return (
    <View style={s.root}>
      <ExerciseCharacterPicker
        value={pendingModel ?? model}
        showSelectedPreview
        disabled={disabled || saving || !select}
        onChange={choose}
      />
      {saving ? <Text style={s.copy}>{t('character.saving')}</Text> : null}
      {error ? (
        <>
          <Text accessibilityRole="alert" style={s.error}>
            {t('character.saveError')}
          </Text>
          <AppButton
            title={t('character.retry')}
            disabled={disabled || saving || !retry}
            onPress={() => void retry?.()}
          />
        </>
      ) : null}
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  root: { gap: spacing.sm },
  title: { ...typography.title3, color: colors.textPrimary },
  copy: { ...typography.footnote, color: colors.textSecondary },
  error: { ...typography.footnote, color: colors.danger },
  options: { direction: 'ltr', flexDirection: 'row', gap: spacing.xs },
  option: { flex: 1, gap: spacing.xs },
  welcome: { flexGrow: 1 },
  welcomeTitle: {
    ...typography.title1,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  welcomeCopy: { textAlign: 'center' },
  previewFrame: { flexGrow: 1, minHeight: 260 },
  preview: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
  portraitFrame: {
    alignSelf: 'center',
    width: 146,
    height: 194,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  // Both portraits are viewports into the same approved onboarding artwork.
  portrait: { position: 'absolute', width: 430, height: 430 * (1448 / 1086) },
  maleCrop: { left: -67 },
  femaleCrop: { left: -213 },
}));
