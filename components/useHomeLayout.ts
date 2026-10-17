import { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  defaultHomeLayout,
  HomeLayoutRepository,
  type HomeLayout,
} from '@/lib/home-layout';

const repository = new HomeLayoutRepository(AsyncStorage);

export function useHomeLayout() {
  const [layout, setLayout] = useState(defaultHomeLayout);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const mounted = useRef(false);
  const busy = useRef(false);

  async function load() {
    if (busy.current) return;
    busy.current = true;
    try {
      const saved = await repository.load();
      if (mounted.current) {
        setLayout(saved);
        setLoadError(false);
      }
    } catch {
      if (mounted.current) setLoadError(true);
    } finally {
      busy.current = false;
      if (mounted.current) setLoading(false);
    }
  }
  useEffect(() => {
    let current = true;
    mounted.current = true;
    busy.current = true;
    void repository
      .load()
      .then(
        (saved) => {
          if (current) {
            setLayout(saved);
            setLoadError(false);
          }
        },
        () => {
          if (current) setLoadError(true);
        },
      )
      .finally(() => {
        if (current) {
          busy.current = false;
          setLoading(false);
        }
      });
    return () => {
      current = false;
      mounted.current = false;
    };
  }, []);

  async function save(next: HomeLayout) {
    if (busy.current) return false;
    busy.current = true;
    setSaving(true);
    setSaveError(false);
    try {
      await repository.save(next);
      if (mounted.current) {
        setLayout(next);
        setLoadError(false);
      }
      return true;
    } catch {
      if (mounted.current) setSaveError(true);
      return false;
    } finally {
      busy.current = false;
      if (mounted.current) setSaving(false);
    }
  }
  return {
    layout,
    loading,
    saving,
    loadError,
    saveError,
    load: () => {
      setLoading(true);
      return load();
    },
    save,
    clearSaveError: () => setSaveError(false),
  };
}
