import { Pressable, StyleSheet } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { useAppColors } from './AppThemeProvider';
import { DirectionalIcon, LocalizedText } from './LayoutDirection';
import { spacing, typography } from '@/lib/theme';

type Props = {
  label: string;
  accessibilityLabel: string;
  selected: boolean;
  toggle: boolean;
  onPress: () => void;
  unavailable?: boolean;
  showIcon?: boolean;
  accessibilityHint?: string;
};

export function ExerciseLibraryAction({
  label,
  accessibilityLabel,
  selected,
  toggle,
  onPress,
  unavailable = false,
  showIcon = true,
  accessibilityHint,
}: Props) {
  const colors = useAppColors();
  const duration = useReducedMotion() ? 0 : 500;
  const disabled = unavailable || (selected && !toggle);
  const ink = selected
    ? colors.libraryAddedText
    : unavailable
      ? colors.textSecondary
      : colors.libraryActionInk;
  return (
    <Pressable
      accessibilityRole={toggle ? 'checkbox' : 'button'}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={
        toggle ? { checked: selected, disabled } : { disabled }
      }
      disabled={disabled}
      onPress={onPress}
      style={styles.button}
    >
      {({ pressed }) => {
        const closed = selected || pressed;
        const corner = {
          width: closed ? '100%' : '22%',
          height: closed ? '100%' : '70%',
          borderColor: selected ? colors.libraryAddedEdge : ink,
          transitionProperty: ['width', 'height'],
          transitionDuration: duration,
          transitionTimingFunction: 'ease',
        } as const;
        return (
          <>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.frame,
                {
                  transform: [{ scale: closed ? 0.9 : 1 }, { skewX: '-32deg' }],
                  transitionProperty: 'transform',
                  transitionDuration: duration,
                  transitionTimingFunction: 'ease',
                },
              ]}
            >
              <Animated.View style={[styles.leadingCorner, corner]} />
              <Animated.View style={[styles.trailingCorner, corner]} />
            </Animated.View>
            {showIcon ? (
              <DirectionalIcon
                name={selected ? 'checkmark' : 'add'}
                size={18}
                color={ink}
              />
            ) : null}
            <LocalizedText style={[styles.label, { color: ink }]}>
              {label}
            </LocalizedText>
          </>
        );
      }}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  frame: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    top: 5,
    bottom: 5,
  },
  leadingCorner: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  trailingCorner: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  label: {
    ...typography.subheadline,
    flexShrink: 1,
    textAlign: 'center',
    fontWeight: '700',
  },
});
