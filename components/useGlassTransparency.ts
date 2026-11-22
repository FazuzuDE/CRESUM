import { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useGlassTransparency(key: string, defaultValue: number) {
  const [value, setValue] = useState(defaultValue);
  const edited = useRef(false);
  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(key)
      .then((stored) => {
        if (!active || edited.current || stored === null) return;
        const parsed = Number(stored);
        if (Number.isInteger(parsed) && parsed >= 0 && parsed <= 100)
          setValue(parsed);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [key]);

  const preview = (next: number) => {
    edited.current = true;
    setValue(next);
  };
  const commit = (next: number) => {
    preview(next);
    void AsyncStorage.setItem(key, String(next)).catch(() => {});
  };

  return { value, preview, commit };
}
