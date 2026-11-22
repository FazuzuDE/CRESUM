import Slider, { type SliderProps } from '@react-native-community/slider';
import { StyleSheet } from 'react-native';
import { colors } from '@/lib/theme';
import { useLayoutDirection } from './LayoutDirection';

export function AppSlider({ style, ...props }: SliderProps) {
  const rtl = useLayoutDirection() === 'rtl';
  return (
    <Slider
      minimumTrackTintColor={colors.primary}
      inverted={rtl}
      {...props}
      style={[s.slider, style]}
    />
  );
}

const s = StyleSheet.create({
  slider: { minHeight: 44, direction: 'ltr' },
});
