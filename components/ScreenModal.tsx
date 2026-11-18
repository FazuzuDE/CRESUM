import { LocalizedModal as Modal } from '@/components/LayoutDirection';
import { type ModalProps } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export function ScreenModal({ children, ...props }: ModalProps) {
  return (
    <Modal {...props} statusBarTranslucent navigationBarTranslucent>
      <SafeAreaProvider>{children}</SafeAreaProvider>
    </Modal>
  );
}
