import type {
  ExerciseGroupSnapshot,
  PlannedExercise,
  WorkoutExercise,
} from './workout-model';
import { getCatalogVariant } from './exercise-catalog-adapter';
import { canonicalExerciseId } from './exercise-library';
import {
  validExerciseGroup,
  validPlannedExerciseShape,
} from './planned-exercise';

type Member = {
  exerciseGroup?: ExerciseGroupSnapshot;
  exerciseId?: string;
  libraryId?: string;
};

/** Historical reads validate frozen structure, independently of today's catalog. */
export function validGroupSequence(entries: readonly Member[]): boolean {
  const groups = new Map<string, ExerciseGroupSnapshot>();
  const closed = new Set<string>();
  const identities = new Set<string>();
  let previous: string | undefined;
  for (const entry of entries) {
    const group = entry.exerciseGroup;
    if (group !== undefined && !validExerciseGroup(group)) return false;
    if (previous && previous !== group?.id) closed.add(previous);
    previous = group?.id;
    if (!group) continue;
    if (closed.has(group.id)) return false;
    const known = groups.get(group.id);
    if (
      known &&
      (known.familyId !== group.familyId || known.name !== group.name)
    )
      return false;
    groups.set(group.id, group);
    const raw = entry.exerciseId ?? entry.libraryId;
    if (!raw) return false;
    const key = group.id + '\0' + (canonicalExerciseId(raw) ?? raw);
    if (identities.has(key)) return false;
    identities.add(key);
  }
  return true;
}

export function validateExerciseGroupMembers(
  entries: readonly PlannedExercise[],
): boolean {
  return (
    entries.every(validPlannedExerciseShape) &&
    validGroupSequence(entries) &&
    entries.every((entry) => {
      if (!entry.exerciseGroup) return true;
      const variant = getCatalogVariant(entry.exerciseId);
      return (
        variant?.configuration === 'specific' &&
        variant.familyId === entry.exerciseGroup.familyId
      );
    })
  );
}

export function projectExerciseGroups(
  exercises: readonly WorkoutExercise[],
): { groupId: string; name: string; indices: number[] }[] {
  const result: { groupId: string; name: string; indices: number[] }[] = [];
  exercises.forEach((e, index) => {
    const last = result.at(-1);
    if (
      e.exerciseGroup &&
      last?.groupId === e.exerciseGroup.id &&
      exercises[index - 1]?.exerciseGroup?.id === e.exerciseGroup.id &&
      last.indices.at(-1) === index - 1
    )
      last.indices.push(index);
    else
      result.push({
        groupId: e.exerciseGroup?.id ?? e.id,
        name: e.exerciseGroup?.name ?? e.name,
        indices: [index],
      });
  });
  return result;
}

/** Moving a child means moving its whole station; destinations never split one. */
export function moveGroupedItems<
  T extends { exerciseGroup?: ExerciseGroupSnapshot },
>(items: readonly T[], from: number, target: number): T[] {
  if (from === target || !items[from] || !items[target]) return [...items];
  const source = items[from].exerciseGroup?.id;
  const moving = items
    .map((e, i) => ({ e, i }))
    .filter(({ e, i }) =>
      source ? e.exerciseGroup?.id === source : i === from,
    );
  if (moving.some(({ i }) => i === target)) return [...items];
  const dest = items[target].exerciseGroup?.id;
  const targets = items
    .map((e, i) => ({ e, i }))
    .filter(({ e, i }) => (dest ? e.exerciseGroup?.id === dest : i === target));
  const boundary = from < target ? targets.at(-1)!.i + 1 : targets[0].i;
  const removed = new Set(moving.map((v) => v.i));
  const insertion = boundary - moving.filter((v) => v.i < boundary).length;
  const result = items.filter((_, i) => !removed.has(i));
  result.splice(insertion, 0, ...moving.map((v) => v.e));
  return result;
}

/** One explicit edit replaces its slot/station, never an outside occurrence. */
export function applyEquipmentGroupDraft<
  T extends {
    name: string;
    exerciseIds: string[];
    plannedExercises?: PlannedExercise[];
  },
>(
  draft: T,
  originalId: string,
  entries: readonly PlannedExercise[],
  editing: boolean,
): T {
  const groupId = entries[0]?.exerciseGroup?.id;
  if (
    !groupId ||
    !entries.length ||
    entries.some((e) => e.exerciseGroup?.id !== groupId) ||
    !validateExerciseGroupMembers(entries)
  )
    throw Error('Invalid equipment group');
  const oldGroup = editing
    ? draft.plannedExercises?.find((e) => e.exerciseId === originalId)
        ?.exerciseGroup?.id
    : undefined;
  const replaced = new Set(
    editing
      ? oldGroup
        ? (draft.plannedExercises
            ?.filter((e) => e.exerciseGroup?.id === oldGroup)
            .map((e) => e.exerciseId) ?? [])
        : [originalId]
      : [],
  );
  if (editing && !draft.exerciseIds.includes(originalId))
    throw Error('Missing plan slot');
  const incoming = new Set(entries.map((e) => e.exerciseId));
  if (
    incoming.size !== entries.length ||
    draft.exerciseIds.some((id) => !replaced.has(id) && incoming.has(id))
  )
    throw Error('Duplicate exercise outside group');
  const insertion = editing
    ? draft.exerciseIds.findIndex((id) => replaced.has(id))
    : draft.exerciseIds.length;
  const exerciseIds = draft.exerciseIds.filter((id) => !replaced.has(id));
  exerciseIds.splice(insertion, 0, ...entries.map((e) => e.exerciseId));
  return {
    ...draft,
    exerciseIds,
    plannedExercises: [
      ...(draft.plannedExercises ?? []).filter(
        (e) => !replaced.has(e.exerciseId),
      ),
      ...JSON.parse(JSON.stringify(entries)),
    ],
  };
}

export function setNumberInGroup(
  session: Pick<import('./workout-model').WorkoutSession, 'exercises'>,
  exerciseIndex: number,
  setIndex: number,
): number {
  const group = session.exercises[exerciseIndex]?.exerciseGroup?.id;
  return (
    setIndex +
    1 +
    (group
      ? session.exercises
          .slice(0, exerciseIndex)
          .filter((e) => e.exerciseGroup?.id === group)
          .reduce((sum, e) => sum + e.sets.length, 0)
      : 0)
  );
}

/** Presentation only: synthetic rows must never be persisted or counted as data. */
export function projectProgramSession(
  session: import('./workout-model').WorkoutSession,
): import('./workout-model').WorkoutSession {
  const groups = projectExerciseGroups(session.exercises);
  return {
    ...session,
    currentExerciseIndex: groups.findIndex((g) =>
      g.indices.includes(session.currentExerciseIndex),
    ),
    exercises: groups.map((g) => ({
      ...session.exercises[g.indices[0]],
      name: g.name,
      exerciseGroup: undefined,
      sets: g.indices.flatMap((i) => session.exercises[i].sets),
    })),
  };
}

export function applyProgramProjection(
  session: import('./workout-model').WorkoutSession,
  transform: (
    session: import('./workout-model').WorkoutSession,
  ) => import('./workout-model').WorkoutSession,
): import('./workout-model').WorkoutSession {
  if (!session.exercises.some((e) => e.exerciseGroup))
    return transform(session);
  const groups = projectExerciseGroups(session.exercises);
  const byId = new Map(
    groups.map((g) => [session.exercises[g.indices[0]].id, g]),
  );
  const projected = projectProgramSession(session),
    next = transform(projected);
  if (
    next.exercises.length !== groups.length ||
    new Set(next.exercises.map((e) => e.id)).size !== groups.length ||
    next.exercises.some((e) => !byId.has(e.id))
  )
    return session;
  const exercises = next.exercises.flatMap((e) =>
    byId.get(e.id)!.indices.map((i) => session.exercises[i]),
  );
  const selected = byId.get(next.exercises[next.currentExerciseIndex]?.id);
  if (!selected) return session;
  const current = session.exercises[session.currentExerciseIndex];
  const selectedIndex = selected.indices.includes(session.currentExerciseIndex)
    ? session.currentExerciseIndex
    : (selected.indices.find((i) =>
        session.exercises[i].sets.some((s) => s.completedAt === undefined),
      ) ?? selected.indices[0]);
  const selectedId = selected.indices.includes(session.currentExerciseIndex)
    ? current.id
    : session.exercises[selectedIndex].id;
  return {
    ...session,
    exercises,
    currentExerciseIndex: exercises.findIndex((e) => e.id === selectedId),
  };
}
