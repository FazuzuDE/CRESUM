import { useEffect, useRef } from 'react';
import {
  AccessibilityInfo,
  findNodeHandle,
  Platform,
  View,
} from 'react-native';

/** Restore the initiating row after the native modal has finished dismissing. */
export function useEquipmentFocus(open: boolean) {
  const ref = useRef<View>(null);
  const previous = useRef(false);
  useEffect(() => {
    const dismissed = previous.current && !open;
    previous.current = open;
    if (!dismissed) return;
    const timer = setTimeout(() => {
      ref.current?.focus();
      if (Platform.OS !== 'web' && ref.current) {
        const node = findNodeHandle(ref.current);
        if (node !== null) AccessibilityInfo.setAccessibilityFocus(node);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [open]);
  return ref;
}
