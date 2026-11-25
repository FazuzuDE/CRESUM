import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';

/** Keep the scroll view and its loaded artwork alive while another pane is shown. */
export function RetainedProgressPane({
  active,
  behind = false,
  children,
}: {
  active: boolean;
  behind?: boolean;
  children: ReactNode;
}) {
  return (
    <View
      style={[
        styles.pane,
        !active && styles.inactive,
        !active && !behind && styles.hidden,
      ]}
      pointerEvents={active ? 'auto' : 'none'}
      accessibilityElementsHidden={!active}
      importantForAccessibility={active ? 'auto' : 'no-hide-descendants'}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  pane: { flex: 1 },
  inactive: StyleSheet.absoluteFill,
  hidden: {
    opacity: 0,
    ...Platform.select({
      web: { visibility: 'hidden' } as ViewStyle & { visibility: 'hidden' },
    }),
  },
});
