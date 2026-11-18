import { LocalizedText as Text } from '@/components/LayoutDirection';
import { useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { GlassDialog } from './GlassDialog';
import { AppPicker } from './AppPicker';
import { useLocalization } from './LocalizationProvider';
import { AppButton } from './AppButton';
import { localeRegistry, type LanguagePreference } from '@/lib/i18n/registry';
import { colors, spacing, typography } from '@/lib/theme';
const flags = {
  en: '🇬🇧',
  ru: '🇷🇺',
  de: '🇩🇪',
  fr: '🇫🇷',
  uk: '🇺🇦',
  es: '🇪🇸',
  'pt-BR': '🇧🇷',
  it: '🇮🇹',
  pl: '🇵🇱',
  tr: '🇹🇷',
  hi: '🇮🇳',
  bn: '🇧🇩',
  ar: '🇸🇦',
  ja: '🇯🇵',
  'zh-Hans': '🇨🇳',
};

export function LanguageSettings({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<LanguagePreference>('system');
  const [interacting, setInteracting] = useState(false);
  const { t, locale, preference, saving, error, select, store } =
    useLocalization();
  const systemLocale = store?.getSystemLocale() ?? locale;
  const { height } = useWindowDimensions();
  const options = [...(store?.enabledLocales ?? [])].sort((a, b) =>
    localeRegistry[a].nativeName.localeCompare(
      localeRegistry[b].nativeName,
      'en',
    ),
  );
  const choose = async () => {
    if (saving || interacting || !select) return;
    if (await select(draft)) setOpen(false);
  };
  const dismiss = () => {
    if (!saving) setOpen(false);
  };
  return (
    <View style={[s.root, compact && s.compact]}>
      <AppButton
        title={compact ? flags[locale] : t('language.title')}
        accessibilityLabel={t('language.title')}
        secondary
        presentation={compact ? 'text' : 'row'}
        onPress={() => {
          setDraft(preference);
          setInteracting(false);
          setOpen(true);
        }}
      />
      {open ? (
        <GlassDialog onClose={dismiss} transparency={30}>
          <Text accessibilityRole="header" style={s.title}>
            {t('language.title')}
          </Text>
          <Text style={s.copy}>{t('language.description')}</Text>
          <AppButton
            title={`🌐  ${t('language.system')}${draft === 'system' ? ' ✓' : ''}`}
            selected={draft === 'system'}
            secondary
            disabled={saving || interacting || !select}
            onPress={() =>
              setDraft(draft === 'system' ? systemLocale : 'system')
            }
          />
          <View
            style={{ height: Math.min(220, height * 0.32), flexShrink: 1 }}
            pointerEvents={saving ? 'none' : 'auto'}
            accessibilityElementsHidden={saving}
            importantForAccessibility={saving ? 'no-hide-descendants' : 'auto'}
          >
            <AppPicker
              flexible
              columns={[
                options.map(
                  (value) =>
                    `${flags[value]}  ${localeRegistry[value].nativeName}`,
                ),
              ]}
              labels={[t('language.title')]}
              selected={[
                Math.max(
                  0,
                  options.indexOf(draft === 'system' ? systemLocale : draft),
                ),
              ]}
              onChange={(_, row) => {
                if (!saving && options[row]) setDraft(options[row]);
              }}
              onInteractionChange={setInteracting}
            />
          </View>
          {error === 'save' ? (
            <Text accessibilityRole="alert" style={s.error}>
              {t('language.saveError')}
            </Text>
          ) : null}
          <View style={s.actions}>
            <AppButton
              title={t('common.cancel')}
              presentation="text"
              secondary
              disabled={saving}
              onPress={dismiss}
            />
            <AppButton
              title={t(error === 'save' ? 'common.retry' : 'common.done')}
              presentation="text"
              disabled={saving || interacting || !select || !options.length}
              onPress={() => void choose()}
            />
          </View>
        </GlassDialog>
      ) : null}
    </View>
  );
}
const s = StyleSheet.create({
  root: { gap: spacing.sm },
  compact: { alignItems: 'flex-end' },
  title: { ...typography.title2, color: colors.textPrimary },
  copy: { ...typography.footnote, color: colors.textPrimary },
  error: { ...typography.footnote, color: colors.danger },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
});
