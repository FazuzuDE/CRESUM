import {
  encodeHistoryWorkout,
  decodeHistoryWorkout,
} from '../sync/history-mapper';
import { HistoryRpc, HistoryProtocolError } from '../sync/history-rpc';
import type { WorkoutSession } from '../workout-model';

const workout = (): WorkoutSession => ({
  id: '',
  templateId: 'legacy',
  name: 'Saved name',
  startedAt: 0,
  finishedAt: 1000.5,
  currentExerciseIndex: 0,
  restDurationSeconds: 1e20,
  restOverrideSeconds: 0,
  programSlot: {
    assignmentId: 'old-program',
    weekIndex: 0,
    slotIndex: 1,
    date: '2026-10-15',
  },
  exercises: [0, 1].map(() => ({
    id: 'repeated',
    libraryId: 'legacy-variant',
    name: 'Saved exercise',
    muscle: 'Saved muscle',
    target: {
      repMin: 8,
      repMax: 12,
      restMin: 60,
      restMax: 90,
      programId: 'old',
      revision: 1,
      sourceRefs: ['ref'],
      perSide: true,
    },
    sets: [
      {
        id: 'same',
        weight: '0',
        reps: '10',
        otherSideReps: '8',
        completedAt: 50.25,
      },
      { id: 'same', weight: '', reps: '' },
    ],
  })),
});
const change = (sequence = '9007199254740993') => ({
  sequence,
  workoutId: '',
  revision: 1,
  deletedAt: null,
  workout: encodeHistoryWorkout(workout()),
});
const request = () => ({
  workoutId: '',
  mutationId: 'durable-token',
  deviceId: 'device',
  expectedRevision: null,
  workout: workout(),
});

it('round trips exact historical strings, order, duplicates, optional context and large rest durations', () => {
  const before = workout();
  const encoded = encodeHistoryWorkout(before);
  expect(encoded.exercises.map((e) => e.exercise_index)).toEqual([0, 1]);
  expect(decodeHistoryWorkout(JSON.parse(JSON.stringify(encoded)))).toEqual(
    before,
  );
  encoded.exercises[0].sets[0].weight = 'changed';
  expect(before.exercises[0].sets[0].weight).toBe('0');
});
it('round trips empty aggregates, absent optional values and maximum finite integer rest', () => {
  const value = {
    ...workout(),
    exercises: [],
    programSlot: undefined,
    restOverrideSeconds: undefined,
    restDurationSeconds: Number.MAX_VALUE,
  };
  expect(decodeHistoryWorkout(encodeHistoryWorkout(value))).toEqual(value);
});
it.each([
  { finishedAt: undefined },
  { restEndsAt: 2000 },
  { finishedAt: -1 },
  { restDurationSeconds: 0 },
  { restDurationSeconds: Infinity },
  { currentExerciseIndex: 9 },
])('rejects invalid or active Core history before encoding %j', (patch) => {
  expect(() => encodeHistoryWorkout({ ...workout(), ...patch })).toThrow();
});
it.each([
  'position',
  'set-position',
  'missing-field',
  'bad-target',
  'bad-context',
  'string-time',
])('rejects malformed cloud history: %s', (kind) => {
  const value = encodeHistoryWorkout(workout());
  if (kind === 'position') value.exercises[0].exercise_index = 1;
  if (kind === 'set-position') value.exercises[0].sets[0].set_index = 2;
  if (kind === 'missing-field') delete (value as Partial<typeof value>).name;
  if (kind === 'bad-target') value.exercises[0].target!.repMin = 0;
  if (kind === 'bad-context') value.program_slot!.date = '2026-02-30';
  if (kind === 'string-time') Object.assign(value, { finished_at_ms: '1000' });
  expect(() => decodeHistoryWorkout(value)).toThrow();
});
it('publishes a validated aggregate through the injected RPC without choosing or changing mutation IDs', async () => {
  const rpc = jest.fn(async () => ({
    data: { revision: 1, changeSequence: '9007199254740993' },
    error: null,
  }));
  const api = new HistoryRpc(rpc);
  expect(await api.publish(request())).toEqual({
    revision: 1,
    changeSequence: '9007199254740993',
  });
  expect(rpc).toHaveBeenCalledWith('publish_completed_workout', {
    p_workout_id: '',
    p_mutation_id: 'durable-token',
    p_device_id: 'device',
    p_expected_revision: null,
    p_workout: encodeHistoryWorkout(workout()),
  });
});
it('publishes deletions with an expected revision and null aggregate', async () => {
  const rpc = jest.fn(async () => ({
    data: { revision: 3, changeSequence: '20' },
    error: null,
  }));
  await new HistoryRpc(rpc).publish({
    ...request(),
    expectedRevision: 2,
    workout: null,
  });
  expect(rpc.mock.calls.at(-1)).toEqual([
    'publish_completed_workout',
    expect.objectContaining({ p_expected_revision: 2, p_workout: null }),
  ]);
});
it('rejects mismatched history identity and invalid request IDs before transport', async () => {
  let calls = 0;
  const api = new HistoryRpc(async () => {
    calls++;
    return { data: null, error: null };
  });
  await expect(
    api.publish({ ...request(), workoutId: 'different' }),
  ).rejects.toMatchObject({ kind: 'invalid' });
  await expect(
    api.publish({ ...request(), mutationId: ' ' }),
  ).rejects.toMatchObject({ kind: 'invalid' });
  await expect(
    api.publish({ ...request(), workout: null }),
  ).rejects.toMatchObject({ kind: 'invalid' });
  expect(calls).toBe(0);
});
it('decodes ordered bigint cursors without number rounding and maps live/tombstone snapshots', async () => {
  const changes = [
    change(),
    {
      sequence: '9007199254740994',
      workoutId: 'deleted',
      revision: 2,
      deletedAt: '2026-10-15T12:00:00Z',
      workout: null,
    },
  ];
  const api = new HistoryRpc(async () => ({
    data: { cursor: '9007199254740994', hasMore: false, changes },
    error: null,
  }));
  const page = await api.pull('9007199254740992', 2);
  expect(page.cursor).toBe('9007199254740994');
  expect(page.changes[0].workout).toEqual(workout());
  expect(page.changes[1].workout).toBeNull();
});
it.each([
  'order',
  'cursor',
  'identity',
  'unsafe-number',
  'tombstone',
  'empty-more',
])('rejects malformed pull pages: %s', async (kind) => {
  const page = {
    cursor: '9007199254740993',
    hasMore: false,
    changes: [change()],
  };
  if (kind === 'order') page.changes.push(change('1'));
  if (kind === 'cursor') page.cursor = '9007199254740994';
  if (kind === 'identity') page.changes[0].workoutId = 'wrong';
  if (kind === 'unsafe-number')
    Object.assign(page.changes[0], { sequence: 9007199254740993 });
  if (kind === 'tombstone')
    Object.assign(page.changes[0], { deletedAt: 'invalid' });
  if (kind === 'empty-more')
    Object.assign(page, { changes: [], hasMore: true });
  const api = new HistoryRpc(async () => ({ data: page, error: null }));
  await expect(api.pull()).rejects.toMatchObject({ kind: 'invalid' });
});
it.each([
  ['40001', 'conflict'],
  ['42501', 'auth'],
  ['28000', 'auth'],
  ['22023', 'invalid'],
  ['23514', 'invalid'],
  ['XX000', 'retryable'],
])('classifies %s safely as %s', async (code, kind) => {
  const api = new HistoryRpc(async () => ({
    data: null,
    error: { code, message: 'SECRET provider payload' },
  }));
  try {
    await api.pull();
    throw new Error('expected failure');
  } catch (e) {
    expect(e).toBeInstanceOf(HistoryProtocolError);
    expect(e).toMatchObject({ kind });
    expect(String(e)).not.toContain('SECRET');
  }
});
it('treats thrown network failures as retryable and rejects unsafe cursor/limit before calling transport', async () => {
  const api = new HistoryRpc(async () => {
    throw new TypeError('SECRET');
  });
  await expect(api.pull()).rejects.toMatchObject({ kind: 'retryable' });
  await expect(api.pull('01')).rejects.toMatchObject({ kind: 'invalid' });
  await expect(api.pull('9223372036854775808')).rejects.toMatchObject({
    kind: 'invalid',
  });
  await expect(api.pull('0', 101)).rejects.toMatchObject({ kind: 'invalid' });
});

it('preserves the supported Core date boundary and rejects remapped two-digit years', () => {
  const value = workout();
  value.programSlot!.date = '0100-01-01';
  expect(decodeHistoryWorkout(encodeHistoryWorkout(value))).toEqual(value);
  value.programSlot!.date = '0099-01-01';
  expect(() => encodeHistoryWorkout(value)).toThrow();
});
it.each([
  { expectedRevision: null, workout: workout(), revision: 2 },
  { expectedRevision: 4, workout: workout(), revision: 999 },
  { expectedRevision: 4, workout: null, revision: 4 },
])('rejects an impossible publication acknowledgement %j', async (value) => {
  const api = new HistoryRpc(async () => ({
    data: { revision: value.revision, changeSequence: '1' },
    error: null,
  }));
  await expect(
    api.publish({
      ...request(),
      expectedRevision: value.expectedRevision,
      workout: value.workout,
    }),
  ).rejects.toMatchObject({ kind: 'invalid' });
});
it('accepts the original expected-plus-one receipt when a later server state already exists', async () => {
  const api = new HistoryRpc(async () => ({
    data: { revision: 5, changeSequence: '10' },
    error: null,
  }));
  const saved = { ...request(), expectedRevision: 4 };
  expect(await api.publish(saved)).toEqual({
    revision: 5,
    changeSequence: '10',
  });
  expect(await api.publish(saved)).toEqual({
    revision: 5,
    changeSequence: '10',
  });
});
