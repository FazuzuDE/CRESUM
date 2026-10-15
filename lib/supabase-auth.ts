import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type User } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';
import type { AuthIdentity, AuthRepository } from './auth-repository';

export const AUTH_STORAGE_KEY = 'cresum_auth_v1';

function identity(user: User | null | undefined): AuthIdentity | null {
  return user ? { id: user.id, email: user.email ?? null } : null;
}

export function createSupabaseAuthRepository(
  config: {
    url?: string;
    publishableKey?: string;
  } = {},
): AuthRepository | null {
  const url = config.url?.trim();
  const publishableKey = config.publishableKey?.trim();
  if (!url || !publishableKey) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || !parsed.hostname) return null;
  } catch {
    return null;
  }

  const supabase = createClient(url, publishableKey, {
    auth: {
      storage: AsyncStorage,
      storageKey: AUTH_STORAGE_KEY,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
  // Attach only after the store mounts and subscribes. React may abandon a
  // render-created repository in development before effects can dispose it.
  let appStateSubscription: ReturnType<
    typeof AppState.addEventListener
  > | null = null;
  let disposed = false;
  let lastAppState = AppState.currentState;
  let initialization: ReturnType<typeof supabase.auth.initialize> | undefined;
  const initializeClient = () =>
    (initialization ??= supabase.auth.initialize());
  const shouldPause = () =>
    lastAppState === null ||
    (typeof lastAppState === 'string' && lastAppState !== 'active');
  return {
    async getIdentity() {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return identity(data.session?.user);
    },
    onAuthChange(listener) {
      if (!disposed && Platform.OS !== 'web' && !appStateSubscription) {
        appStateSubscription = AppState.addEventListener('change', (state) => {
          if (disposed) return;
          lastAppState = state;
          if (state === 'active') supabase.auth.startAutoRefresh();
          else supabase.auth.stopAutoRefresh();
        });
        if (shouldPause()) supabase.auth.stopAutoRefresh();
        // SDK initialization can restart refresh after an earlier pause.
        void initializeClient().then(
          () => {
            if (!disposed && shouldPause()) supabase.auth.stopAutoRefresh();
          },
          () => {
            if (!disposed) supabase.auth.stopAutoRefresh();
          },
        );
      }
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!disposed) listener(identity(session?.user));
      });
      return () => data.subscription.unsubscribe();
    },
    async sendEmailOtp(email) {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
    },
    async verifyEmailOtp(email, code) {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'email',
      });
      if (error) throw error;
      const verified = data.session?.access_token
        ? identity(data.session.user)
        : null;
      if (!verified) throw new Error('No verified session');
      return verified;
    },
    async signOut() {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      appStateSubscription?.remove();
      const disposeClient = () => {
        // Full SDK disposal also closes its web BroadcastChannel and emitters.
        void supabase.auth.dispose().catch(() => {});
      };
      disposeClient();
      // Initialization can create resources after the first disposal. Close
      // them again once startup settles, including failed initialization.
      void initializeClient().then(disposeClient, disposeClient);
    },
  };
}
