import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { TechniquePhase } from '@/lib/exercise-technique';
import { colors, radius, spacing, typography } from '@/lib/theme';
import { useLocalization } from './LocalizationProvider';
export function TechniquePhaseControl({
  phase,
  onChange,
}: {
  phase: TechniquePhase;
  onChange: (value: TechniquePhase) => void;
}) {
  const { t } = useLocalization();
  return (
    <View style={s.control}>
      {(['START', 'FINISH'] as const).map((value) => (
        <Pressable
          key={value}
          accessibilityRole="button"
          accessibilityLabel={
            value === 'START'
              ? t('technique.showStart')
              : t('technique.showFinish')
          }
          accessibilityState={{ selected: phase === value }}
          aria-pressed={phase === value}
          onPress={() => onChange(value)}
          style={[s.button, phase === value && s.selected]}
        >
          <Text style={[s.text, phase === value && s.active]}>
            {value === 'START' ? t('technique.start') : t('technique.finish')}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
const s = StyleSheet.create({
  control: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.pill,
    padding: spacing.xxs,
  },
  button: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  selected: { backgroundColor: colors.primaryTint },
  text: { ...typography.footnote, color: colors.textSecondary },
  active: { color: colors.primary, fontWeight: '600' },
});
