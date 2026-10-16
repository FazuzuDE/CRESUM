import type { WorkoutSession } from '../workout-model';
import type { WorkoutStore } from '../workout-store';
import {
  HistoryProtocolError,
  type HistoryRpc,
  type HistoryPage,
  type ResolutionChoice,
} from './history-rpc';
import { encodeHistoryWorkout } from './history-mapper';
import {
  HistoryLedger,
  canonicalHistoryJson,
  historyAccount,
  validHash,
  type HistoryFact,
} from './history-ledger';
import { decideHistoryChange } from './history-reconcile';
import { SyncRepository } from './repository';
import { flushSync, type SyncStorage } from './storage';
import type { SyncErrorKind, SyncSnapshot } from './model';
import {
  HistoryResolver,
  type HistoryComparison,
  type ResolutionApi,
} from './history-resolver';
export type HistorySyncSnapshot = {
  ownerId?: string | null;
  status:
    | 'unavailable'
    | 'disabled'
    | 'paused'
    | 'pending'
    | 'syncing'
    | 'synced'
    | 'error';
  kind: SyncErrorKind | null;
};
type Api = Pick<HistoryRpc, 'publish' | 'pull'> & ResolutionApi;
type Context = { userId: string; epoch: number; api: Api };
export class HistoryCoordinator {
  private readonly ledger: HistoryLedger;
  private readonly queue: SyncRepository;
  private userId: string | null = null;
  private api: Api | null = null;
  private epoch = 0;
  private disposed = false;
  private suspended = 0;
  private running: { epoch: number; promise: Promise<void> } | null = null;
  private rerun = false;
  private applying = false;
  private resolutionRun: { epoch: number } | null = null;
  private snapshot: HistorySyncSnapshot = { status: 'unavailable', kind: null };
  private listeners = new Set<() => void>();
  constructor(
    private readonly options: {
      storage: SyncStorage;
      store: WorkoutStore;
      makeId: () => string;
      digest: (value: string) => Promise<string>;
      isCurrent: (userId: string) => boolean;
    },
  ) {
    this.ledger = new HistoryLedger(options.storage);
    this.queue = new SyncRepository(options.storage, options.makeId);
  }
  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  isApplying = () => this.applying;
  private publish(
    status: HistorySyncSnapshot['status'],
    kind: SyncErrorKind | null = null,
  ) {
    if (this.disposed) return;
    this.snapshot = { status, kind, ownerId: this.userId };
    this.listeners.forEach((l) => l());
  }
  private current(c: Context) {
    return (
      !this.disposed &&
      !this.suspended &&
      c.epoch === this.epoch &&
      c.userId === this.userId &&
      this.options.isCurrent(c.userId)
    );
  }
  private context(): Context | null {
    return this.userId && this.api
      ? { userId: this.userId, api: this.api, epoch: this.epoch }
      : null;
  }
  private async hash(w: WorkoutSession) {
    const hash = (
      await this.options.digest(canonicalHistoryJson(encodeHistoryWorkout(w)))
    ).toLowerCase();
    if (!validHash(hash)) throw new HistoryProtocolError('invalid');
    return hash;
  }
  async setAccount(
    userId: string | null,
    api: Api | null = null,
  ): Promise<void> {
    ++this.epoch;
    this.userId = userId;
    this.api = api;
    this.rerun = false;
    this.publish(userId && api ? 'disabled' : 'unavailable');
    const c = this.context();
    if (!c) return;
    try {
      const paused = await this.ledger.paused();
      const doc = await this.ledger.read();
      if (!this.current(c)) return;
      const enabled = doc.accounts.find((a) => a.userId === c.userId)?.enabled;
      this.publish(paused ? 'paused' : enabled ? 'pending' : 'disabled');
      if (enabled && !paused) await this.request();
    } catch {
      if (this.current(c)) this.publish('error', 'invalid');
    }
  }
  async enable(): Promise<void> {
    const c = this.context();
    if (!c || !this.current(c)) return;
    // Fence any older cycle before resetting the cursor/generation for an explicit full merge.
    ++this.epoch;
    c.epoch = this.epoch;
    this.publish('syncing');
    try {
      await this.ledger.setPaused(true);
      if (!this.current(c)) return;
      await this.ledger.change(
        (d) => {
          historyAccount(d, c.userId).enabled = true;
          historyAccount(d, c.userId).resolutions = [];
        },
        () => this.current(c),
      );
      if (!this.current(c)) return;
      await this.queue.clearUser(c.userId);
      if (!this.current(c)) return;
      await this.ledger.setPaused(false);
      if (this.current(c)) await this.request(true);
    } catch (e) {
      if (this.current(c))
        this.publish(
          'error',
          e instanceof HistoryProtocolError ? e.kind : 'invalid',
        );
    }
  }
  changed(): void {
    if (this.applying) return;
    if (
      this.running?.epoch === this.epoch ||
      this.resolutionRun?.epoch === this.epoch
    )
      this.rerun = true;
    else void this.request();
  }
  request(manual = false): Promise<void> {
    const c = this.context();
    if (!c || !this.current(c)) return Promise.resolve();
    if (this.resolutionRun?.epoch === c.epoch) return Promise.resolve();
    if (this.running?.epoch === c.epoch) return this.running.promise;
    const promise = this.cycle(c, manual)
      .catch((e) => {
        if (this.current(c))
          this.publish(
            'error',
            e instanceof HistoryProtocolError ? e.kind : 'retryable',
          );
      })
      .finally(() => {
        if (this.running?.promise === promise) this.running = null;
        if (this.current(c) && this.rerun) {
          this.rerun = false;
          void this.request();
        }
      });
    this.running = { epoch: c.epoch, promise };
    return promise;
  }
  private async cycle(c: Context, manual: boolean): Promise<void> {
    if (await this.ledger.paused()) {
      if (this.current(c)) this.publish('paused');
      return;
    }
    const doc = await this.ledger.read();
    if (!this.current(c)) return;
    if (!doc.accounts.find((a) => a.userId === c.userId)?.enabled) {
      this.publish('disabled');
      return;
    }
    const local = this.options.store.getSnapshot();
    if (!local.ready || local.busy || local.error) {
      this.publish('pending');
      return;
    }
    await this.resolver(c).recover();
    if (!this.current(c)) return;
    // Enroll local history before any network work. A failed pull must not leave
    // this account's unsent workouts available for a later account to claim.
    if (
      local.data.history.some((w) => !doc.claims.some((p) => p.id === w.id))
    ) {
      await this.ledger.change(
        (d) => {
          for (const workout of local.data.history)
            if (!d.claims.some((p) => p.id === workout.id))
              d.claims.push({ id: workout.id, userId: c.userId });
        },
        () => this.current(c),
      );
      if (!this.current(c)) return;
    }
    this.publish('syncing');
    const q = await this.queue.snapshot(c.userId);
    if (!this.current(c)) return;
    if (manual) {
      await this.queue.setCursor(c.userId, '0', q.generation);
      q.cursor = '0';
    }
    let more = false;
    for (let pages = 0; pages < 50; pages++) {
      if (!this.current(c)) return;
      const page = await c.api.pull(q.cursor ?? '0', 50);
      if (!this.current(c)) return;
      await this.applyPage(c, page, q);
      if (!this.current(c)) return;
      if (!(await this.queue.setCursor(c.userId, page.cursor, q.generation)))
        throw new HistoryProtocolError('retryable');
      q.cursor = page.cursor;
      more = page.hasMore;
      if (!more) break;
    }
    if (!this.current(c)) return;
    if (more) {
      this.rerun = true;
      this.publish('pending');
      return;
    }
    await this.pushLocal(c, manual);
    if (!this.current(c)) return;
    const end = await this.ledger.read(),
      account = historyAccount(end, c.userId),
      pending = await this.queue.snapshot(c.userId);
    if (!this.current(c)) return;
    if (account.facts.some((f) => f.conflict)) {
      this.publish('error', 'conflict');
      return;
    }
    const blocked = pending.intents.find((i) => i.state === 'blocked');
    if (blocked) {
      this.publish('error', blocked.error ?? 'invalid');
      return;
    }
    this.publish(pending.intents.length || this.rerun ? 'pending' : 'synced');
  }
  private resolver(c: Context): HistoryResolver {
    return new HistoryResolver({
      userId: c.userId,
      api: c.api,
      ledger: this.ledger,
      queue: this.queue,
      store: this.options.store,
      hash: (w) => this.hash(w),
      makeId: this.options.makeId,
      current: () => this.current(c),
      apply: async (expected, history, allowed) => {
        this.applying = true;
        try {
          return await this.options.store.applyCloudHistory(
            expected,
            history,
            allowed,
          );
        } finally {
          this.applying = false;
        }
      },
    });
  }
  async conflicts() {
    const c = this.context();
    if (!c || !this.current(c)) throw new HistoryProtocolError('auth');
    return this.resolver(c).conflicts();
  }
  private async exclusive<T>(
    work: (r: HistoryResolver) => Promise<T>,
    success: 'pending' | 'error',
  ): Promise<T> {
    const c = this.context();
    if (!c || !this.current(c)) throw new HistoryProtocolError('auth');
    if (this.resolutionRun?.epoch === c.epoch)
      throw new HistoryProtocolError('retryable');
    c.epoch = ++this.epoch;
    const run = { epoch: c.epoch };
    this.resolutionRun = run;
    this.publish('syncing');
    try {
      await flushSync(this.options.storage);
      await this.options.store.waitForPendingWrites();
      if (!this.current(c)) throw new HistoryProtocolError('auth');
      const value = await work(this.resolver(c));
      if (this.current(c))
        this.publish(success, success === 'error' ? 'conflict' : null);
      return value;
    } catch (e) {
      const error =
        e instanceof HistoryProtocolError
          ? e
          : new HistoryProtocolError('retryable');
      if (this.current(c)) this.publish('error', error.kind);
      throw error;
    } finally {
      if (this.resolutionRun === run) this.resolutionRun = null;
      if (this.current(c) && this.rerun) {
        this.rerun = false;
        void this.request();
      }
    }
  }
  compare(id: string): Promise<HistoryComparison> {
    return this.exclusive((r) => r.compare(id), 'error');
  }
  async resolve(
    view: HistoryComparison,
    choice: ResolutionChoice,
  ): Promise<void> {
    await this.exclusive((r) => r.resolve(view, choice), 'pending');
    await this.request();
  }
  private async applyPage(
    c: Context,
    page: HistoryPage,
    q: SyncSnapshot,
  ): Promise<void> {
    if (!page.changes.length) return;
    const doc = await this.ledger.read();
    if (!this.current(c)) return;
    const a = historyAccount(doc, c.userId);
    const expected = this.options.store.getSnapshot().data.history;
    let history = [...expected];
    const facts: HistoryFact[] = [];
    const claims: string[] = [];
    const matched: string[] = [];
    for (const change of page.changes) {
      const local = history.find((w) => w.id === change.workoutId);
      const localHash = local ? await this.hash(local) : null;
      const remoteHash = change.workout
        ? await this.hash(change.workout)
        : null;
      if (!this.current(c)) return;
      const owner = doc.claims.find((p) => p.id === change.workoutId)?.userId;
      const prior =
        [...facts].reverse().find((f) => f.id === change.workoutId) ??
        a.facts.find((f) => f.id === change.workoutId);
      if (
        prior &&
        (change.revision < prior.revision ||
          (change.revision === prior.revision &&
            (remoteHash !== prior.hash ||
              (change.workout === null) !== prior.deleted)))
      )
        throw new HistoryProtocolError('invalid');
      const decision = decideHistoryChange({
        owner,
        userId: c.userId,
        localHash,
        remoteHash,
        prior,
        pending: a.requests.find((r) => r.id === change.workoutId),
      });
      if (decision !== 'conflict' && !owner) claims.push(change.workoutId);
      if (decision === 'add') history.push(change.workout!);
      else if (decision === 'replace')
        history = history.map((w) =>
          w.id === change.workoutId ? change.workout! : w,
        );
      else if (decision === 'remove')
        history = history.filter((w) => w.id !== change.workoutId);
      facts.push({
        id: change.workoutId,
        revision: change.revision,
        hash: remoteHash,
        deleted: change.workout === null,
        conflict: decision === 'conflict',
      });
      if (decision === 'same' && localHash === remoteHash)
        matched.push(change.workoutId);
    }
    await this.ledger.change(
      (d) => {
        for (const id of claims) {
          const old = d.claims.find((p) => p.id === id);
          if (old && old.userId !== c.userId)
            throw new HistoryProtocolError('conflict');
          if (!old) d.claims.push({ id, userId: c.userId });
        }
      },
      () => this.current(c),
    );
    if (!this.current(c)) return;
    if (
      history.length !== expected.length ||
      history.some((w, i) => w !== expected[i])
    ) {
      this.applying = true;
      try {
        if (
          !(await this.options.store.applyCloudHistory(expected, history, () =>
            this.current(c),
          ))
        )
          throw new HistoryProtocolError('retryable');
      } finally {
        this.applying = false;
      }
    }
    if (!this.current(c)) return;
    await this.ledger.change(
      (d) => {
        const acc = historyAccount(d, c.userId);
        for (const f of facts) {
          const i = acc.facts.findIndex((old) => old.id === f.id);
          if (i < 0) acc.facts.push(f);
          else acc.facts[i] = f;
        }
      },
      () => this.current(c),
    );
    if (!this.current(c)) return;
    const current = await this.queue.snapshot(c.userId);
    for (const id of matched) {
      const intent = current.intents.find((i) => i.entityId === id),
        fact = [...facts].reverse().find((f) => f.id === id);
      if (intent && fact && this.current(c))
        await this.queue.acknowledge(c.userId, id, intent.token, fact.revision);
    }
  }
  private async pushLocal(c: Context, manual: boolean): Promise<void> {
    const history = this.options.store.getSnapshot().data.history,
      deviceId = await this.queue.getDeviceId();
    for (const workout of history) {
      if (!this.current(c)) return;
      const hash = await this.hash(workout),
        doc = await this.ledger.read();
      if (!this.current(c)) return;
      const a = historyAccount(doc, c.userId),
        owner = doc.claims.find((p) => p.id === workout.id)?.userId,
        fact = a.facts.find((f) => f.id === workout.id);
      if (owner && owner !== c.userId) continue;
      if (!owner)
        await this.ledger.change(
          (d) => {
            if (
              d.claims.some((p) => p.id === workout.id && p.userId !== c.userId)
            )
              throw new HistoryProtocolError('conflict');
            if (!d.claims.some((p) => p.id === workout.id))
              d.claims.push({ id: workout.id, userId: c.userId });
          },
          () => this.current(c),
        );
      if (!this.current(c)) return;
      if (fact?.conflict || fact?.deleted) continue;
      let queue = await this.queue.snapshot(c.userId),
        intent = queue.intents.find((i) => i.entityId === workout.id);
      if (fact?.hash === hash) {
        if (intent)
          await this.queue.acknowledge(
            c.userId,
            workout.id,
            intent.token,
            fact.revision,
          );
        continue;
      }
      const old = a.requests.find((r) => r.id === workout.id),
        base = fact?.revision ?? null;
      if (
        !intent ||
        !old ||
        old.hash !== hash ||
        old.expectedRevision !== base ||
        old.token.generation !== intent.token.generation ||
        old.token.sequence !== intent.token.sequence
      ) {
        const token = await this.queue.enqueue(c.userId, {
          entityId: workout.id,
          operation: 'upsert',
          baseRevision: base,
        });
        if (!this.current(c)) return;
        await this.ledger.change(
          (d) => {
            const acc = historyAccount(d, c.userId);
            acc.requests = acc.requests.filter((r) => r.id !== workout.id);
            acc.requests.push({
              id: workout.id,
              token,
              hash,
              expectedRevision: base,
            });
          },
          () => this.current(c),
        );
        queue = await this.queue.snapshot(c.userId);
        intent = queue.intents.find((i) => i.entityId === workout.id);
      }
      if (!intent || !this.current(c)) return;
      if (intent.state === 'blocked') {
        if (!manual) continue;
        await this.queue.retry(c.userId, workout.id, intent.token);
      }
      try {
        const result = await c.api.publish({
          workoutId: workout.id,
          mutationId: JSON.stringify([
            intent.token.generation,
            workout.id,
            intent.token.sequence,
          ]),
          deviceId,
          expectedRevision: base,
          workout,
        });
        if (!this.current(c)) return;
        await this.ledger.change(
          (d) => {
            const acc = historyAccount(d, c.userId);
            acc.facts = acc.facts.filter((f) => f.id !== workout.id);
            acc.facts.push({
              id: workout.id,
              revision: result.revision,
              hash,
              deleted: false,
              conflict: false,
            });
          },
          () => this.current(c),
        );
        if (!this.current(c)) return;
        await this.queue.acknowledge(
          c.userId,
          workout.id,
          intent.token,
          result.revision,
        );
        if (this.current(c))
          await this.ledger.change(
            (d) => {
              historyAccount(d, c.userId).requests = historyAccount(
                d,
                c.userId,
              ).requests.filter((r) => r.id !== workout.id);
            },
            () => this.current(c),
          );
      } catch (e) {
        if (!this.current(c)) return;
        const kind = e instanceof HistoryProtocolError ? e.kind : 'retryable';
        await this.queue.defer(c.userId, workout.id, intent.token, kind);
        throw new HistoryProtocolError(kind);
      }
    }
  }
  async quiesce(pause = false): Promise<() => void> {
    ++this.epoch;
    ++this.suspended;
    this.rerun = false;
    try {
      if (pause) await this.ledger.setPaused(true);
      await flushSync(this.options.storage);
      await this.options.store.waitForPendingWrites();
      if (pause) this.publish('paused');
    } catch (e) {
      --this.suspended;
      throw e;
    }
    let released = false;
    return () => {
      if (released) return;
      released = true;
      --this.suspended;
      if (!this.suspended && !this.disposed) void this.request();
    };
  }
  dispose() {
    this.disposed = true;
    ++this.epoch;
    this.listeners.clear();
  }
}
