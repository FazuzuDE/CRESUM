import { projectMuscleParticipation } from '../muscle-participation';
import { projectProgressAnalytics } from '../progress-analytics';
import {
  projectExerciseGroups,
  validateExerciseGroupMembers,
  applyEquipmentGroupDraft,
  projectProgramSession,
  applyProgramProjection,
  setNumberInGroup,
} from '../exercise-groups';
import {
  appendExerciseGroup,
  completedSetCount,
  totalSetCount,
  startWorkout,
  moveWorkoutExercise,
  addSet,
} from '../workout-engine';
import { templateDetails } from '../home-dashboard';
import { volume } from '../workout-metrics';
import { previousEntry } from '../set-entry';
import { exerciseLibrary } from '../exercise-library';
import { validateTemplateDraft } from '../workout-templates';
import { WorkoutStore } from '../workout-store';
import { WorkoutRepository } from '../workout-repository';
import type { PlannedExercise } from '../workout-model';

const ids = [
  'lat-pulldown-close-neutral-ergonomic-handle',
  'lat-pulldown-close-neutral-v-handle',
  'lat-pulldown-wide-pronated-bar',
];
const group = {
  id: 'station-one',
  familyId: 'lat-pulldown',
  name: 'Lat Pulldown',
};
const entries = (): PlannedExercise[] =>
  ids.map((exerciseId, i) => ({
    exerciseId,
    sets: 2,
    exerciseGroup: { ...group },
    plannedSets: [
      { id: `${i}-a`, weight: String(45 - i * 5), reps: '12' },
      { id: `${i}-b`, weight: String(42 - i * 5), reps: '10' },
    ],
  }));
function session() {
  let n = 0;
  return startWorkout(
    {
      id: 'plan',
      name: 'Pull',
      exerciseIds: [...ids],
      plannedExercises: entries(),
    },
    exerciseLibrary,
    100,
    () => `row-${++n}`,
  );
}

it('materializes six prescribed rows and projects one station without pooling identities', () => {
  const s = session();
  expect(s.exercises.flatMap((e) => e.sets)).toHaveLength(6);
  expect(s.exercises.map((e) => e.libraryId)).toEqual(ids);
  expect(s.exercises[0].sets.map((v) => [v.weight, v.reps])).toEqual([
    ['45', '12'],
    ['42', '10'],
  ]);
  expect(projectExerciseGroups(s.exercises)).toEqual([
    { groupId: 'station-one', name: 'Lat Pulldown', indices: [0, 1, 2] },
  ]);
  const plan = entries();
  s.exercises[0].exerciseGroup!.name = 'Edited';
  expect(plan[0].exerciseGroup?.name).toBe('Lat Pulldown');
});

it('rejects mismatched counts, duplicate preset IDs and inconsistent/mixed/noncontiguous groups', () => {
  expect(validateExerciseGroupMembers(entries())).toBe(true);
  const wrong = entries();
  wrong[1].exerciseGroup!.familyId = 'bench-press';
  expect(validateExerciseGroupMembers(wrong)).toBe(false);
  const noncontiguous = entries();
  noncontiguous[1] = { exerciseId: 'barbell-bench-press', sets: 2 };
  expect(validateExerciseGroupMembers(noncontiguous)).toBe(false);
  for (const change of [
    (e: PlannedExercise) => {
      e.sets = 3;
    },
    (e: PlannedExercise) => {
      e.plannedSets![1].id = e.plannedSets![0].id;
    },
  ]) {
    const p = entries();
    change(p[0]);
    expect(
      validateTemplateDraft({
        name: 'Pull',
        exerciseIds: [...ids],
        plannedExercises: p,
      }).ok,
    ).toBe(false);
  }
});

it('appends to a matching block without rewriting completed rows and rejects an outside occurrence atomically', () => {
  const s = session();
  s.exercises[0].sets[0].completedAt = 120;
  const extra = {
    ...entries()[0],
    sets: 1,
    plannedSets: [{ id: 'extra', weight: '35', reps: '8' }],
  };
  let n = 100;
  const next = appendExerciseGroup(
    s,
    [extra],
    exerciseLibrary,
    () => `row-${++n}`,
  );
  expect(next.exercises).toHaveLength(3);
  expect(next.exercises[0].sets).toHaveLength(3);
  expect(next.exercises[0].sets[0]).toEqual(s.exercises[0].sets[0]);
  expect(s.exercises[0].sets).toHaveLength(2);
  const outside = session();
  delete outside.exercises[0].exerciseGroup;
  const before = JSON.stringify(outside);
  expect(() =>
    appendExerciseGroup(outside, [extra], exerciseLibrary),
  ).toThrow();
  expect(JSON.stringify(outside)).toBe(before);
});

it('moves the entire station and retains the exact current child', () => {
  const s = session();
  s.currentExerciseIndex = 1;
  const legacy = startWorkout(
    { id: 'other', name: 'Other', exerciseIds: ['barbell-bench-press'] },
    exerciseLibrary,
    100,
    () => 'standalone',
  );
  s.exercises.push(legacy.exercises[0]);
  const next = moveWorkoutExercise(s, s.exercises[0].id, 3);
  expect(next.exercises.map((e) => e.libraryId)).toEqual([
    'barbell-bench-press',
    ...ids,
  ]);
  expect(next.exercises[next.currentExerciseIndex].id).toBe(s.exercises[1].id);
});

it('keeps legacy defaults and never replaces an omitted weight with zero', () => {
  const p = entries();
  delete p[0].plannedSets![0].weight;
  const s = startWorkout(
    { id: 'p', name: 'P', exerciseIds: [...ids], plannedExercises: p },
    exerciseLibrary,
  );
  expect(s.exercises[0].sets[0].weight).toBe('');
  const legacy = startWorkout(
    {
      id: 'l',
      name: 'L',
      exerciseIds: [ids[0]],
      plannedExercises: [{ exerciseId: ids[0], sets: 2, weight: '50' }],
    },
    exerciseLibrary,
  );
  expect(legacy.exercises[0].sets.map((v) => [v.weight, v.reps])).toEqual([
    ['50', '10'],
    ['50', '10'],
  ]);
});

it('keeps the 20-set block limit while allowing legacy standalone logging', () => {
  let s = session();
  for (let i = 0; i < 25; i++) s = addSet(s, 0);
  expect(s.exercises[0].sets).toHaveLength(20);
});

it('keeps the original active workout when the atomic group save fails', async () => {
  const values = new Map<string, string>();
  let fail = false;
  const store = new WorkoutStore(
    new WorkoutRepository({
      getItem: async (key) => values.get(key) ?? null,
      setItem: async (key, value) => {
        if (fail) throw Error('disk full');
        values.set(key, value);
      },
    }),
  );
  await store.load();
  store.start({
    id: 'test',
    name: 'Test',
    exerciseIds: ['barbell-bench-press'],
  });
  await store.waitForPendingWrites();
  const before = store.getSnapshot().data.activeWorkout!;
  fail = true;
  const saved = await store.appendEquipmentGroup(entries(), before.id);
  expect(saved).toBe(false);
  expect(store.getSnapshot().data.activeWorkout).toEqual(before);
});

it('replaces an explicitly edited plan slot with one group without absorbing an outside occurrence', () => {
  const draft = {
    name: 'Pull',
    exerciseIds: ['barbell-bench-press', ids[0]],
    plannedExercises: [{ exerciseId: ids[0], sets: 2, weight: '50' }],
  };
  const next = applyEquipmentGroupDraft(draft, ids[0], entries(), true);
  expect(next.exerciseIds).toEqual(['barbell-bench-press', ...ids]);
  expect(validateTemplateDraft(next).ok).toBe(true);
  const outside = { ...draft, exerciseIds: [...draft.exerciseIds, ids[1]] };
  expect(() =>
    applyEquipmentGroupDraft(outside, ids[0], entries(), true),
  ).toThrow();
  expect(outside.exerciseIds).toEqual(['barbell-bench-press', ids[0], ids[1]]);
});

it('projects program navigation as one station while retaining exact child selection and order', () => {
  const s = session();
  s.currentExerciseIndex = 1;
  const separate = startWorkout(
    { id: 'x', name: 'X', exerciseIds: ['barbell-bench-press'] },
    exerciseLibrary,
    100,
    () => 'outside',
  );
  s.exercises.push(separate.exercises[0]);
  const projected = projectProgramSession(s);
  expect(projected.exercises).toHaveLength(2);
  expect(projected.exercises[0].sets).toHaveLength(6);
  expect(setNumberInGroup(s, 1, 0)).toBe(3);
  const moved = applyProgramProjection(s, (v: typeof s) =>
    moveWorkoutExercise(v, v.exercises[0].id, 1),
  );
  expect(
    moved.exercises.map((e: { libraryId: string }) => e.libraryId),
  ).toEqual(['barbell-bench-press', ...ids]);
  expect(moved.exercises[moved.currentExerciseIndex].id).toBe(
    s.exercises[1].id,
  );
});

it('counts one station/six factual sets and retains variant-specific prior performance', () => {
  const s = session();
  s.finishedAt = 1000;
  s.exercises.forEach((e) =>
    e.sets.forEach((row) => {
      row.completedAt = 500;
    }),
  );
  expect(
    projectMuscleParticipation([s], undefined, 'workout', 1000).totalSets,
  ).toBe(6);
  expect(projectProgressAnalytics([s]).estimatedOneRepMaxRecords).toHaveLength(
    3,
  );
  expect(completedSetCount(s)).toBe(6);
  expect(totalSetCount(s)).toBe(6);
  expect(volume(s)).toBe(
    s.exercises
      .flatMap((e) => e.sets)
      .reduce((sum, r) => sum + Number(r.weight) * Number(r.reps), 0),
  );
  expect(previousEntry([s], ids[0], 0)?.weight).toBe('45');
  expect(previousEntry([s], ids[1], 0)?.weight).toBe('40');
  const details = templateDetails({
    id: 'p',
    name: 'P',
    exerciseIds: ids,
    plannedExercises: entries(),
  });
  expect(details.stationCount).toBe(1);
  expect(details.availableCount).toBe(3);
  expect(details.plannedSetCount).toBe(6);
});

it('never absorbs an adjacent standalone snapshot whose ID happens to equal a group ID', () => {
  const s = session();
  const other = startWorkout(
    { id: 'p', name: 'P', exerciseIds: ['barbell-bench-press'] },
    exerciseLibrary,
    100,
    () => 'unique',
  );
  other.exercises[0].id = group.id;
  s.exercises.unshift(other.exercises[0]);
  expect(projectExerciseGroups(s.exercises).map((g) => g.indices)).toEqual([
    [0],
    [1, 2, 3],
  ]);
});
