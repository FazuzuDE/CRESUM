import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalization } from './LocalizationProvider';
import { AppButton } from './AppButton';
import {
  localeRegistry,
  type AppLocale,
  type LanguagePreference,
} from '@/lib/i18n/registry';
import { colors, spacing, typography } from '@/lib/theme';
export function LanguageSettings() {
  const [open, setOpen] = useState(false);
  const { t, preference, saving, error, select } = useLocalization();
  const [attempted, setAttempted] = useState<LanguagePreference>();
  const choose = (value: LanguagePreference) => {
    setAttempted(value);
    void select?.(value);
  };
  const options: LanguagePreference[] = [
    'system',
    ...(Object.keys(localeRegistry) as AppLocale[]).filter(
      (locale) => localeRegistry[locale].released,
    ),
  ];
  return (
    <View style={s.root}>
      <AppButton
        title={t('language.title')}
        secondary
        presentation="row"
        onPress={() => setOpen((value) => !value)}
      />
      {open ? (
        <>
          <Text style={s.copy}>{t('language.description')}</Text>
          {options.map((value) => (
            <AppButton
              key={value}
              selected={preference === value}
              title={
                (value === 'system'
                  ? t('language.system')
                  : localeRegistry[value].nativeName) +
                (preference === value ? ' ✓' : '')
              }
              secondary
              disabled={saving || !select}
              onPress={() => choose(value)}
            />
          ))}
          {error === 'save' ? (
            <>
              <Text accessibilityRole="alert" style={s.error}>
                {t('language.saveError')}
              </Text>
              <AppButton
                title={t('common.retry')}
                disabled={saving || !attempted}
                onPress={() => attempted && choose(attempted)}
              />
            </>
          ) : null}
        </>
      ) : null}
    </View>
  );
}
const s = StyleSheet.create({
  root: { gap: spacing.sm },
  copy: { ...typography.footnote, color: colors.textSecondary },
  error: { ...typography.footnote, color: colors.danger },
});
