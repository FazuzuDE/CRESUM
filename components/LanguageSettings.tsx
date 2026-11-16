import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { useLocalization } from './LocalizationProvider';
import { AppButton } from './AppButton';
import { localeRegistry, type LanguagePreference } from '@/lib/i18n/registry';
import { cardShadow, colors, radius, spacing, typography } from '@/lib/theme';
const flags = { en: '🇬🇧', ru: '🇷🇺', de: '🇩🇪', fr: '🇫🇷' };

export function LanguageSettings({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const { t, locale, preference, saving, error, select, store } =
    useLocalization();
  const [attempted, setAttempted] = useState<LanguagePreference>();
  const [reduceTransparency, setReduceTransparency] = useState(true);
  const audioReady = useRef(false);
  const scrollStep = useRef(0);
  const player = useAudioPlayer(require('../assets/audio/language-tick.wav'));

  useEffect(() => {
    if (!open || Platform.OS !== 'ios') return;
    let active = true;
    void AccessibilityInfo.isReduceTransparencyEnabled()
      .then((reduced) => {
        if (active) setReduceTransparency(reduced);
      })
      .catch(() => {});
    const subscription = AccessibilityInfo.addEventListener(
      'reduceTransparencyChanged',
      setReduceTransparency,
    );
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
      subscription.remove();
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
  const glass =
    open &&
    Platform.OS === 'ios' &&
    !reduceTransparency &&
    isGlassEffectAPIAvailable() &&
    isLiquidGlassAvailable();
  const options: LanguagePreference[] = [
    'system',
    ...(store?.enabledLocales ?? []),
  ];
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
        <Modal
          transparent
          visible
          onRequestClose={dismiss}
          statusBarTranslucent
        >
          <View style={s.overlay}>
            <Pressable
              accessible={false}
              style={StyleSheet.absoluteFill}
              onPress={dismiss}
            />
            <View style={s.panel} accessibilityViewIsModal>
              {glass ? (
                <GlassView
                  pointerEvents="none"
                  glassEffectStyle="regular"
                  style={s.material}
                />
              ) : Platform.OS === 'ios' && !reduceTransparency ? (
                <BlurView
                  pointerEvents="none"
                  intensity={85}
                  tint="light"
                  style={s.material}
                />
              ) : (
                <View pointerEvents="none" style={[s.material, s.solid]} />
              )}
              <Text accessibilityRole="header" style={s.title}>
                {t('language.title')}
              </Text>
              <ScrollView
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
                    onPress={() => void choose(value)}
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
                      onPress={() => attempted && void choose(attempted)}
                    />
                  </>
                ) : null}
              </ScrollView>
              <AppButton
                title={t('common.cancel')}
                presentation="text"
                secondary
                disabled={saving}
                onPress={dismiss}
              />
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}
const s = StyleSheet.create({
  root: { gap: spacing.sm },
  compact: { alignItems: 'flex-end' },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.scrim,
  },
  panel: {
    ...cardShadow,
    width: '100%',
    maxWidth: 380,
    maxHeight: '88%',
    borderRadius: radius.xxl,
    padding: spacing.md,
    gap: spacing.sm,
  },
  material: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.xxl,
    overflow: 'hidden',
  },
  solid: { backgroundColor: colors.surface },
  title: { ...typography.title2, color: colors.textPrimary },
  options: { gap: spacing.xs },
  copy: { ...typography.footnote, color: colors.textSecondary },
  error: { ...typography.footnote, color: colors.danger },
});
