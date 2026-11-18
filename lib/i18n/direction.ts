import type { TextStyle } from 'react-native';
export type LayoutDirection = 'ltr' | 'rtl';

// Keep text's Yoga box LTR so iOS does not swap explicit left/right alignment
// a second time. Writing direction still follows the selected application locale.
export function textDirectionStyle(
  direction: LayoutDirection,
  align?: TextStyle['textAlign'],
): TextStyle {
  const textAlign =
    align === 'center' || align === 'justify'
      ? align
      : direction === 'rtl'
        ? align === 'right'
          ? 'left'
          : 'right'
        : align === 'right'
          ? 'right'
          : 'left';
  return {
    direction: 'ltr',
    writingDirection: direction,
    textAlign,
    ...(direction === 'rtl' ? { letterSpacing: 0 } : {}),
  };
}
export function logicalIcon<T extends string>(
  name: T,
  direction: LayoutDirection,
): T {
  if (direction !== 'rtl') return name;
  const pairs: Record<string, string> = {
    'chevron-forward': 'chevron-back',
    'chevron-back': 'chevron-forward',
    'chevron-forward-outline': 'chevron-back-outline',
    'chevron-back-outline': 'chevron-forward-outline',
    'arrow-forward': 'arrow-back',
    'arrow-back': 'arrow-forward',
    'arrow-forward-outline': 'arrow-back-outline',
    'arrow-back-outline': 'arrow-forward-outline',
    'chevron-left': 'chevron-right',
    'chevron-right': 'chevron-left',
  };
  return (pairs[name] ?? name) as T;
}
