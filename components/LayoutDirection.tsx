import { createContext, forwardRef, useContext } from 'react';
import {
  Modal as NativeModal,
  Text as NativeText,
  TextInput as NativeTextInput,
  StyleSheet,
  type ModalProps,
  type TextProps,
  type TextInputProps,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BackSwipeBoundary } from './BackSwipe';
import { Ionicons as NativeIonicons } from '@expo/vector-icons';
import type { ComponentProps, ComponentRef } from 'react';
import {
  textDirectionStyle,
  logicalIcon,
  type LayoutDirection,
} from '@/lib/i18n/direction';
import { normalizeInputDigits } from '@/lib/i18n/format';

export const LayoutDirectionContext = createContext<LayoutDirection>('ltr');
export const useLayoutDirection = () => useContext(LayoutDirectionContext);
export const LocalizedText = forwardRef<
  ComponentRef<typeof NativeText>,
  TextProps
>(function LocalizedText(props, ref) {
  const direction = useLayoutDirection();
  return (
    <NativeText
      {...props}
      ref={ref}
      style={[
        props.style,
        textDirectionStyle(
          direction,
          StyleSheet.flatten(props.style)?.textAlign,
        ),
      ]}
    />
  );
});
export const LocalizedTextInput = forwardRef<
  ComponentRef<typeof NativeTextInput>,
  TextInputProps
>(function LocalizedTextInput(props, ref) {
  const direction = useLayoutDirection();
  const numeric =
    ['numeric', 'decimal-pad', 'number-pad', 'phone-pad'].includes(
      props.keyboardType ?? '',
    ) ||
    props.inputMode === 'numeric' ||
    props.inputMode === 'decimal';
  const latin =
    numeric ||
    ['email-address', 'url'].includes(props.keyboardType ?? '') ||
    props.autoComplete === 'email';
  return (
    <NativeTextInput
      {...props}
      ref={ref}
      onChangeText={
        props.onChangeText
          ? (value) =>
              props.onChangeText!(numeric ? normalizeInputDigits(value) : value)
          : undefined
      }
      style={[
        props.style,
        textDirectionStyle(
          direction,
          StyleSheet.flatten(props.style)?.textAlign,
        ),
        latin && { writingDirection: 'ltr' },
      ]}
    />
  );
});
export function LocalizedModal({ children, ...props }: ModalProps) {
  const direction = useLayoutDirection();
  return (
    <NativeModal {...props}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BackSwipeBoundary isolate style={{ flex: 1, direction }}>
          {children}
        </BackSwipeBoundary>
      </GestureHandlerRootView>
    </NativeModal>
  );
}
export function DirectionalIcon(props: ComponentProps<typeof NativeIonicons>) {
  const direction = useLayoutDirection();
  return (
    <NativeIonicons {...props} name={logicalIcon(props.name, direction)} />
  );
}
