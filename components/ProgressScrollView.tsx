import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { AppScrollView } from './AppScrollView';

export function ProgressScrollView({
  sections,
  contentContainerStyle,
}: {
  sections: { id: string; label: string; content: ReactNode }[];
  contentContainerStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <AppScrollView contentContainerStyle={contentContainerStyle}>
      {sections.map((section) => (
        <View key={section.id}>{section.content}</View>
      ))}
    </AppScrollView>
  );
}
