import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  HistoryCoordinator,
  type HistorySyncSnapshot,
} from '@/lib/sync/history-coordinator';
import { HistoryRpc } from '@/lib/sync/history-rpc';
import type { WorkoutStore } from '@/lib/workout-store';
import type { AccountSectionProps } from './AccountSection';
// eslint-disable-next-line @typescript-eslint/no-require-imports -- Keep native crypto lazy so offline Core never loads it.
const crypto = () => require('expo-crypto') as typeof import('expo-crypto');
const foreground = () =>
  AppState.currentState !== 'background' &&
  AppState.currentState !== 'inactive';
export function useHistorySync(
  account: AccountSectionProps,
  store: WorkoutStore,
) {
  const [engine] = useState(
    () =>
      new HistoryCoordinator({
        storage: AsyncStorage,
        store,
        makeId: () => crypto().randomUUID(),
        digest: (s) =>
          crypto().digestStringAsync(crypto().CryptoDigestAlgorithm.SHA256, s),
        isCurrent: (id) => !!account.isCurrentAccount?.(id) && foreground(),
      }),
  );
  const snapshot = useSyncExternalStore(engine.subscribe, engine.getSnapshot);
  const lifecycle = useRef({ generation: 0 });
  useEffect(() => {
    const owner = lifecycle.current;
    const generation = ++owner.generation;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;
    let previous = store.getSnapshot();
    const unstore = store.subscribe(() => {
      const next = store.getSnapshot();
      const changed =
        next.data.history !== previous.data.history ||
        (!previous.ready && next.ready) ||
        (previous.busy &&
          !next.busy &&
          engine.getSnapshot().status === 'pending');
      previous = next;
      if (changed && !engine.isApplying()) engine.changed();
    });
    const schedule = () => {
      if (timer) clearTimeout(timer);
      const current = engine.getSnapshot();
      if (
        current.status === 'synced' ||
        current.status === 'disabled' ||
        current.status === 'paused'
      )
        attempts = 0;
      if (
        current.status === 'error' &&
        current.kind === 'retryable' &&
        foreground() &&
        attempts < 5
      ) {
        timer = setTimeout(
          () => {
            attempts++;
            void engine.request();
          },
          Math.min(30000 * 2 ** attempts, 300000),
        );
      }
    };
    const unsync = engine.subscribe(schedule);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        attempts = 0;
        void engine.request();
      } else if (timer) clearTimeout(timer);
    });
    schedule();
    return () => {
      unstore();
      unsync();
      subscription.remove();
      if (timer) clearTimeout(timer);
      queueMicrotask(() => {
        if (owner.generation === generation) engine.dispose();
      });
    };
  }, [engine, store]);
  const userId =
    account.snapshot.status === 'signed_in' &&
    account.snapshot.busy !== 'sign_out'
      ? (account.snapshot.identity?.id ?? null)
      : null;
  const rpc = account.historyRpc;
  useEffect(() => {
    void engine.setAccount(
      userId,
      rpc && userId
        ? new HistoryRpc((name, args) => rpc(userId, name, args))
        : null,
    );
  }, [engine, userId, rpc]);
  const visible: HistorySyncSnapshot =
    snapshot.ownerId === userId
      ? snapshot
      : { status: rpc ? 'pending' : 'unavailable', kind: null };
  return {
    controls: {
      snapshot: visible,
      onEnable: () => {
        void engine.enable();
      },
      onSync: () => {
        void engine.request(true);
      },
    },
    quiesce: (pause = false) => engine.quiesce(pause),
  };
}
