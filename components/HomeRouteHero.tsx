import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import {
  DirectionalIcon as Ionicons,
  LocalizedText as Text,
} from './LayoutDirection';
import { radius, routeColors, spacing, typography } from '@/lib/theme';
import { useLocalization } from './LocalizationProvider';
import { AppButton } from './AppButton';

export type HomeHeroState = {
  badge: string;
  context?: string;
  title: string;
  meta?: string;
  preview?: string;
  imageKey?: string;
  action: string;
  progress?: number;
};

export function HomeRouteHero({
  state,
  onPreview,
  onAction,
  disabled,
}: {
  state: HomeHeroState;
  onPreview?: () => void;
  onAction: () => void;
  disabled: boolean;
}) {
  const { t } = useLocalization();
  return (
    <View testID="home-bca-hero" style={styles.hero}>
      <View
        pointerEvents="none"
        importantForAccessibility="no-hide-descendants"
        style={styles.art}
      >
        <Svg width={152} height={145} viewBox="0 0 152 145">
          {[12, 25, 38, 51, 64, 77, 90].map((x) => (
            <Path
              key={x}
              d={`M${x} -12c-25 28 16 37 25 61c9 27-25 35-34 65c-4 12 1 24 9 34`}
              stroke={routeColors.contour}
              fill="none"
            />
          ))}
        </Svg>
      </View>
      <Text style={styles.badge}>{state.badge}</Text>
      <Text accessibilityRole="header" style={styles.title}>
        {state.title}
      </Text>
      {state.context ? <Text style={styles.copy}>{state.context}</Text> : null}
      {state.meta ? <Text style={styles.copy}>{state.meta}</Text> : null}
      {state.progress !== undefined ? (
        <View accessible={false} style={styles.track}>
          <View style={[styles.fill, { width: `${state.progress * 100}%` }]} />
        </View>
      ) : null}
      {onPreview ? (
        <Pressable
          accessibilityRole="button"
          onPress={onPreview}
          disabled={disabled}
          style={styles.preview}
        >
          <Text style={styles.link}>{t('plan.title')}</Text>
          <Ionicons
            name="chevron-forward"
            size={15}
            color={routeColors.accent}
          />
        </Pressable>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onAction}
        style={({ pressed }) => [
          styles.button,
          (pressed || disabled) && styles.dim,
        ]}
      >
        <Text style={styles.buttonText}>{state.action}</Text>
        <Ionicons
          name="arrow-forward"
          size={18}
          color={routeColors.actionInk}
        />
      </Pressable>
    </View>
  );
}

export function HomeDesignSelector({
  value,
  disabled,
  error,
  onSelect,
}: {
  value: 'original' | 'bca';
  disabled: boolean;
  error: boolean;
  onSelect: (next: 'original' | 'bca') => void;
}) {
  const { t } = useLocalization();
  return (
    <>
      <AppButton
        title={t('profile.homeDesignOriginal')}
        presentation="choice"
        disabled={disabled}
        selected={value === 'original'}
        onPress={() => onSelect('original')}
      />
      <AppButton
        title="bca"
        presentation="choice"
        disabled={disabled}
        selected={value === 'bca'}
        onPress={() => onSelect('bca')}
      />
      {error ? (
        <Text accessibilityRole="alert">{t('home.saveError')}</Text>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: routeColors.hero,
    borderColor: routeColors.border,
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
    overflow: 'hidden',
  },
  art: { position: 'absolute', end: 0, top: 0 },
  badge: {
    ...typography.caption,
    color: routeColors.accent,
    fontWeight: '700',
  },
  title: { ...typography.title1, color: routeColors.text },
  copy: { ...typography.subheadline, color: routeColors.copy },
  link: {
    ...typography.footnote,
    fontWeight: '700',
    color: routeColors.accent,
    flexShrink: 1,
  },
  preview: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
    minHeight: 44,
  },
  button: {
    padding: spacing.sm,
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: routeColors.accent,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  buttonText: {
    ...typography.headline,
    color: routeColors.actionInk,
    flexShrink: 1,
    textAlign: 'center',
  },
  track: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: routeColors.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: routeColors.accent,
    borderRadius: radius.pill,
  },
  dim: { opacity: 0.72 },
});
