import { createHash } from 'crypto';
import { HistoryCoordinator } from '../../sync/history-coordinator';
import {
  HistoryProtocolError,
  type HistoryRemote,
  type HistoryResolutionRequest,
  type HistoryResolutionResult,
} from '../../sync/history-rpc';
import { WorkoutRepository, STATE_KEY } from '../../workout-repository';
import { WorkoutStore } from '../../workout-store';
import type { WorkoutSession } from '../../workout-model';
export const savedWorkout = (id = 'local', reps = '8'): WorkoutSession => ({
  id,
  name: 'Upper Body',
  templateId: 'old',
  startedAt: 0,
  finishedAt: 10,
  currentExerciseIndex: 0,
  restDurationSeconds: 90,
  exercises: [
    {
      id: 'e',
      libraryId: 'barbell-bench-press',
      name: 'Bench Press',
      muscle: 'Chest',
      sets: [{ id: 's', weight: '60', reps, completedAt: 5 }],
    },
  ],
});
const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;
export class ResolutionServer {
  rows = new Map<string, Map<string, HistoryRemote>>();
  events: { user: string; id: string; sequence: string }[] = [];
  receipts = new Map<
    string,
    { input: string; result: HistoryResolutionResult }
  >();
  resolutionCalls: HistoryResolutionRequest[] = [];
  getCalls = 0;
  failAfterCommit = false;
  hold: Promise<void> | null = null;
  beforeResolve: (() => void) | null = null;
  seed(user: string, workout: WorkoutSession | null, id = workout!.id) {
    const rows = this.rows.get(user) ?? new Map<string, HistoryRemote>();
    rows.set(id, {
      workoutId: id,
      revision: (rows.get(id)?.revision ?? 0) + 1,
      deletedAt: workout ? null : '2026-10-16T10:00:00Z',
      workout: clone(workout),
    });
    this.rows.set(user, rows);
    this.events.push({ user, id, sequence: String(this.events.length + 1) });
  }
  api(user: string) {
    return {
      get: async (id: string) => {
        this.getCalls++;
        return clone(this.rows.get(user)?.get(id) ?? null);
      },
      pull: async (after = '0', limit = 50) => {
        const all = this.events.filter(
            (e) => e.user === user && Number(e.sequence) > Number(after),
          ),
          page = all.slice(0, limit);
        return {
          cursor: page.at(-1)?.sequence ?? after,
          hasMore: all.length > limit,
          changes: page.map((e) => ({
            ...clone(this.rows.get(user)!.get(e.id)!),
            sequence: e.sequence,
          })),
        };
      },
      publish: async (input: {
        workoutId: string;
        expectedRevision: number | null;
        workout: WorkoutSession | null;
      }) => {
        const row = this.rows.get(user)?.get(input.workoutId);
        if (
          (row?.revision ?? null) !== input.expectedRevision ||
          row?.deletedAt
        )
          throw new HistoryProtocolError('conflict');
        this.seed(user, input.workout, input.workoutId);
        return {
          revision: this.rows.get(user)!.get(input.workoutId)!.revision,
          changeSequence: this.events.at(-1)!.sequence,
        };
      },
      resolve: async (
        input: HistoryResolutionRequest,
      ): Promise<HistoryResolutionResult> => {
        this.resolutionCalls.push(clone(input));
        if (this.hold) await this.hold;
        this.beforeResolve?.();
        this.beforeResolve = null;
        const key = user + '|' + input.mutationId,
          request = JSON.stringify(input),
          old = this.receipts.get(key);
        if (old) {
          if (old.input !== request) throw new HistoryProtocolError('invalid');
          return clone(old.result);
        }
        const rows = this.rows.get(user),
          root = rows?.get(input.workoutId);
        if (
          !root ||
          root.revision !== input.expectedRevision ||
          (input.choice === 'local' && root.deletedAt)
        )
          throw new HistoryProtocolError('conflict');
        let copy: HistoryRemote | null = null;
        if (input.choice === 'local')
          this.seed(user, input.workout, input.workoutId);
        if (input.choice === 'both') {
          if (rows!.has(input.copyId!))
            throw new HistoryProtocolError('conflict');
          this.seed(user, { ...input.workout!, id: input.copyId! });
          copy = clone(rows!.get(input.copyId!)!);
        }
        const result = { original: clone(rows!.get(input.workoutId)!), copy };
        this.receipts.set(key, { input: request, result: clone(result) });
        if (this.failAfterCommit) {
          this.failAfterCommit = false;
          throw new HistoryProtocolError('retryable');
        }
        return result;
      },
    };
  }
}
export async function conflictFixture(id = 'local') {
  const values = new Map([
    [
      STATE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        history: [savedWorkout(id)],
        activeWorkout: null,
        templates: [],
      }),
    ],
  ]);
  const storage = {
    getItem: async (k: string) => values.get(k) ?? null,
    setItem: async (k: string, v: string) => {
      values.set(k, v);
    },
    removeItem: async (k: string) => {
      values.delete(k);
    },
  };
  const store = new WorkoutStore(new WorkoutRepository(storage));
  await store.load();
  const server = new ResolutionServer();
  server.seed('A', savedWorkout(id, '10'));
  let n = 0,
    current = 'A';
  const create = () =>
    new HistoryCoordinator({
      storage,
      store,
      makeId: () => `uuid-${++n}`,
      digest: async (s) => createHash('sha256').update(s).digest('hex'),
      isCurrent: (id) => id === current,
    });
  const engine = create();
  await engine.setAccount('A', server.api('A'));
  await engine.enable();
  return {
    values,
    storage,
    store,
    server,
    create,
    engine,
    setCurrent: (id: string) => {
      current = id;
    },
  };
}
