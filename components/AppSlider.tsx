import { useAppColors } from '@/components/AppThemeProvider';
import Slider, { type SliderProps } from '@react-native-community/slider';
import { StyleSheet } from 'react-native';
import {
  GestureDetector,
  useNativeGesture,
} from 'react-native-gesture-handler';
import { useBackSwipeGesture } from './BackSwipe';

import { useLayoutDirection } from './LayoutDirection';

export function AppSlider({ style, ...props }: SliderProps) {
  const colors = useAppColors();
  const rtl = useLayoutDirection() === 'rtl';
  const back = useBackSwipeGesture();
  const gesture = useNativeGesture({
    enabled: !!back,
    block: back,
    shouldActivateOnStart: true,
    disallowInterruption: true,
  });
  const slider = (
    <Slider
      minimumTrackTintColor={colors.primary}
      inverted={rtl}
      {...props}
      style={[s.slider, style]}
    />
  );
  return back ? (
    <GestureDetector gesture={gesture}>{slider}</GestureDetector>
  ) : (
    slider
  );
}

const s = StyleSheet.create({
  slider: { minHeight: 44, direction: 'ltr' },
});
