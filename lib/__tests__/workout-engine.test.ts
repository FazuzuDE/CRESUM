import { saveSetEntry, suggestSetValues } from '../set-entry';
import { findExercise } from '../exercise-library';
import { defaultTemplates, exerciseLibrary } from '../workout-catalog';
import {
  addSet,
  appendExercise,
  completedSetCount,
  createExercise,
  exerciseIdsMatch,
  exerciseRestPreference,
  extendRest,
  finishWorkout,
  hasWorkoutResults,
  removeWorkoutExercises,
  remainingRestSeconds,
  removeSet,
  resolveTemplateExercises,
  restartRest,
  setCurrentExercise,
  setInputIsValid,
  skipRest,
  startWorkout,
  toggleSet,
  toggleTargetRest,
  totalSetCount,
  updateSet,
  workoutIsComplete,
} from '../workout-engine';
import { volume } from '../workout-metrics';
import {
  WorkoutRepository,
  STATE_KEY,
  KeyValueStorage,
} from '../workout-repository';
import { WorkoutStore } from '../workout-store';

function memoryStorage(): KeyValueStorage & { values: Map<string, string> } {
  const values = new Map<string, string>();
  return {
    values,
    getItem: jest.fn(async (key) => values.get(key) ?? null),
    setItem: jest.fn(async (key, value) => {
      values.set(key, value);
    }),
  };
}
const start = () => startWorkout(defaultTemplates[0], exerciseLibrary, 1000);
const logSet = (session = start(), ei = 0, si = 0, now = 2000) =>
  toggleSet(
    updateSet(session, ei, si, { weight: '80,5', reps: '10' }),
    ei,
    si,
    now,
  ).session;

it('chooses rest from the completed exercise and never carries it to the next one', () => {
  const bench = 'barbell-bench-press';
  const squat = 'barbell-back-squat';
  const template = {
    id: 'rest-plan',
    name: 'Rest plan',
    exerciseIds: [bench, squat],
    plannedExercises: [
      {
        exerciseId: bench,
        sets: 2,
        restSeconds: 120,
        target: {
          kind: 'authored' as const,
          repMin: 8,
          repMax: 12,
          restMin: 120,
          restMax: 150,
        },
      },
    ],
  };
  const active = startWorkout(template, exerciseLibrary, 1000);
  const complete = (
    session = active,
    index = 0,
    set = 0,
    preference?: number,
  ) =>
    toggleSet(
      updateSet(session, index, set, { weight: '50', reps: '10' }),
      index,
      set,
      2000,
      preference,
    );
  const first = complete(active, 0, 0, 60);
  expect(first.session.restEndsAt).toBe(122000);
  const longer = toggleTargetRest(first.session, active.exercises[0].id);
  expect(longer.restEndsAt).toBe(122000);
  expect(restartRest(longer, 4000).restEndsAt).toBe(124000);
  const second = complete(longer, 0, 1, 60);
  expect(second.session.restEndsAt).toBe(152000);
  expect(second.session.currentExerciseIndex).toBe(1);
  expect(complete(second.session, 1).session.restEndsAt).toBe(92000);
  expect(complete(second.session, 1, 0, 30).session.restEndsAt).toBe(32000);
  expect(complete(second.session, 1, 0, 0)).toMatchObject({
    session: { restEndsAt: undefined },
    startedRest: false,
  });
  expect(
    complete({ ...active, restOverrideSeconds: 75 }).session.restEndsAt,
  ).toBe(77000);
  expect(
    finishWorkout(second.session, 3000).exercises[0].plannedRestSeconds,
  ).toBeUndefined();
});

it('saves and clears canonical exercise defaults without touching a running countdown', async () => {
  const storage = memoryStorage();
  const repo = new WorkoutRepository(storage);
  const state = await repo.load();
  const active = logSet();
  await repo.save({ ...state, activeWorkout: active });
  const store = new WorkoutStore(repo);
  await store.load();
  const exercise = active.exercises[0];
  expect(await store.saveExerciseRest(active.id, exercise.id, 75)).toBe(true);
  const next = await new WorkoutRepository(storage).load();
  expect(
    exerciseRestPreference(next.exerciseRestSeconds, exercise.libraryId),
  ).toBe(75);
  expect(next.activeWorkout?.restEndsAt).toBe(active.restEndsAt);
  expect(next.activeWorkout?.exercises[0].sets).toEqual(
    active.exercises[0].sets,
  );
  jest.mocked(storage.setItem).mockRejectedValueOnce(new Error('write failed'));
  expect(await store.saveExerciseRest(active.id, exercise.id, 0)).toBe(false);
  expect(
    store.getSnapshot().data.exerciseRestSeconds?.[exercise.libraryId],
  ).toBe(75);
  expect(await store.saveExerciseRest(active.id, exercise.id, undefined)).toBe(
    true,
  );
  expect(
    (await new WorkoutRepository(storage).load()).exerciseRestSeconds,
  ).toEqual({});
});

it('persists manual cardio with no strength sets and records only elapsed cardio', async () => {
  const storage = memoryStorage();
  const repository = new WorkoutRepository(storage);
  const session = startWorkout(
    { id: 'cardio', name: 'Cardio', exerciseIds: ['treadmill-walking'] },
    exerciseLibrary,
    1000,
  );
  const exercise = session.exercises[0];
  expect(exercise.sets).toEqual([]);
  expect(hasWorkoutResults(session, 40_000)).toBe(false);
  const running = {
    ...session,
    exercises: [
      { ...exercise, cardio: { ...exercise.cardio!, startedAt: 40_000 } },
    ],
  };
  await repository.saveVerified({
    schemaVersion: 1,
    activeWorkout: running,
    history: [],
    templates: [],
  });
  const restored = (await repository.load()).activeWorkout!;
  expect(restored.exercises[0].cardio?.startedAt).toBe(40_000);
  expect(workoutIsComplete(restored, 48_000)).toBe(true);
  const completed = finishWorkout(restored, 48_000);
  expect(completedSetCount(completed)).toBe(0);
  expect(completed.exercises[0].cardio).toMatchObject({ elapsedMs: 8000 });
  expect(completed.exercises[0].cardio?.startedAt).toBeUndefined();
  const removal = removeWorkoutExercises(
    restored,
    [exercise.id],
    true,
    'saved',
    45_000,
  );
  expect(removal.active.exercises).toEqual([]);
  expect(removal.recorded?.exercises[0].cardio?.elapsedMs).toBe(5000);
  await repository.saveVerified({
    schemaVersion: 1,
    activeWorkout: null,
    history: [completed],
    templates: [],
  });
  const store = new WorkoutStore(repository);
  await store.load();
  const localHistory = store.getSnapshot().data.history;
  const remote = {
    ...completed,
    exercises: completed.exercises.map((row) => ({
      ...row,
      cardio: undefined,
    })),
  };
  expect(
    await store.applyCloudHistory(localHistory, [remote], () => true),
  ).toBe(true);
  expect(
    store.getSnapshot().data.history[0].exercises[0].cardio?.elapsedMs,
  ).toBe(8000);
});

describe('workout engine', () => {
  it('resolves legacy template ids to canonical snapshot ids', () => {
    const session = startWorkout(
      { id: 'legacy', name: 'Legacy', exerciseIds: ['bench', 'row'] },
      exerciseLibrary,
      1000,
    );

    expect(session.exercises.map((item) => item.libraryId)).toEqual([
      'barbell-bench-press',
      'seated-cable-row',
    ]);
  });

  it('prefills planned sets and weight only in a new incomplete workout snapshot', () => {
    const template = {
      id: 'planned',
      name: 'Push',
      exerciseIds: ['bench', 'row'],
      plannedExercises: [
        { exerciseId: 'barbell-bench-press', sets: 4, weight: '60' },
      ],
    };
    const session = startWorkout(template, exerciseLibrary, 1000, () => 'id');
    expect(session.exercises[0].sets).toHaveLength(4);
    expect(session.exercises[0].sets.map((set) => set.weight)).toEqual([
      '60',
      '60',
      '60',
      '60',
    ]);
    expect(
      session.exercises[0].sets.every((set) => set.completedAt === undefined),
    ).toBe(true);
    expect(session.exercises[1].sets).toHaveLength(3);
    expect(session.exercises[1].sets[0].weight).toBe('');

    const actual = toggleSet(
      updateSet(session, 0, 0, { weight: '65', reps: '8' }),
      0,
      0,
      2000,
    ).session;
    const finished = finishWorkout(actual, 3000);
    expect(finished.exercises[0].sets[0]).toMatchObject({
      weight: '65',
      reps: '8',
      completedAt: 2000,
    });
    expect(finished.exercises[0].sets[1]).toMatchObject({
      weight: '60',
      reps: '10',
    });
    expect(finished.exercises[0].sets[1].completedAt).toBeUndefined();
    expect(template.plannedExercises[0].weight).toBe('60');
  });

  it('resolves mixed templates in source order and skips unknown ids', () => {
    expect(
      resolveTemplateExercises(
        {
          id: 'mixed',
          name: 'Mixed',
          exerciseIds: ['bench', 'lat-pulldown', 'unknown', 'row'],
        },
        exerciseLibrary,
      ).map((item) => item.id),
    ).toEqual(['barbell-bench-press', 'lat-pulldown', 'seated-cable-row']);
  });

  it('snapshots canonical catalog metadata without live joins', () => {
    const benchPress = findExercise('barbell-bench-press')!;
    const catalogExercise = {
      ...benchPress,
      primaryMuscles: [...benchPress.primaryMuscles],
    };
    const snapshot = createExercise(catalogExercise, () => 'snapshot-id');

    catalogExercise.name = 'Renamed later';
    catalogExercise.primaryMuscles[0] = 'triceps';

    expect(snapshot).toMatchObject({
      libraryId: 'barbell-bench-press',
      name: 'Barbell Bench Press',
      muscle: 'Chest',
    });
  });

  it('matches legacy history ids against canonical catalog ids', () => {
    expect(exerciseIdsMatch('bench', 'barbell-bench-press')).toBe(true);
    expect(exerciseIdsMatch('bench', 'barbell-back-squat')).toBe(false);
    expect(exerciseIdsMatch('custom-id', 'custom-id')).toBe(true);
  });

  it('starts isolated snapshots and leaves the catalog untouched', () => {
    const one = start(),
      two = start();
    expect(one.id).not.toBe(two.id);
    expect(one.exercises[0].sets[0].id).not.toBe(two.exercises[0].sets[0].id);
    expect(totalSetCount(one)).toBe(12);
    expect(one.restEndsAt).toBeUndefined();
    const edited = updateSet(one, 0, 0, { weight: '50' });
    expect(one.exercises[0].sets[0].weight).toBe('');
    expect(edited.exercises[0].sets[0].weight).toBe('50');
  });
  it.each([
    ['', '10'],
    ['-1', '10'],
    ['Infinity', '10'],
    ['50', '0'],
    ['50', '1.5'],
    ['50', '-2'],
    ['1e2', '10'],
    ['0x10', '10'],
  ])('rejects invalid completion %s × %s', (weight, reps) => {
    const session = updateSet(start(), 0, 0, { weight, reps });
    expect(() => toggleSet(session, 0, 0)).toThrow();
    expect(completedSetCount(session)).toBe(0);
  });
  it('accepts bodyweight zero and decimal comma, and only counts completed sets', () => {
    expect(setInputIsValid({ id: 'a', weight: '0', reps: '10' })).toBe(true);
    const logged = logSet();
    expect(logged.exercises[0].sets[0].weight).toBe('80.5');
    expect(volume(logged)).toBe(805);
    expect(updateSet(logged, 0, 0, { weight: '999' })).toEqual(logged);
    const undone = toggleSet(logged, 0, 0).session;
    expect(volume(undone)).toBe(0);
    expect(undone.restEndsAt).toBeUndefined();
  });
  it('advances only after the last set, wraps skipped exercises, and stops resting at the end', () => {
    let session = start();
    session = logSet(session, 0, 0);
    expect(session.currentExerciseIndex).toBe(0);
    session = logSet(logSet(session, 0, 1), 0, 2);
    expect(session.currentExerciseIndex).toBe(1);
    for (const ei of [3, 2, 1]) {
      session = setCurrentExercise(session, ei);
      for (let si = 0; si < 3; si++) session = logSet(session, ei, si);
      if (ei === 3) expect(session.currentExerciseIndex).toBe(1);
    }
    expect(workoutIsComplete(session)).toBe(true);
    expect(session.restEndsAt).toBeUndefined();
    expect(volume(session)).toBe(9660);
  });
  it('uses absolute time across navigation, backgrounding and restart', () => {
    let session = logSet();
    expect(remainingRestSeconds(session, 32000)).toBe(60);
    expect(remainingRestSeconds(session, 1_000_000)).toBe(0);
    session = extendRest(session, 15, 32000);
    expect(remainingRestSeconds(session, 32000)).toBe(75);
    session = extendRest(session, -15, 32000);
    expect(remainingRestSeconds(session, 32000)).toBe(60);
    expect(remainingRestSeconds(restartRest(session, 32000), 32000)).toBe(90);
    expect(remainingRestSeconds(skipRest(session), 32000)).toBe(0);
  });
  it('copies previous set defaults without completion and keeps at least one set', () => {
    let session = logSet(start(), 0, 2);
    session = addSet(session, 0);
    expect(session.exercises[0].sets[3]).toMatchObject({
      weight: '80.5',
      reps: '10',
    });
    expect(session.exercises[0].sets[3].completedAt).toBeUndefined();
    for (let i = 0; i < 6; i++) session = removeSet(session, 0, 0);
    expect(session.exercises[0].sets).toHaveLength(1);
    expect(
      appendExercise(session, findExercise('barbell-bench-press')!).exercises,
    ).toHaveLength(5);
  });
  it('prevents empty finish and supports intentional partial finish', () => {
    expect(() => finishWorkout(start())).toThrow();
    expect(finishWorkout(logSet(), 6000)).toMatchObject({
      finishedAt: 6000,
      restEndsAt: undefined,
    });
  });
});

describe('local persistence and migration', () => {
  it('loads schema-v1 legacy template ids without rewriting storage', async () => {
    const storage = memoryStorage();
    const raw = JSON.stringify({
      schemaVersion: 1,
      activeWorkout: null,
      history: [],
      templates: [
        { id: 'legacy', name: 'Legacy', exerciseIds: ['bench', 'row'] },
      ],
    });
    storage.values.set(STATE_KEY, raw);

    const state = await new WorkoutRepository(storage).load();

    expect(state.templates[0].exerciseIds).toEqual(['bench', 'row']);
    expect(storage.values.get(STATE_KEY)).toBe(raw);
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('rejects a template when none of its exercise ids are available', async () => {
    const storage = memoryStorage();
    const store = new WorkoutStore(new WorkoutRepository(storage));
    await store.load();

    expect(() =>
      store.start({
        id: 'unknown',
        name: 'Unknown',
        exerciseIds: ['not-in-catalog'],
      }),
    ).toThrow('This template has no available exercises.');
    expect(store.getSnapshot().data.activeWorkout).toBeNull();
  });

  it('runs Start → sets → rest → next → Finish → reload → History/Progress', async () => {
    const storage = memoryStorage();
    const store = new WorkoutStore(new WorkoutRepository(storage));
    await store.load();
    store.start(defaultTemplates[0]);
    for (let ei = 0; ei < 4; ei++) {
      for (let si = 0; si < 3; si++) {
        store.updateWorkout((session) => logSet(session, ei, si));
      }
    }
    const result = await store.finish();
    expect(result).toBeDefined();
    const restored = new WorkoutStore(new WorkoutRepository(storage));
    await restored.load();
    expect(restored.getSnapshot().data.activeWorkout).toBeNull();
    expect(restored.getSnapshot().data.history).toHaveLength(1);
    expect(volume(restored.getSnapshot().data.history[0])).toBe(9660);
  });
  it('records only entered sets when removing an exercise and keeps the current workout active after reload', async () => {
    const storage = memoryStorage();
    let store = new WorkoutStore(new WorkoutRepository(storage));
    await store.load();
    store.start(defaultTemplates[0]);
    store.updateWorkout((session) =>
      updateSet(logSet(session), 0, 1, { weight: '50,5', reps: '8' }),
    );
    const { activeWorkout } = store.getSnapshot().data;
    const first = activeWorkout!.exercises[0];
    const nextId = activeWorkout!.exercises[1].id;
    expect(
      await store.removeExercises(activeWorkout!.id, [first.id], true),
    ).toBe(true);

    store = new WorkoutStore(new WorkoutRepository(storage));
    await store.load();
    const data = store.getSnapshot().data;
    expect(data.activeWorkout?.id).toBe(activeWorkout!.id);
    expect(
      data.activeWorkout?.exercises[data.activeWorkout.currentExerciseIndex].id,
    ).toBe(nextId);
    expect(data.activeWorkout?.restEndsAt).toBeUndefined();
    expect(data.history).toHaveLength(1);
    expect(data.history[0].id).not.toBe(activeWorkout!.id);
    expect(
      data.history[0].exercises.flatMap((exercise) =>
        exercise.sets.map((set) => [set.weight, set.reps]),
      ),
    ).toEqual([
      ['80.5', '10'],
      ['50.5', '8'],
    ]);
    expect(completedSetCount(data.history[0])).toBe(2);

    expect(
      await store.removeExercises(activeWorkout!.id, [nextId], false),
    ).toBe(true);
    expect(store.getSnapshot().data.history).toHaveLength(1);
    expect(
      store
        .getSnapshot()
        .data.activeWorkout?.exercises.some((entry) => entry.id === nextId),
    ).toBe(false);
  });

  it('restores active inputs and timer after reopening', async () => {
    const storage = memoryStorage(),
      repo = new WorkoutRepository(storage);
    const state = await repo.load();
    await repo.save({ ...state, activeWorkout: logSet() });
    const restored = await new WorkoutRepository(storage).load();
    expect(restored.activeWorkout?.exercises[0].sets[0].weight).toBe('80.5');
    expect(remainingRestSeconds(restored.activeWorkout!, 32000)).toBe(60);
  });
  it('migrates legacy sets/templates and retains the original keys', async () => {
    const storage = memoryStorage();
    const legacy = {
      id: 'old',
      name: 'Old workout',
      startedAt: 1000,
      exercises: [
        {
          id: 'bench-12',
          name: 'Bench',
          muscle: 'Chest',
          sets: [{ id: 's', weight: '50', reps: '8', done: true }],
        },
      ],
    };
    storage.values.set('fitflow_active', JSON.stringify(legacy));
    storage.values.set(
      'fitflow_templates',
      JSON.stringify([
        { id: 'custom', name: 'Custom', exerciseIds: ['bench'] },
      ]),
    );
    const state = await new WorkoutRepository(storage).load();
    expect(volume(state.activeWorkout!)).toBe(400);
    expect(state.templates[0].name).toBe('Custom');
    expect(storage.values.has('fitflow_active')).toBe(true);
    expect(storage.values.has(STATE_KEY)).toBe(true);
  });
  it('recovers only a legacy interrupted finish without duplicating history', async () => {
    const storage = memoryStorage();
    const active = {
      id: 'interrupted',
      name: 'Old workout',
      startedAt: 1000,
      exercises: [
        {
          id: 'bench-12',
          name: 'Bench',
          muscle: 'Chest',
          sets: [{ id: 's', weight: '50', reps: '8', done: true }],
        },
      ],
    };
    storage.values.set('fitflow_active', JSON.stringify(active));
    storage.values.set(
      'fitflow_history',
      JSON.stringify([{ ...active, finishedAt: 2000 }]),
    );
    const state = await new WorkoutRepository(storage).load();
    expect(state.activeWorkout).toBeNull();
    expect(state.history).toHaveLength(1);
    expect(state.history[0].finishedAt).toBe(2000);
  });
  it.each([
    'invalid JSON',
    '{"schemaVersion":2}',
    JSON.stringify({
      schemaVersion: 1,
      activeWorkout: { id: 'bad', name: 'Bad', startedAt: 1, exercises: [{}] },
      history: [],
      templates: [],
    }),
  ])('keeps unreadable data intact and blocks edits: %s', async (raw) => {
    const storage = memoryStorage();
    storage.values.set(STATE_KEY, raw);
    const store = new WorkoutStore(new WorkoutRepository(storage));
    await store.load();
    store.start(defaultTemplates[0]);
    expect(store.getSnapshot().ready).toBe(false);
    expect(store.getSnapshot().error).not.toBe('');
    expect(storage.values.get(STATE_KEY)).toBe(raw);
    expect(storage.setItem).not.toHaveBeenCalled();
  });
  it.each([
    [
      'duplicate history ids',
      (() => {
        const completed = finishWorkout(logSet(), 6000);
        return { activeWorkout: null, history: [completed, completed] };
      })(),
    ],
    [
      'an unfinished history entry',
      { activeWorkout: null, history: [logSet()] },
    ],
    [
      'a finished active workout',
      { activeWorkout: finishWorkout(logSet(), 6000), history: [] },
    ],
    [
      'an out-of-range current exercise',
      {
        activeWorkout: { ...logSet(), currentExerciseIndex: 99 },
        history: [],
      },
    ],
    [
      'a missing rest duration',
      (() => {
        const { restDurationSeconds: _removed, ...activeWorkout } = logSet();
        return { activeWorkout, history: [] };
      })(),
    ],
    [
      'a missing exercise library id',
      (() => {
        const activeWorkout = logSet();
        const { libraryId: _removed, ...exercise } = activeWorkout.exercises[0];
        return {
          activeWorkout: {
            ...activeWorkout,
            exercises: [exercise, ...activeWorkout.exercises.slice(1)],
          },
          history: [],
        };
      })(),
    ],
  ])('preserves strict v1 data containing %s', async (_label, sessions) => {
    const storage = memoryStorage();
    const raw = JSON.stringify({
      schemaVersion: 1,
      ...sessions,
      templates: defaultTemplates,
    });
    storage.values.set(STATE_KEY, raw);
    const store = new WorkoutStore(new WorkoutRepository(storage));
    await store.load();
    expect(store.getSnapshot().ready).toBe(false);
    expect(storage.values.get(STATE_KEY)).toBe(raw);
    expect(storage.setItem).not.toHaveBeenCalled();
  });
  it('keeps a workout after failed Finish, retries safely and never duplicates it', async () => {
    const storage = memoryStorage(),
      store = new WorkoutStore(new WorkoutRepository(storage));
    await store.load();
    store.start(defaultTemplates[0]);
    store.updateWorkout((session) => logSet(session));
    await new Promise((resolve) => setTimeout(resolve, 0));
    jest.mocked(storage.setItem).mockRejectedValueOnce(new Error('disk full'));
    expect(await store.finish()).toBeUndefined();
    expect(store.getSnapshot().data.activeWorkout).not.toBeNull();
    expect(store.getSnapshot().data.history).toHaveLength(0);
    expect(store.getSnapshot().error).toContain('could not be saved');
    const [first, second] = await Promise.all([store.finish(), store.finish()]);
    expect(first).toBeDefined();
    expect(second).toBeUndefined();
    expect(store.getSnapshot().data.history).toHaveLength(1);
  });
  it('serializes slow edits before Finish instead of resurrecting active workouts', async () => {
    const storage = memoryStorage(),
      repo = new WorkoutRepository(storage);
    const state = await repo.load();
    let release!: () => void;
    jest.mocked(storage.setItem).mockImplementationOnce(async (key, value) => {
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      storage.values.set(key, value);
    });
    const active = logSet();
    const first = repo.save({ ...state, activeWorkout: active });
    await Promise.resolve();
    await Promise.resolve();
    const second = repo.save({
      ...state,
      activeWorkout: null,
      history: [finishWorkout(active)],
    });
    release();
    await Promise.all([first, second]);
    expect((await repo.load()).activeWorkout).toBeNull();
    expect((await repo.load()).history).toHaveLength(1);
  });
  it('does not replace an active workout and retries a failed draft save', async () => {
    const storage = memoryStorage(),
      store = new WorkoutStore(new WorkoutRepository(storage));
    await store.load();
    store.start(defaultTemplates[0]);
    expect(() => store.start(defaultTemplates[1])).toThrow('Resume');
    await new Promise((resolve) => setTimeout(resolve, 0));
    jest.mocked(storage.setItem).mockRejectedValueOnce(new Error('disk full'));
    store.updateWorkout((session) => logSet(session));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(store.getSnapshot().error).toContain('not saved');
    await store.retry();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(store.getSnapshot().error).toBe('');
    expect(
      volume((await new WorkoutRepository(storage).load()).activeWorkout!),
    ).toBe(805);
  });
});

it('keeps an uncommitted set out of progress and restores drafts on a cold load', async () => {
  const storage = memoryStorage();
  const repository = new WorkoutRepository(storage);
  const store = new WorkoutStore(repository);
  await store.load();
  store.start(defaultTemplates[0]);
  store.updateWorkout((session) =>
    updateSet(session, 0, 0, { weight: '60', reps: '10' }),
  );
  await store.waitForPendingWrites();
  const cold = new WorkoutStore(new WorkoutRepository(storage));
  await cold.load();
  const active = cold.getSnapshot().data.activeWorkout!;
  expect(active.exercises[0].sets[0]).toMatchObject({
    weight: '60',
    reps: '10',
  });
  expect(completedSetCount(active)).toBe(0);
  const marker = { id: active.exercises[0].sets[0].id, index: 1 };
  jest.mocked(storage.setItem).mockRejectedValueOnce(new Error('disk full'));
  const attempt = store.recordSet(
    (session) => toggleSet(session, 0, 0).session,
    marker,
  );
  expect(completedSetCount(store.getSnapshot().data.activeWorkout!)).toBe(0);
  expect(await attempt).toBe(false);
  expect(store.getSnapshot().pendingSet).toEqual(marker);
  expect(completedSetCount((await repository.load()).activeWorkout!)).toBe(0);
  await store.retry();
  expect(store.getSnapshot().pendingSet).toBeNull();
  expect(completedSetCount((await repository.load()).activeWorkout!)).toBe(1);
  jest.mocked(storage.setItem).mockRejectedValueOnce(new Error('disk full'));
  expect(await store.finish()).toBeUndefined();
  expect(store.getSnapshot().data.history).toHaveLength(0);
  expect((await repository.load()).activeWorkout?.id).toBe(active.id);
  const [first, second] = await Promise.all([store.finish(), store.finish()]);
  expect(first?.id).toBe(active.id);
  expect(second).toBeUndefined();
  const restored = await new WorkoutRepository(storage).load();
  expect(restored.activeWorkout).toBeNull();
  expect(restored.history.map((item) => item.id)).toEqual([active.id]);
});

it('restores plan provenance and manual drafts, and V7 skips unentered planned sets', async () => {
  const storage = memoryStorage();
  const repository = new WorkoutRepository(storage);
  const template = {
    id: 'explicit-plan',
    name: 'Plan',
    exerciseIds: ['barbell-bench-press'],
    plannedExercises: [
      {
        exerciseId: 'barbell-bench-press',
        sets: 3,
        plannedSets: [
          { id: 'p1', weight: '70', reps: '10' },
          { id: 'p2', weight: '70' },
          { id: 'p3', weight: '70', reps: '8' },
        ],
      },
    ],
  };
  const active = startWorkout(template, exerciseLibrary, 1000);
  const exercise = active.exercises[0];
  const prior = { id: 'previous-set', weight: '60', reps: '12' };
  expect(suggestSetValues(exercise, exercise.sets[0], prior)).toEqual({
    weight: '70',
    reps: '10',
  });
  expect(suggestSetValues(exercise, exercise.sets[1], prior)).toEqual({
    weight: '70',
    reps: '12',
  });
  expect(() =>
    removeWorkoutExercises(active, [exercise.id], true, 'blank'),
  ).toThrow('No entered sets');
  expect(
    saveSetEntry(
      active,
      active.id,
      exercise.id,
      exercise.sets[0].id,
      exercise.sets[0],
    ),
  ).toBe(active);

  const manual = saveSetEntry(
    active,
    active.id,
    exercise.id,
    exercise.sets[1].id,
    { weight: '62,75', reps: '9' },
  );
  const completed = toggleSet(manual, 0, 2, 1500).session;
  await repository.save({
    schemaVersion: 1,
    activeWorkout: completed,
    history: [],
    templates: [],
  });
  const loaded = (await new WorkoutRepository(storage).load()).activeWorkout!;
  const restored = loaded.exercises[0];
  expect(restored.sets[0]).toMatchObject({
    plannedWeight: true,
    plannedReps: true,
  });
  expect(restored.sets[0].entered).toBeUndefined();
  expect(suggestSetValues(restored, restored.sets[0], prior)).toEqual({
    weight: '70',
    reps: '10',
  });
  expect(suggestSetValues(restored, restored.sets[1], prior)).toEqual({
    weight: '62.75',
    reps: '9',
  });
  const { recorded } = removeWorkoutExercises(
    loaded,
    [exercise.id],
    true,
    'v7',
    2000,
  );
  expect(
    recorded?.exercises[0].sets.map((set) => [
      set.weight,
      set.reps,
      set.completedAt,
    ]),
  ).toEqual([
    ['62.75', '9', 2000],
    ['70', '8', 1500],
  ]);
  expect(recorded?.id).toBe(
    'fragment:' + encodeURIComponent(active.id) + ':v7',
  );

  // A prior app version saved the draft without the new plan flags.
  const legacy = {
    ...loaded,
    exercises: [
      {
        ...restored,
        sets: [
          {
            id: 'old-draft',
            weight: '61.25',
            reps: '10',
            entered: true as const,
          },
        ],
      },
    ],
  };
  await repository.save({
    schemaVersion: 1,
    activeWorkout: legacy,
    history: [],
    templates: [],
  });
  const oldExercise = (await new WorkoutRepository(storage).load())
    .activeWorkout!.exercises[0];
  expect(suggestSetValues(oldExercise, oldExercise.sets[0], prior)).toEqual({
    weight: '61.25',
    reps: '10',
  });
});

it('prefers a rep target on both sides and retains explicit or manual side values', () => {
  const entry = findExercise('one-arm-dumbbell-row')!;
  const exercise = createExercise({ ...entry, perSide: true }, undefined, {
    exerciseId: entry.id,
    sets: 1,
    target: {
      kind: 'authored',
      repMin: 8,
      repMax: 12,
      restMin: 30,
      restMax: 60,
      perSide: true,
    },
  });
  const old = { id: 'old', weight: '50', reps: '12', otherSideReps: '11' };
  expect(suggestSetValues(exercise, exercise.sets[0], old)).toEqual({
    weight: '50',
    reps: '8',
    otherSideReps: '8',
  });
  expect(
    suggestSetValues(
      exercise,
      { ...exercise.sets[0], reps: '10', plannedReps: true },
      old,
    ),
  ).toEqual({ weight: '50', reps: '10', otherSideReps: '10' });
  expect(
    suggestSetValues(
      exercise,
      {
        ...exercise.sets[0],
        entered: true,
        weight: '55',
        reps: '7',
        otherSideReps: '6',
      },
      old,
    ),
  ).toEqual({ weight: '55', reps: '7', otherSideReps: '6' });
});
