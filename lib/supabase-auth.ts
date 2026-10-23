import { HistoryProtocolError } from './sync/history-rpc';
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type User } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';
import type { AuthIdentity, AuthRepository } from './auth-repository';
import {
  AUTH_SESSION_KEY,
  type AccountDeletionRepository,
} from './account-deletion';

export const AUTH_STORAGE_KEY = AUTH_SESSION_KEY;

function identity(user: User | null | undefined): AuthIdentity | null {
  return user ? { id: user.id, email: user.email ?? null } : null;
}

export function createSupabaseAuthRepository(
  config: {
    url?: string;
    publishableKey?: string;
    accountDeletionEnabled?: boolean;
    deletionState?: AccountDeletionRepository;
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
      storage: config.deletionState?.sessionStorage ?? AsyncStorage,
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
  let ownerEpoch = 0;
  let lastOwner: string | null | undefined;
  let lastAppState = AppState.currentState;
  let initialization: ReturnType<typeof supabase.auth.initialize> | undefined;
  const initializeClient = () =>
    (initialization ??= supabase.auth.initialize());
  const shouldPause = () =>
    lastAppState === null ||
    (typeof lastAppState === 'string' && lastAppState !== 'active');
  return {
    ...(config.deletionState
      ? {
          clearDeletedSession: (id: string) =>
            config.deletionState!.clearSession(id),
        }
      : {}),
    ...(config.accountDeletionEnabled && config.deletionState
      ? {
          async deleteAccount(userId: string) {
            const controller = new AbortController();
            let deadline: ReturnType<typeof setTimeout> | undefined;
            const timeout = new Promise<never>((_, reject) => {
              deadline = setTimeout(() => {
                controller.abort();
                reject(new Error('Deletion not confirmed'));
              }, 15000);
            });
            const work = async () => {
              const epoch = ownerEpoch;
              if (disposed) throw new Error('Account changed');
              const { data, error } = await supabase.auth.getSession();
              if (
                disposed ||
                controller.signal.aborted ||
                epoch !== ownerEpoch ||
                error ||
                data.session?.user.id !== userId ||
                !data.session.access_token
              )
                throw new Error('Account changed');
              const response = await fetch(
                `${url.replace(/\/$/, '')}/functions/v1/delete-account`,
                {
                  method: 'POST',
                  signal: controller.signal,
                  headers: {
                    Authorization: `Bearer ${data.session.access_token}`,
                    apikey: publishableKey,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    confirmation: 'DELETE',
                    expectedUserId: userId,
                  }),
                },
              );
              if (controller.signal.aborted || !response.ok)
                throw new Error('Deletion not confirmed');
              const result: unknown = await response.json();
              if (
                controller.signal.aborted ||
                !result ||
                typeof result !== 'object' ||
                (result as { deletedUserId?: unknown }).deletedUserId !== userId
              )
                throw new Error('Deletion not confirmed');
            };
            try {
              await Promise.race([work(), timeout]);
            } finally {
              if (deadline) clearTimeout(deadline);
            }
          },
        }
      : {}),
    async invokeSharedPlan(userId, method, body) {
      const epoch = ownerEpoch;
      const { data, error } = await supabase.auth.getSession();
      if (
        disposed ||
        error ||
        data.session?.user.id !== userId ||
        !data.session.access_token
      )
        throw new Error('Sharing unavailable');
      const controller = new AbortController();
      const deadline = setTimeout(() => controller.abort(), 15000);
      try {
        const response = await fetch(url + '/functions/v1/shared-plan', {
          method,
          headers: {
            Authorization: 'Bearer ' + data.session.access_token,
            apikey: publishableKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        if (!response.ok || disposed || epoch !== ownerEpoch)
          throw new Error('Sharing unavailable');
        return await response.json();
      } catch {
        throw new Error('Sharing unavailable');
      } finally {
        clearTimeout(deadline);
      }
    },
    async historyRpc(userId, name, args) {
      const controller = new AbortController();
      let deadline: ReturnType<typeof setTimeout> | undefined;
      const timeout = new Promise<never>((_, reject) => {
        deadline = setTimeout(() => {
          controller.abort();
          reject(new HistoryProtocolError('retryable'));
        }, 15000);
      });
      const work = async () => {
        if (disposed) throw new HistoryProtocolError('auth');
        const { data, error } = await supabase.auth.getSession();
        if (controller.signal.aborted)
          throw new HistoryProtocolError('retryable');
        if (
          disposed ||
          error ||
          data.session?.user.id !== userId ||
          !data.session.access_token
        )
          throw new HistoryProtocolError('auth');
        // Capture the matching session now; fetchWithAuth must not substitute a newer account.
        const result = await supabase
          .rpc(name, args)
          .setHeader('Authorization', `Bearer ${data.session.access_token}`)
          .abortSignal(controller.signal);
        return {
          data: result.data,
          error: result.error
            ? { ...result.error, status: result.status }
            : null,
        };
      };
      try {
        return await Promise.race([work(), timeout]);
      } finally {
        if (deadline) clearTimeout(deadline);
      }
    },
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
        const next = identity(session?.user);
        // A stale event from the deleted owner must not sign out a new owner.
        if (next && config.deletionState?.state(next.id) === 'confirmed')
          return;
        if (next?.id !== lastOwner) {
          lastOwner = next?.id ?? null;
          ownerEpoch++;
        }
        if (!disposed) listener(next);
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
