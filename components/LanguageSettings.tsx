import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { ContentScrollView } from './ContentScrollView';
import { GlassDialog } from './GlassDialog';
import * as Haptics from 'expo-haptics';
import { useLocalization } from './LocalizationProvider';
import { AppButton } from './AppButton';
import { localeRegistry, type LanguagePreference } from '@/lib/i18n/registry';
import { colors, spacing, typography } from '@/lib/theme';
const flags = { en: '🇬🇧', ru: '🇷🇺', de: '🇩🇪', fr: '🇫🇷', uk: '🇺🇦', es: '🇪🇸' };

export function LanguageSettings({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const { t, locale, preference, saving, error, select, store } =
    useLocalization();
  const [attempted, setAttempted] = useState<LanguagePreference>();
  const audioReady = useRef(false);
  const scrollStep = useRef(0);
  const player = useAudioPlayer(require('../assets/audio/language-tick.wav'));

  useEffect(() => {
    if (!open || Platform.OS !== 'ios') return;
    let active = true;
    void setAudioModeAsync({
      playsInSilentMode: false,
      interruptionMode: 'mixWithOthers',
    })
      .then(() => {
        if (active) audioReady.current = true;
      })
      .catch(() => {});
    return () => {
      active = false;
      audioReady.current = false;
    };
  }, [open]);

  const tick = () => {
    if (Platform.OS !== 'ios') return;
    void Haptics.selectionAsync?.().catch(() => {});
    if (audioReady.current && player.isLoaded && !player.playing) {
      void player
        .seekTo(0)
        .then(() => {
          if (audioReady.current) player.play();
        })
        .catch(() => {});
    }
  };
  const choose = async (value: LanguagePreference) => {
    setAttempted(value);
    if (value !== preference) tick();
    if (await select?.(value)) setOpen(false);
  };
  const dismiss = () => {
    if (!saving) setOpen(false);
  };
  const options = [...(store?.enabledLocales ?? [])].sort((a, b) =>
    localeRegistry[a].nativeName.localeCompare(
      localeRegistry[b].nativeName,
      'en',
    ),
  );
  const option = (value: LanguagePreference) => {
    const name =
      value === 'system'
        ? t('language.system')
        : localeRegistry[value].nativeName;
    const marker = value === 'system' ? '🌐' : flags[value];
    const selected = preference === value;
    return (
      <AppButton
        key={value}
        selected={selected}
        accessibilityLabel={name}
        title={`${marker}  ${name}${selected ? ' ✓' : ''}`}
        secondary
        disabled={saving || !select}
        onPress={() => void choose(value)}
      />
    );
  };
  return (
    <View style={[s.root, compact && s.compact]}>
      <AppButton
        title={compact ? flags[locale] : t('language.title')}
        accessibilityLabel={t('language.title')}
        secondary
        presentation={compact ? 'text' : 'row'}
        onPress={() => {
          scrollStep.current = 0;
          setOpen(true);
        }}
      />
      {open ? (
        <GlassDialog onClose={dismiss}>
          <Text accessibilityRole="header" style={s.title}>
            {t('language.title')}
          </Text>
          <Text style={s.copy}>{t('language.description')}</Text>
          {option('system')}
          <ContentScrollView
            style={s.list}
            contentContainerStyle={s.options}
            scrollEventThrottle={16}
            onScroll={({ nativeEvent }) => {
              const { contentOffset, contentSize, layoutMeasurement } =
                nativeEvent;
              const offset = Math.min(
                Math.max(0, contentOffset.y),
                Math.max(0, contentSize.height - layoutMeasurement.height),
              );
              const step = Math.floor(offset / spacing.lg);
              if (step !== scrollStep.current) {
                scrollStep.current = step;
                tick();
              }
            }}
          >
            {options.map(option)}
            {error === 'save' ? (
              <>
                <Text accessibilityRole="alert" style={s.error}>
                  {t('language.saveError')}
                </Text>
                <AppButton
                  title={t('common.retry')}
                  disabled={saving || !attempted}
                  onPress={() => attempted && void choose(attempted)}
                />
              </>
            ) : null}
          </ContentScrollView>
          <AppButton
            title={t('common.cancel')}
            presentation="text"
            secondary
            disabled={saving}
            onPress={dismiss}
          />
        </GlassDialog>
      ) : null}
    </View>
  );
}
const s = StyleSheet.create({
  root: { gap: spacing.sm },
  compact: { alignItems: 'flex-end' },
  list: { flexGrow: 0, flexShrink: 1 },
  title: { ...typography.title2, color: colors.textPrimary },
  options: { gap: spacing.xs },
  copy: { ...typography.footnote, color: colors.textPrimary },
  error: { ...typography.footnote, color: colors.danger },
});
