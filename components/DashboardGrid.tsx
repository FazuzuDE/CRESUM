import { ReactNode } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { spacing } from '@/lib/theme';

export type DashboardWidgetSize = 'small' | 'medium';

export type DashboardGridItem = {
  id: string;
  size: DashboardWidgetSize;
  content: ReactNode;
};

export function DashboardGrid({
  items,
  onLayout,
  onRowLayout,
  activeItemId,
}: {
  items: DashboardGridItem[];
  onLayout?: ViewProps['onLayout'];
  onRowLayout?: (id: string, y: number) => void;
  activeItemId?: string;
}) {
  const rows: DashboardGridItem[][] = [];
  for (const item of items) {
    const last = rows[rows.length - 1];
    if (
      item.size === 'small' &&
      last?.length === 1 &&
      last[0].size === 'small'
    ) {
      last.push(item);
    } else {
      rows.push([item]);
    }
  }

  return (
    <View style={styles.grid} onLayout={onLayout}>
      {rows.map((row) => (
        <View
          key={row[0].id}
          testID="dashboard-grid-row"
          style={[
            styles.row,
            { zIndex: row.some((item) => item.id === activeItemId) ? 1 : 0 },
          ]}
          onLayout={(event) =>
            onRowLayout?.(row[0].id, event.nativeEvent.layout.y)
          }
        >
          {row.map((item) => (
            <View key={item.id} testID="dashboard-widget" style={styles.cell}>
              {item.content}
            </View>
          ))}
          {row[0].size === 'small' && row.length === 1 ? (
            <View style={styles.cell} accessibilityElementsHidden />
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: spacing.lg },
  row: { flexDirection: 'row', gap: spacing.lg, alignItems: 'stretch' },
  cell: { flex: 1, minWidth: 0 },
});
