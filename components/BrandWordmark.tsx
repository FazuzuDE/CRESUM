import Svg, { Path } from 'react-native-svg';
import { brand, colors } from '@/lib/theme';

// Geometric lettering based on the selected presentation mockup.
// Paths keep the brand independent of the platform's installed fonts.
export function BrandWordmark() {
  return (
    <Svg
      width={brand.wordmarkWidth}
      height={brand.wordmarkHeight}
      viewBox="0 0 182 24"
      accessible
      accessibilityRole="image"
      accessibilityLabel="CRESUM"
    >
      <Path
        d="M22 5H9Q5 5 5 9V15Q5 19 9 19H22 M35 19V5H49Q54 5 54 8.5Q54 12 49 12H35 M46 12L55 19 M84 5H65V19H84 M65 12H81 M114 5H99Q95 5 95 8.5Q95 12 99 12H110Q114 12 114 15.5Q114 19 110 19H95 M125 5V15Q125 19 129 19H140Q144 19 144 15V5 M155 19V5L166 14L177 5V19"
        fill="none"
        stroke={colors.textPrimary}
        strokeWidth={3.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
