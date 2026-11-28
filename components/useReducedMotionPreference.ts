import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export function useReducedMotionPreference() {
  const [reduceMotion, setReduceMotion] = useState(true);
  useEffect(() => {
    let receivedChange = false;
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (value) => {
        receivedChange = true;
        setReduceMotion(value);
      },
    );
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (!receivedChange) setReduceMotion(value);
      })
      .catch(() => {});
    return () => {
      receivedChange = true;
      subscription.remove();
    };
  }, []);
  return reduceMotion;
}
