import type { WorkoutSession } from '../workout-model';
import type { WorkoutStore } from '../workout-store';
import {
  HistoryProtocolError,
  type HistoryRpc,
  type HistoryRemote,
  type ResolutionChoice,
} from './history-rpc';
import {
  HistoryLedger,
  historyAccount,
  type HistoryResolutionIntent,
} from './history-ledger';
import type { SyncRepository } from './repository';

export type HistoryConflictSummary = {
  id: string;
  name: string;
  fallbackName?: true;
};
export type HistoryComparison = {
  userId: string;
  workoutId: string;
  local: WorkoutSession | null;
  remote: HistoryRemote | null;
  localHash: string | null;
  remoteHash: string | null;
  blocked: 'other-account' | 'active' | 'missing' | 'same' | null;
};
export type ResolutionApi = Partial<Pick<HistoryRpc, 'get' | 'resolve'>>;
type Options = {
  userId: string;
  api: ResolutionApi;
  ledger: HistoryLedger;
  queue: SyncRepository;
  store: WorkoutStore;
  hash: (w: WorkoutSession) => Promise<string>;
  makeId: () => string;
  current: () => boolean;
  apply: (
    expected: readonly WorkoutSession[],
    history: WorkoutSession[],
    allowed: () => boolean,
  ) => Promise<boolean>;
};
const fail = (kind: 'retryable' | 'auth' | 'conflict' | 'invalid'): never => {
  throw new HistoryProtocolError(kind);
};
export class HistoryResolver {
  constructor(private readonly o: Options) {}
  private guard() {
    if (!this.o.current()) fail('auth');
  }
  private async ready() {
    this.guard();
    const d = await this.o.ledger.read();
    const paused = await this.o.ledger.paused();
    this.guard();
    const state = this.o.store.getSnapshot();
    if (
      paused ||
      !historyAccount(d, this.o.userId).enabled ||
      !state.ready ||
      state.busy ||
      state.error
    )
      fail('retryable');
    return d;
  }
  async conflicts(): Promise<HistoryConflictSummary[]> {
    const d = await this.o.ledger.read();
    this.guard();
    const history = this.o.store.getSnapshot().data.history;
    const account = historyAccount(d, this.o.userId);
    const ids = new Set([
      ...account.facts.filter((f) => f.conflict).map((f) => f.id),
      ...(account.resolutions ?? []).map((r) => r.workoutId),
    ]);
    return [...ids].map((id) => {
      const name = history.find((w) => w.id === id)?.name;
      return {
        id,
        name: name ?? 'Saved workout',
        ...(name === undefined ? { fallbackName: true as const } : {}),
      };
    });
  }
  async compare(workoutId: string): Promise<HistoryComparison> {
    const d = await this.ready(),
      data = this.o.store.getSnapshot().data;
    const local = data.history.find((w) => w.id === workoutId) ?? null;
    const base: HistoryComparison = {
      userId: this.o.userId,
      workoutId,
      local,
      remote: null,
      localHash: local ? await this.o.hash(local) : null,
      remoteHash: null,
      blocked: null,
    };
    this.guard();
    const owner = d.claims.find((c) => c.id === workoutId)?.userId;
    if (owner && owner !== this.o.userId)
      return { ...base, blocked: 'other-account' };
    if (data.activeWorkout?.id === workoutId)
      return { ...base, blocked: 'active' };
    if (!local) return { ...base, blocked: 'missing' };
    if (!this.o.api.get) return fail('invalid');
    const remote = await this.o.api.get(workoutId);
    this.guard();
    const remoteHash = remote?.workout
      ? await this.o.hash(remote.workout)
      : null;
    this.guard();
    return {
      ...base,
      remote,
      remoteHash,
      blocked: !remote
        ? 'missing'
        : remoteHash === base.localHash
          ? 'same'
          : null,
    };
  }
  private async remove(id: string) {
    await this.o.ledger.change((d) => {
      const a = historyAccount(d, this.o.userId);
      a.resolutions = (a.resolutions ?? []).filter((r) => r.id !== id);
    }, this.o.current);
  }
  async recover(): Promise<void> {
    const d = await this.ready();
    for (const intent of historyAccount(d, this.o.userId).resolutions ?? []) {
      this.guard();
      const queue = await this.o.queue.snapshot(this.o.userId);
      this.guard();
      if (queue.generation !== intent.generation) {
        await this.remove(intent.id);
        continue;
      }
      try {
        await this.applyIntent(intent);
      } catch (e) {
        if (
          this.o.current() &&
          e instanceof HistoryProtocolError &&
          e.kind === 'conflict'
        )
          await this.remove(intent.id);
        throw e instanceof HistoryProtocolError
          ? e
          : new HistoryProtocolError('retryable');
      }
    }
  }
  async resolve(
    view: HistoryComparison,
    choice: ResolutionChoice,
  ): Promise<void> {
    if (view.userId !== this.o.userId) return fail('auth');
    if (!['local', 'cloud', 'both'].includes(choice)) return fail('invalid');
    await this.recover();
    const fresh = await this.compare(view.workoutId);
    if (
      fresh.blocked ||
      view.blocked ||
      !fresh.remote ||
      !view.remote ||
      !fresh.local ||
      fresh.localHash !== view.localHash ||
      fresh.remoteHash !== view.remoteHash ||
      fresh.remote.revision !== view.remote.revision ||
      (choice === 'local' && fresh.remote.workout === null)
    )
      return fail('conflict');
    const q = await this.o.queue.snapshot(this.o.userId),
      deviceId = await this.o.queue.getDeviceId();
    this.guard();
    const copyId = choice === 'both' ? this.o.makeId() : null;
    const op: HistoryResolutionIntent = {
      version: 1,
      id: this.o.makeId(),
      workoutId: fresh.workoutId,
      generation: q.generation,
      choice,
      localHash: fresh.localHash!,
      remoteHash: fresh.remoteHash,
      remoteRevision: fresh.remote.revision,
      copyId,
      deviceId,
    };
    if (
      copyId &&
      (this.o.store.getSnapshot().data.activeWorkout?.id === copyId ||
        this.o.store.getSnapshot().data.history.some((w) => w.id === copyId))
    )
      return fail('conflict');
    await this.o.ledger.change((d) => {
      const a = historyAccount(d, this.o.userId);
      if ((a.resolutions ?? []).some((r) => r.workoutId === op.workoutId))
        return fail('retryable');
      for (const id of [op.workoutId, ...(copyId ? [copyId] : [])]) {
        const owner = d.claims.find((c) => c.id === id);
        if (
          (id === copyId && owner) ||
          (owner && owner.userId !== this.o.userId)
        )
          return fail('conflict');
        if (!owner) d.claims.push({ id, userId: this.o.userId });
      }
      (a.resolutions ??= []).push(op);
    }, this.o.current);
    this.guard();
    await this.recover();
  }
  private async source(
    op: HistoryResolutionIntent,
  ): Promise<WorkoutSession | null> {
    const data = this.o.store.getSnapshot().data;
    if (
      data.activeWorkout?.id === op.workoutId ||
      (op.copyId && data.activeWorkout?.id === op.copyId)
    )
      return fail('conflict');
    const original = data.history.find((w) => w.id === op.workoutId) ?? null;
    const hash = original ? await this.o.hash(original) : null;
    this.guard();
    const target = op.choice === 'local' ? op.localHash : op.remoteHash;
    if (hash !== op.localHash && hash !== target) return fail('conflict');
    if (op.choice === 'cloud') return null;
    if (hash === op.localHash) return original;
    const copy = data.history.find((w) => w.id === op.copyId);
    if (copy) {
      const restored = { ...copy, id: op.workoutId };
      if ((await this.o.hash(restored)) === op.localHash) return restored;
    }
    return fail('conflict');
  }
  private async applyIntent(op: HistoryResolutionIntent) {
    await this.ready();
    const document = await this.o.ledger.read();
    this.guard();
    if (
      document.claims.find((c) => c.id === op.workoutId)?.userId !==
        this.o.userId ||
      (op.copyId &&
        document.claims.find((c) => c.id === op.copyId)?.userId !==
          this.o.userId)
    )
      return fail('conflict');
    const source = await this.source(op);
    this.guard();
    if (!this.o.api.resolve) return fail('invalid');
    const result = await this.o.api.resolve({
      workoutId: op.workoutId,
      mutationId: op.id,
      deviceId: op.deviceId,
      expectedRevision: op.remoteRevision,
      choice: op.choice,
      copyId: op.copyId,
      workout: source,
    });
    this.guard();
    const originalHash = result.original.workout
      ? await this.o.hash(result.original.workout)
      : null;
    const copyHash = result.copy?.workout
      ? await this.o.hash(result.copy.workout)
      : null;
    this.guard();
    if (
      originalHash !== (op.choice === 'local' ? op.localHash : op.remoteHash) ||
      (op.copyId &&
        (!source ||
          !result.copy?.workout ||
          copyHash !== (await this.o.hash({ ...source, id: op.copyId }))))
    )
      return fail('invalid');
    await this.source(op);
    this.guard();
    const expected = this.o.store.getSnapshot().data.history;
    let history = [...expected];
    const currentCopy = op.copyId
      ? history.find((w) => w.id === op.copyId)
      : null;
    if (currentCopy && (await this.o.hash(currentCopy)) !== copyHash)
      return fail('conflict');
    this.guard();
    const currentOriginal = history.find((w) => w.id === op.workoutId);
    const alreadyApplied =
      currentOriginal && (await this.o.hash(currentOriginal)) === originalHash;
    this.guard();
    if (result.original.workout && !alreadyApplied)
      history = history.map((w) =>
        w.id === op.workoutId ? result.original.workout! : w,
      );
    else if (!result.original.workout)
      history = history.filter((w) => w.id !== op.workoutId);
    if (result.copy?.workout && !currentCopy) history.push(result.copy.workout);
    const changed =
      history.length !== expected.length ||
      history.some((w, i) => w !== expected[i]);
    if (changed && !(await this.o.apply(expected, history, this.o.current)))
      return fail('retryable');
    this.guard();
    const results = [
      { remote: result.original, hash: originalHash },
      ...(result.copy ? [{ remote: result.copy, hash: copyHash }] : []),
    ];
    await this.o.ledger.change((d) => {
      const a = historyAccount(d, this.o.userId);
      for (const { remote, hash } of results) {
        a.facts = a.facts.filter((f) => f.id !== remote.workoutId);
        a.facts.push({
          id: remote.workoutId,
          revision: remote.revision,
          hash,
          deleted: remote.workout === null,
          conflict: false,
        });
      }
    }, this.o.current);
    this.guard();
    const q = await this.o.queue.snapshot(this.o.userId);
    this.guard();
    for (const { remote } of results) {
      const intent = q.intents.find((i) => i.entityId === remote.workoutId);
      if (intent) {
        this.guard();
        if (
          !(await this.o.queue.acknowledge(
            this.o.userId,
            remote.workoutId,
            intent.token,
            remote.revision,
          ))
        )
          return fail('retryable');
      }
    }
    this.guard();
    await this.o.ledger.change((d) => {
      const a = historyAccount(d, this.o.userId),
        ids = new Set(results.map((r) => r.remote.workoutId));
      a.requests = a.requests.filter((r) => !ids.has(r.id));
      a.resolutions = (a.resolutions ?? []).filter((r) => r.id !== op.id);
    }, this.o.current);
  }
}
