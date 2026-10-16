import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { AuthStore } from '@/lib/auth-store';
import { createSupabaseAuthRepository } from '@/lib/supabase-auth';
import type { AccountSectionProps } from './AccountSection';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AccountDeletionRepository } from '@/lib/account-deletion';

export function useAccount(): AccountSectionProps {
  const [deletion] = useState(
    () => new AccountDeletionRepository(AsyncStorage),
  );
  const [store] = useState(
    () =>
      new AuthStore(
        () =>
          createSupabaseAuthRepository({
            url: process.env.EXPO_PUBLIC_SUPABASE_URL,
            publishableKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
            accountDeletionEnabled:
              process.env.EXPO_PUBLIC_ACCOUNT_DELETION_ENABLED === 'true',
            deletionState: deletion,
          }),
        deletion,
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
    historyRpc: store.hasHistoryRpc() ? store.historyRpc : undefined,
    isCurrentAccount: store.isCurrentAccount,
    sendEmailOtp: (email) => store.sendEmailOtp(email),
    verifyEmailOtp: (email, code) => store.verifyEmailOtp(email, code),
    signOut: () => store.signOut(),
    deleteAccount: store.hasAccountDeletion() ? store.deleteAccount : undefined,
    retryAccount: () => store.initialize(),
  };
}
