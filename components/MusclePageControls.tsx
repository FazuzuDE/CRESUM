import { DirectionalIcon, LocalizedText as Text } from './LayoutDirection';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/lib/theme';

export function MuscleSegments<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Record<T, string>;
  value: NoInfer<T>;
  onChange: (value: T) => void;
}) {
  return (
    <View style={s.segments}>
      {(Object.entries(options) as [T, string][]).map(([id, label]) => (
        <Pressable
          key={id}
          accessibilityRole="button"
          accessibilityState={{ selected: id === value }}
          onPress={() => onChange(id)}
          style={({ pressed }) => [
            s.segment,
            id === value && s.selected,
            pressed && s.pressed,
          ]}
        >
          <Text style={[s.segmentText, id === value && s.accent]}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const chevrons = {
  expanded: 'chevron-down',
  collapsed: 'chevron-forward',
} as const;
export const disclosureChevron = (expanded: boolean) =>
  expanded ? chevrons.expanded : chevrons.collapsed;

export function MuscleDisclosure({
  label,
  expanded,
  onPress,
}: {
  label: string;
  expanded: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      onPress={onPress}
      style={({ pressed }) => [s.disclosure, pressed && s.pressed]}
    >
      <Text style={s.link}>{label}</Text>
      <DirectionalIcon
        name={disclosureChevron(expanded)}
        size={16}
        color={colors.primary}
        accessible={false}
      />
    </Pressable>
  );
}

const s = StyleSheet.create({
  segments: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    padding: spacing.xxs,
    gap: spacing.xxs,
  },
  segment: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    padding: spacing.xxs,
    borderRadius: radius.sm,
  },
  selected: { backgroundColor: colors.surface },
  segmentText: {
    ...typography.footnote,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  accent: { color: colors.primary, fontWeight: '600' },
  pressed: { opacity: 0.65 },
  disclosure: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  link: { ...typography.subheadline, color: colors.primary, flexShrink: 1 },
});
