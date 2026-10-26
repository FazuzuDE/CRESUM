import type { WorkoutSession } from '../workout-model';
import {
  encodeHistoryWorkout,
  decodeHistoryWorkout,
  type CloudHistoryWorkout,
} from './history-mapper';
import { identifier, positiveInteger, type SyncErrorKind } from './model';

export type HistoryRpcCall = (
  name: string,
  args: Record<string, unknown>,
) => PromiseLike<{ data: unknown; error: unknown }>;
export class HistoryProtocolError extends Error {
  constructor(public readonly kind: SyncErrorKind) {
    super('Could not sync history. Local workouts remain available.');
  }
}
export type HistoryChange = {
  sequence: string;
  workoutId: string;
  revision: number;
  deletedAt: string | null;
  workout: WorkoutSession | null;
};
export type HistoryPage = {
  cursor: string;
  hasMore: boolean;
  changes: HistoryChange[];
};
export type HistoryRemote = Omit<HistoryChange, 'sequence'>;
export type ResolutionChoice = 'local' | 'cloud' | 'both';
export type HistoryResolutionRequest = {
  workoutId: string;
  mutationId: string;
  deviceId: string;
  expectedRevision: number;
  choice: ResolutionChoice;
  copyId: string | null;
  workout: WorkoutSession | null;
};
export type HistoryResolutionResult = {
  original: HistoryRemote;
  copy: HistoryRemote | null;
};
const invalid = (): never => {
  throw new HistoryProtocolError('invalid');
};
const object = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const compare = (a: string, b: string) =>
  a.length !== b.length ? a.length - b.length : a < b ? -1 : a > b ? 1 : 0;
const cursor = (v: unknown): v is string =>
  typeof v === 'string' &&
  /^(0|[1-9][0-9]*)$/.test(v) &&
  compare(v, '9223372036854775807') <= 0;
function decodeRemote(value: unknown, id: string): HistoryRemote {
  if (
    !object(value) ||
    value.workoutId !== id ||
    !positiveInteger(value.revision) ||
    (value.deletedAt !== null &&
      (typeof value.deletedAt !== 'string' ||
        !Number.isFinite(Date.parse(value.deletedAt))))
  )
    return invalid();
  let workout: WorkoutSession | null = null;
  if (value.deletedAt === null) {
    try {
      workout = decodeHistoryWorkout(value.workout);
    } catch {
      return invalid();
    }
    if (workout.id !== id) return invalid();
  } else if (value.workout !== null) return invalid();
  return {
    workoutId: id,
    revision: value.revision,
    deletedAt: value.deletedAt as string | null,
    workout,
  };
}
function category(error: unknown): SyncErrorKind {
  const e = object(error) ? error : {};
  if (
    e.status === 401 ||
    e.status === 403 ||
    e.code === '42501' ||
    e.code === '28000' ||
    e.code === 'PGRST301'
  )
    return 'auth';
  if (e.code === '0A000') return 'unsupported';
  if (e.code === '40001') return 'conflict';
  if (typeof e.code === 'string' && /^(22|23)/.test(e.code)) return 'invalid';
  return 'retryable';
}
export class HistoryRpc {
  constructor(private readonly rpc: HistoryRpcCall) {}
  private async equipmentSupport(
    payload: CloudHistoryWorkout | null = null,
  ): Promise<boolean> {
    let capabilities: unknown;
    try {
      capabilities = await this.call('get_equipment_group_capabilities', {});
    } catch {
      capabilities = null;
    }
    const supported =
      object(capabilities) &&
      capabilities.historyGroups === 1 &&
      capabilities.historyProtocol === 2;
    if (
      payload?.exercises.some((e) => e.exercise_group !== undefined) &&
      !supported
    )
      throw new HistoryProtocolError('unsupported');
    return supported;
  }
  private async call(
    name: string,
    args: Record<string, unknown>,
  ): Promise<unknown> {
    try {
      const result = await this.rpc(name, args);
      if (result.error) throw new HistoryProtocolError(category(result.error));
      return result.data;
    } catch (e) {
      if (e instanceof HistoryProtocolError) throw e;
      throw new HistoryProtocolError(category(e));
    }
  }
  async get(workoutId: string): Promise<HistoryRemote | null> {
    if (typeof workoutId !== 'string') return invalid();
    const upgraded = await this.equipmentSupport();
    const value = await this.call(
      upgraded ? 'get_completed_workout_v2' : 'get_completed_workout',
      {
        p_workout_id: workoutId,
      },
    );
    return value === null ? null : decodeRemote(value, workoutId);
  }
  async resolve(
    input: HistoryResolutionRequest,
  ): Promise<HistoryResolutionResult> {
    if (
      typeof input.workoutId !== 'string' ||
      !identifier(input.mutationId) ||
      !identifier(input.deviceId) ||
      !positiveInteger(input.expectedRevision) ||
      !['local', 'cloud', 'both'].includes(input.choice) ||
      (input.choice === 'both'
        ? !identifier(input.copyId) || input.copyId === input.workoutId
        : input.copyId !== null) ||
      (input.choice === 'cloud'
        ? input.workout !== null
        : input.workout === null)
    )
      return invalid();
    let payload = null;
    if (input.workout !== null) {
      try {
        payload = encodeHistoryWorkout(input.workout);
      } catch {
        return invalid();
      }
      if (payload.workout_id !== input.workoutId) return invalid();
    }
    const upgraded = await this.equipmentSupport(payload);
    const value = await this.call(
      upgraded ? 'resolve_completed_workout_v2' : 'resolve_completed_workout',
      {
        p_workout_id: input.workoutId,
        p_mutation_id: input.mutationId,
        p_device_id: input.deviceId,
        p_expected_revision: input.expectedRevision,
        p_choice: input.choice,
        p_copy_id: input.copyId,
        p_workout: payload,
      },
    );
    if (!object(value) || value.kind !== 'history_resolution') return invalid();
    const original = decodeRemote(value.original, input.workoutId);
    if (
      original.revision !==
        input.expectedRevision + (input.choice === 'local' ? 1 : 0) ||
      (input.choice === 'local' && original.workout === null)
    )
      return invalid();
    let copy: HistoryRemote | null = null;
    if (input.choice === 'both') {
      copy = decodeRemote(value.copy, input.copyId!);
      if (copy.revision !== 1 || copy.workout === null) return invalid();
    } else if (value.copy !== null) return invalid();
    return { original, copy };
  }
  async publish(input: {
    workoutId: string;
    mutationId: string;
    deviceId: string;
    expectedRevision: number | null;
    workout: WorkoutSession | null;
  }): Promise<{ revision: number; changeSequence: string }> {
    if (
      typeof input.workoutId !== 'string' ||
      !identifier(input.mutationId) ||
      !identifier(input.deviceId) ||
      (input.expectedRevision !== null &&
        !positiveInteger(input.expectedRevision)) ||
      (input.workout === null && input.expectedRevision === null)
    )
      return invalid();
    let payload;
    try {
      payload =
        input.workout === null ? null : encodeHistoryWorkout(input.workout);
    } catch {
      return invalid();
    }
    if (payload && payload.workout_id !== input.workoutId) return invalid();
    const upgraded = await this.equipmentSupport(payload);
    const result = await this.call(
      upgraded ? 'publish_completed_workout_v2' : 'publish_completed_workout',
      {
        p_workout_id: input.workoutId,
        p_mutation_id: input.mutationId,
        p_device_id: input.deviceId,
        p_expected_revision: input.expectedRevision,
        p_workout: payload,
      },
    );
    if (
      !object(result) ||
      !positiveInteger(result.revision) ||
      result.revision !== (input.expectedRevision ?? 0) + 1 ||
      !cursor(result.changeSequence) ||
      result.changeSequence === '0'
    )
      return invalid();
    return { revision: result.revision, changeSequence: result.changeSequence };
  }
  async pull(after = '0', limit = 50): Promise<HistoryPage> {
    if (!cursor(after) || !Number.isInteger(limit) || limit < 1 || limit > 100)
      return invalid();
    const upgraded = await this.equipmentSupport();
    const result = await this.call(
      upgraded ? 'pull_completed_workouts_v2' : 'pull_completed_workouts',
      {
        p_after: after,
        p_limit: limit,
      },
    );
    if (
      !object(result) ||
      !cursor(result.cursor) ||
      typeof result.hasMore !== 'boolean' ||
      !Array.isArray(result.changes) ||
      result.changes.length > limit
    )
      return invalid();
    let previous = after;
    const changes: HistoryChange[] = result.changes.map((c: unknown) => {
      if (
        !object(c) ||
        !cursor(c.sequence) ||
        compare(c.sequence, previous) <= 0 ||
        typeof c.workoutId !== 'string' ||
        !positiveInteger(c.revision)
      )
        return invalid();
      previous = c.sequence;
      if (
        c.deletedAt !== null &&
        (typeof c.deletedAt !== 'string' ||
          !Number.isFinite(Date.parse(c.deletedAt)))
      )
        return invalid();
      let workout: WorkoutSession | null = null;
      if (c.deletedAt === null) {
        try {
          workout = decodeHistoryWorkout(c.workout);
        } catch {
          return invalid();
        }
        if (workout.id !== c.workoutId) return invalid();
      } else if (c.workout !== null) return invalid();
      return {
        sequence: c.sequence,
        workoutId: c.workoutId,
        revision: c.revision,
        deletedAt: c.deletedAt as string | null,
        workout,
      };
    });
    if (
      result.cursor !== previous ||
      (result.hasMore && changes.length !== limit)
    )
      return invalid();
    return { cursor: result.cursor, hasMore: result.hasMore, changes };
  }
}
