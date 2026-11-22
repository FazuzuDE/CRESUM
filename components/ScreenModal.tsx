import {
  LocalizedModal as Modal,
  type LocalizedModalProps,
} from '@/components/LayoutDirection';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export function ScreenModal({ children, ...props }: LocalizedModalProps) {
  return (
    <Modal {...props} statusBarTranslucent navigationBarTranslucent>
      <SafeAreaProvider>{children}</SafeAreaProvider>
    </Modal>
  );
}
