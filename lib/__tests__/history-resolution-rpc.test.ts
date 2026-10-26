import { HistoryRpc } from '../sync/history-rpc';
import { encodeHistoryWorkout } from '../sync/history-mapper';
import type { WorkoutSession } from '../workout-model';
const w: WorkoutSession = {
  id: 'legacy',
  templateId: 'old',
  name: 'Saved',
  startedAt: 0,
  finishedAt: 10,
  currentExerciseIndex: 0,
  restDurationSeconds: 90,
  exercises: [],
};
const remote = (workout: WorkoutSession | null = w, revision = 1) => ({
  workoutId: 'legacy',
  revision,
  deletedAt: workout ? null : '2026-10-16T10:00:00Z',
  workout: workout ? encodeHistoryWorkout(workout) : null,
});
const request = () => ({
  workoutId: 'legacy',
  mutationId: 'resolution-1',
  deviceId: 'phone',
  expectedRevision: 1,
  choice: 'both' as const,
  copyId: 'copy',
  workout: w,
});
it('looks up only the requested identity and decodes live, deleted and missing rows', async () => {
  const calls: unknown[] = [];
  const api = new HistoryRpc(async (name, args) => {
    calls.push([name, args]);
    return { data: remote(), error: null };
  });
  expect(await api.get('legacy')).toEqual({ ...remote(), workout: w });
  expect(calls).toEqual([
    ['get_equipment_group_capabilities', {}],
    ['get_completed_workout', { p_workout_id: 'legacy' }],
  ]);
  const deleted = new HistoryRpc(async () => ({
    data: remote(null, 2),
    error: null,
  }));
  expect((await deleted.get('legacy'))!.workout).toBeNull();
  const missing = new HistoryRpc(async () => ({ data: null, error: null }));
  expect(await missing.get('missing')).toBeNull();
});
it.each(['id', 'revision', 'payload', 'deleted'])(
  'rejects malformed lookup snapshots: %s',
  async (kind) => {
    const r = remote();
    if (kind === 'id') r.workoutId = 'another';
    if (kind === 'revision') r.revision = 0;
    if (kind === 'payload') r.workout = { ...r.workout!, name: 4 } as never;
    if (kind === 'deleted') r.deletedAt = 'bad-time';
    const api = new HistoryRpc(async () => ({ data: r, error: null }));
    await expect(api.get('legacy')).rejects.toMatchObject({ kind: 'invalid' });
  },
);
it('binds resolution args and validates both selected snapshots', async () => {
  const copy = { ...w, id: 'copy' };
  let sent: unknown;
  const api = new HistoryRpc(async (name, args) => {
    sent = [name, args];
    return {
      data: {
        kind: 'history_resolution',
        original: remote(),
        copy: {
          ...remote(),
          workoutId: 'copy',
          workout: encodeHistoryWorkout(copy),
        },
      },
      error: null,
    };
  });
  const result = await api.resolve(request());
  expect(result.original.workout).toEqual(w);
  expect(result.copy!.workout).toEqual(copy);
  expect(sent).toEqual([
    'resolve_completed_workout',
    {
      p_workout_id: 'legacy',
      p_mutation_id: 'resolution-1',
      p_device_id: 'phone',
      p_expected_revision: 1,
      p_choice: 'both',
      p_copy_id: 'copy',
      p_workout: encodeHistoryWorkout(w),
    },
  ]);
});
it.each(['choice', 'copy', 'revision', 'identity'])(
  'rejects invalid resolution input before transport: %s',
  async (kind) => {
    const input = request();
    if (kind === 'choice') input.choice = 'guess' as never;
    if (kind === 'copy') input.copyId = 'legacy';
    if (kind === 'revision') input.expectedRevision = 0;
    if (kind === 'identity') input.workout = { ...w, id: 'another' };
    let called = false;
    const api = new HistoryRpc(async () => {
      called = true;
      return { data: null, error: null };
    });
    await expect(api.resolve(input)).rejects.toMatchObject({ kind: 'invalid' });
    expect(called).toBe(false);
  },
);
it.each([
  'wrong-original',
  'wrong-copy',
  'missing-copy',
  'unexpected-copy',
  'wrong-revision',
  'revived',
  'wrong-kind',
])('rejects malformed resolution results: %s', async (kind) => {
  const input = {
    ...request(),
    choice: 'cloud' as 'cloud' | 'both' | 'local',
    copyId: null as string | null,
    workout: null as WorkoutSession | null,
  };
  const result = {
    kind: 'history_resolution',
    original: remote(),
    copy: null as ReturnType<typeof remote> | null,
  };
  if (kind === 'wrong-original') result.original.workoutId = 'another';
  if (kind === 'wrong-copy') {
    input.choice = 'both';
    input.copyId = 'copy';
    input.workout = w;
    result.copy = remote();
  }
  if (kind === 'missing-copy') {
    input.choice = 'both';
    input.copyId = 'copy';
    input.workout = w;
  }
  if (kind === 'unexpected-copy') result.copy = remote();
  if (kind === 'wrong-revision') result.original.revision = 9;
  if (kind === 'revived') {
    input.choice = 'local';
    input.workout = w;
    result.original = remote(null, 2);
  }
  if (kind === 'wrong-kind') result.kind = 'another';
  const api = new HistoryRpc(async () => ({ data: result, error: null }));
  await expect(api.resolve(input)).rejects.toMatchObject({ kind: 'invalid' });
});
