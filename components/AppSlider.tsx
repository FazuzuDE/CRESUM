import { useState } from 'react';
import Slider, { type SliderProps } from '@react-native-community/slider';
import { Platform, StyleSheet, View } from 'react-native';
import { cardShadow, colors, radius } from '@/lib/theme';
import { GlassMaterial } from './GlassMaterial';
import { useLayoutDirection } from './LayoutDirection';
import { useReducedTransparency } from './useReducedTransparency';

const thumbWidth = 38;

export function AppSlider({
  value = 0,
  displayValue = value,
  minimumValue = 0,
  maximumValue = 1,
  disabled,
  style,
  ...props
}: SliderProps & { displayValue?: number }) {
  const [trackWidth, setTrackWidth] = useState(0);
  const rtl = useLayoutDirection() === 'rtl';
  const reduced = useReducedTransparency();
  const span = maximumValue - minimumValue;
  const fraction =
    span > 0
      ? Math.max(0, Math.min(1, (displayValue - minimumValue) / span))
      : 0;
  const progress = fraction * trackWidth;
  const position = (rtl ? 1 - fraction : fraction) * trackWidth;
  return (
    <View style={[s.root, style, disabled && s.disabled]}>
      <View
        pointerEvents="none"
        style={s.visual}
        onLayout={({ nativeEvent }) => setTrackWidth(nativeEvent.layout.width)}
      >
        <View style={s.track}>
          <View
            style={[
              s.fill,
              { width: progress },
              rtl ? s.fillRight : s.fillLeft,
            ]}
          />
        </View>
        <View style={[s.thumb, { left: position }]}>
          <GlassMaterial
            borderRadius={radius.pill}
            solid={Platform.OS === 'ios' && reduced}
            transparency={82}
          />
        </View>
      </View>
      <Slider
        {...props}
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        disabled={disabled}
        value={value}
        inverted={rtl}
        style={s.native}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { minHeight: 44, justifyContent: 'center' },
  visual: {
    direction: 'ltr',
    marginHorizontal: thumbWidth / 2,
    justifyContent: 'center',
  },
  track: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.separator,
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
  },
  fillLeft: { left: 0 },
  fillRight: { right: 0 },
  thumb: {
    ...cardShadow,
    position: 'absolute',
    marginLeft: -thumbWidth / 2,
    width: thumbWidth,
    height: 26,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  native: { ...StyleSheet.absoluteFill, direction: 'ltr', opacity: 0.02 },
  disabled: { opacity: 0.6 },
});
