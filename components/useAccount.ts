import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { AuthStore } from '@/lib/auth-store';
import { createSupabaseAuthRepository } from '@/lib/supabase-auth';
import type { AccountSectionProps } from './AccountSection';

export function useAccount(): AccountSectionProps {
  const [store] = useState(
    () =>
      new AuthStore(() =>
        createSupabaseAuthRepository({
          url: process.env.EXPO_PUBLIC_SUPABASE_URL,
          publishableKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        }),
      ),
  );
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot);
  const lifecycle = useRef({ generation: 0 });
  useEffect(() => {
    const owner = lifecycle.current;
    const generation = ++owner.generation;
    void store.initialize();
    return () => {
      // StrictMode replays effects synchronously; only a real unmount disposes.
      queueMicrotask(() => {
        if (owner.generation === generation) store.dispose();
      });
    };
  }, [store]);
  return {
    snapshot,
    sendEmailOtp: (email) => store.sendEmailOtp(email),
    verifyEmailOtp: (email, code) => store.verifyEmailOtp(email, code),
    signOut: () => store.signOut(),
  };
}
