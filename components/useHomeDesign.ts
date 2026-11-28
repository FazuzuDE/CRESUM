import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';

export type HomeDesign = 'original' | 'bca';
export const HOME_DESIGN_KEY = 'cresum.homeDesign.v1';
type Storage = Pick<typeof AsyncStorage, 'getItem' | 'setItem'>;

export function useHomeDesign(storage: Storage = AsyncStorage) {
  const [value, setValue] = useState<HomeDesign>('original');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const writing = useRef(false);

  useEffect(() => {
    let alive = true;
    void storage
      .getItem(HOME_DESIGN_KEY)
      .then((saved) => {
        if (alive) setValue(saved === 'bca' ? 'bca' : 'original');
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [storage]);

  const select = async (next: HomeDesign) => {
    if (loading || writing.current || next === value) return;
    writing.current = true;
    setSaving(true);
    setError(false);
    try {
      await storage.setItem(HOME_DESIGN_KEY, next);
      setValue(next);
    } catch {
      setError(true);
    } finally {
      writing.current = false;
      setSaving(false);
    }
  };

  return { value, loading, saving, error, select };
}
