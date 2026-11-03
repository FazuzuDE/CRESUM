import { Image, StyleSheet, Text, View } from 'react-native';
import type { AssetModel } from '@/lib/exercise-variant-model';
import { resolveExerciseArtwork } from '@/lib/exercise-artwork';
import { colors, spacing, typography } from '@/lib/theme';
import { AppButton } from './AppButton';
import { useLocalization } from './LocalizationProvider';
import { useExerciseCharacter } from './ExerciseCharacterProvider';

export function ExerciseCharacterPicker({
  value,
  disabled = false,
  previews = false,
  onChange,
}: {
  value?: AssetModel;
  disabled?: boolean;
  previews?: boolean;
  onChange: (model: AssetModel) => void;
}) {
  const { t } = useLocalization();
  return (
    <View style={s.root}>
      <Text accessibilityRole="header" style={s.title}>
        {t('character.title')}
      </Text>
      <Text style={s.copy}>{t('character.description')}</Text>
      <View style={s.options}>
        {(['male', 'female'] as const).map((model) => {
          const source = previews
            ? resolveExerciseArtwork('goblet-squat', 'start', model)
            : null;
          return (
            <View key={model} style={s.option}>
              {source ? (
                <Image
                  source={source}
                  resizeMode="contain"
                  accessible={false}
                  style={s.preview}
                />
              ) : null}
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
          );
        })}
      </View>
    </View>
  );
}

export function ExerciseCharacterSettings() {
  const { t } = useLocalization();
  const { model, saving, error, disabled, select, retry } =
    useExerciseCharacter();
  const choose = (next: AssetModel) => {
    void select?.(next);
  };
  return (
    <View style={s.root}>
      <ExerciseCharacterPicker
        value={model}
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

const s = StyleSheet.create({
  root: { gap: spacing.sm },
  title: { ...typography.title3, color: colors.textPrimary },
  copy: { ...typography.footnote, color: colors.textSecondary },
  error: { ...typography.footnote, color: colors.danger },
  options: { flexDirection: 'row', gap: spacing.xs },
  option: { flex: 1, gap: spacing.xs },
  preview: { width: '100%', aspectRatio: 0.75 },
});
