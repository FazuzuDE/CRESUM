import { findExercise } from '@/lib/exercise-library';
import { catalogLabel } from '@/lib/i18n/catalog';
import { muscleLabel } from '@/lib/exercise-taxonomy';
import { localizedTechnique } from '@/lib/i18n/technique';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type {
  ExerciseGroupSnapshot,
  PlannedExercise,
} from '@/lib/workout-model';
import { equipmentPolicyFor } from '@/lib/exercise-equipment';
import {
  normalizePlannedWeight,
  validPlannedSets,
} from '@/lib/planned-exercise';
import { validateExerciseGroupMembers } from '@/lib/exercise-groups';
import { createWorkoutSnapshotId } from '@/lib/workout-snapshot-id';
import type { TechniquePhase } from '@/lib/exercise-technique';
import { colors, radius, spacing, typography } from '@/lib/theme';
import { AppButton } from './AppButton';
import { ExerciseEquipmentRow } from './ExerciseEquipmentRow';
import { ExerciseEquipmentSheet } from './ExerciseEquipmentSheet';
import { TechniqueArtwork } from './TechniqueArtwork';
import { TechniquePhaseControl } from './TechniquePhaseControl';
import { useEquipmentFocus } from './useEquipmentFocus';
import { useLocalization } from './LocalizationProvider';

type Values = { sets: string; weight: string; reps: string };
export type EquipmentCompositionDraft = {
  source?: PlannedExercise;
  selectedId: string;
  group: ExerciseGroupSnapshot;
  configurations: Record<string, Values>;
  entries: PlannedExercise[];
};
export function ExerciseGroupComposer({
  initialExerciseId,
  initialEntries = [],
  initialDraft,
  existingOutsideIds = [],
  busy = false,
  onApply,
  onCancel,
  onDraftChange,
  onDirty,
}: {
  initialExerciseId: string;
  initialEntries?: readonly PlannedExercise[];
  initialDraft?: EquipmentCompositionDraft;
  existingOutsideIds?: readonly string[];
  busy?: boolean;
  onApply: (entries: PlannedExercise[]) => Promise<boolean> | boolean;
  onCancel: () => void;
  onDraftChange?: (draft: EquipmentCompositionDraft) => void;
  onDirty?: () => void;
}) {
  const { t, locale } = useLocalization();
  const [draft, setDraft] = useState<EquipmentCompositionDraft>(() => {
    if (initialDraft) return initialDraft;
    const group = initialEntries.find((e) => e.exerciseGroup)
      ?.exerciseGroup ?? {
      id: createWorkoutSnapshotId(),
      familyId: 'lat-pulldown',
      name: t('equipment.stationName'),
    };
    const configurations: Record<string, Values> = {};
    for (const e of initialEntries)
      configurations[e.exerciseId] = {
        sets: String(e.sets),
        weight: e.plannedSets?.[0]?.weight ?? e.weight ?? '',
        reps: e.plannedSets?.[0]?.reps ?? (e.target ? '' : '10'),
      };
    const policy = equipmentPolicyFor(initialExerciseId);
    const entries = initialEntries
      .filter(
        (e) =>
          e.exerciseGroup ||
          policy?.choices.some((c) => c.variantId === e.exerciseId),
      )
      .map((e) => ({
        ...JSON.parse(JSON.stringify(e)),
        exerciseGroup: { ...group },
        plannedSets:
          e.plannedSets?.map((row) => ({ ...row })) ??
          Array.from({ length: e.sets }, () => ({
            id: createWorkoutSnapshotId(),
            ...(e.weight ? { weight: e.weight } : {}),
            ...(e.target ? {} : { reps: '10' }),
          })),
      }));
    const source = initialEntries.find(
      (e) =>
        e.exerciseId === initialExerciseId &&
        !e.exerciseGroup &&
        !policy?.choices.some((c) => c.variantId === e.exerciseId),
    );
    return {
      ...(source ? { source: JSON.parse(JSON.stringify(source)) } : {}),
      selectedId: initialExerciseId,
      group: { ...group },
      configurations,
      entries,
    };
  });
  const [open, setOpen] = useState(false),
    [phase, setPhase] = useState<TechniquePhase>('START'),
    [saving, setSaving] = useState(false);
  const [error, setError] = useState<
    'equipment.valuesError' | 'equipment.duplicate' | 'equipment.saveError' | ''
  >('');
  const focus = useEquipmentFocus(open);
  const policy = equipmentPolicyFor(draft.selectedId);
  const selectedExercise = findExercise(draft.selectedId);
  const guide = localizedTechnique(locale, draft.selectedId);
  const values = draft.configurations[draft.selectedId] ?? {
    sets: '3',
    weight: '',
    reps: '10',
  };
  const disabled = busy || saving;
  const change = (next: EquipmentCompositionDraft) => {
    setDraft(next);
    onDraftChange?.(next);
    onDirty?.();
    setError('');
  };
  const field = (key: keyof Values, value: string) =>
    change({
      ...draft,
      configurations: {
        ...draft.configurations,
        [draft.selectedId]: { ...values, [key]: value },
      },
    });
  const choose = (id: string) => {
    if (existingOutsideIds.includes(id)) {
      setError('equipment.duplicate');
      return;
    }
    change({
      ...draft,
      selectedId: id,
      configurations: {
        ...draft.configurations,
        [draft.selectedId]: { ...values },
        ...(!draft.configurations[id] && draft.source
          ? {
              [id]: {
                sets: String(draft.source.sets),
                weight:
                  draft.source.plannedSets?.[0]?.weight ??
                  draft.source.weight ??
                  '',
                reps:
                  draft.source.plannedSets?.[0]?.reps ??
                  (draft.source.target ? '' : '10'),
              },
            }
          : {}),
      },
    });
  };
  const add = () => {
    const count = Number(values.sets.trim()),
      weight = values.weight.trim()
        ? normalizePlannedWeight(values.weight)
        : undefined,
      reps = values.reps.trim();
    const existing = draft.entries.find(
      (e) => e.exerciseId === draft.selectedId,
    );
    if (existingOutsideIds.includes(draft.selectedId)) {
      setError('equipment.duplicate');
      return;
    }
    if (
      !policy?.choices.some((c) => c.variantId === draft.selectedId) ||
      !/^\d+$/.test(values.sets.trim()) ||
      !validPlannedSets(count) ||
      (existing?.sets ?? 0) + count > 20 ||
      weight === null ||
      (reps !== '' &&
        (!/^\d+$/.test(reps) || Number(reps) < 1 || Number(reps) > 1000))
    ) {
      setError('equipment.valuesError');
      return;
    }
    const preserveSourceRows =
      !existing &&
      draft.source?.plannedSets &&
      count === draft.source.sets &&
      values.weight ===
        (draft.source.plannedSets[0]?.weight ?? draft.source.weight ?? '') &&
      values.reps ===
        (draft.source.plannedSets[0]?.reps ??
          (draft.source.target ? '' : '10'));
    const rows = preserveSourceRows
      ? draft.source!.plannedSets!.map((row) => ({
          ...row,
          id: createWorkoutSnapshotId(),
        }))
      : Array.from({ length: count }, () => ({
          id: createWorkoutSnapshotId(),
          ...(weight === undefined ? {} : { weight }),
          ...(reps ? { reps } : {}),
        }));
    const entry: PlannedExercise = existing
      ? {
          ...existing,
          sets: existing.sets + count,
          plannedSets: [...(existing.plannedSets ?? []), ...rows],
        }
      : {
          exerciseId: draft.selectedId,
          ...(draft.source?.target
            ? { target: JSON.parse(JSON.stringify(draft.source.target)) }
            : {}),
          sets: count,
          exerciseGroup: { ...draft.group },
          plannedSets: rows,
        };
    change({
      ...draft,
      entries: existing
        ? draft.entries.map((e) =>
            e.exerciseId === entry.exerciseId ? entry : e,
          )
        : [...draft.entries, entry],
    });
  };
  const editRow = (
    exerciseId: string,
    rowId: string,
    key: 'weight' | 'reps',
    value: string,
  ) =>
    change({
      ...draft,
      entries: draft.entries.map((e) =>
        e.exerciseId !== exerciseId
          ? e
          : {
              ...e,
              plannedSets: e.plannedSets!.map((row) => {
                if (row.id !== rowId) return row;
                const next = { ...row };
                if (value.trim() === '') delete next[key];
                else next[key] = value;
                return next;
              }),
            },
      ),
    });
  const apply = async () => {
    const entries = draft.entries.map((e) => ({
      ...e,
      plannedSets: e.plannedSets?.map((s) => ({
        ...s,
        ...(s.weight === undefined
          ? {}
          : { weight: normalizePlannedWeight(s.weight) ?? s.weight }),
      })),
    }));
    if (!entries.length || !validateExerciseGroupMembers(entries)) {
      setError('equipment.valuesError');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (!(await onApply(entries))) setError('equipment.saveError');
    } catch {
      setError('equipment.saveError');
    } finally {
      setSaving(false);
    }
  };
  return (
    <View style={s.content}>
      {!policy && selectedExercise ? (
        <Text style={s.heading}>
          {catalogLabel(
            locale,
            'exercise',
            selectedExercise.id,
            selectedExercise.name,
          )}
        </Text>
      ) : null}
      <TechniqueArtwork imageKey={draft.selectedId} phase={phase} />
      <TechniquePhaseControl phase={phase} onChange={setPhase} />
      <ExerciseEquipmentRow
        exerciseId={draft.selectedId}
        focusRef={focus}
        onPress={disabled ? undefined : () => setOpen(true)}
      />
      {selectedExercise ? (
        <View>
          <Text style={s.label}>
            {t('muscle.primary')}:{' '}
            {selectedExercise.primaryMuscles
              .map((id) => catalogLabel(locale, 'muscle', id, muscleLabel(id)))
              .join(' · ')}
          </Text>
          <Text style={s.label}>
            {t('muscle.secondary')}:{' '}
            {selectedExercise.secondaryMuscles
              .map((id) => catalogLabel(locale, 'muscle', id, muscleLabel(id)))
              .join(' · ')}
          </Text>
          {guide?.checks[0] ? (
            <Text style={s.label}>{guide.checks[0]}</Text>
          ) : null}
        </View>
      ) : null}
      <Text accessibilityRole="header" style={s.heading}>
        {t('equipment.configureSets')}
      </Text>
      <View style={s.inputs}>
        <View style={s.field}>
          <Text style={s.label}>{t('editor.sets')}</Text>
          <TextInput
            accessibilityLabel={t('editor.sets')}
            value={values.sets}
            onChangeText={(v) => field('sets', v)}
            keyboardType="number-pad"
            editable={!disabled}
            style={s.input}
          />
        </View>
        <View style={s.field}>
          <Text style={s.label}>{t('workout.tableKg')}</Text>
          <TextInput
            accessibilityLabel={t('editor.weightLabel')}
            value={values.weight}
            onChangeText={(v) => field('weight', v)}
            keyboardType="decimal-pad"
            editable={!disabled}
            style={s.input}
          />
        </View>
        <View style={s.field}>
          <Text style={s.label}>{t('workout.tableReps')}</Text>
          <TextInput
            accessibilityLabel={t('equipment.plannedReps')}
            value={values.reps}
            onChangeText={(v) => field('reps', v)}
            keyboardType="number-pad"
            editable={!disabled}
            style={s.input}
          />
        </View>
      </View>
      <AppButton
        title={t('equipment.addSets')}
        secondary
        onPress={add}
        disabled={disabled}
      />
      {draft.entries.map((entry, index) => {
        const start = draft.entries
          .slice(0, index)
          .reduce((sum, e) => sum + e.sets, 0);
        return (
          <View key={entry.exerciseId} style={s.block}>
            {index > 0 ? (
              <Text style={s.label}>{t('equipment.changeAttachment')}</Text>
            ) : null}
            {!equipmentPolicyFor(entry.exerciseId) ? (
              <Text style={s.heading}>
                {catalogLabel(
                  locale,
                  'exercise',
                  entry.exerciseId,
                  findExercise(entry.exerciseId)?.name ?? entry.exerciseId,
                )}
              </Text>
            ) : null}
            <ExerciseEquipmentRow exerciseId={entry.exerciseId} />
            {(entry.plannedSets ?? []).map((row, i) => (
              <View key={row.id} style={s.inputs}>
                <Text style={s.number}>{start + i + 1}</Text>
                <TextInput
                  accessibilityLabel={t('equipment.rowWeight', {
                    index: start + i + 1,
                  })}
                  value={row.weight ?? ''}
                  onChangeText={(v) =>
                    editRow(entry.exerciseId, row.id, 'weight', v)
                  }
                  keyboardType="decimal-pad"
                  editable={!disabled}
                  style={[s.input, s.field]}
                />
                <TextInput
                  accessibilityLabel={t('equipment.rowReps', {
                    index: start + i + 1,
                  })}
                  value={row.reps ?? ''}
                  onChangeText={(v) =>
                    editRow(entry.exerciseId, row.id, 'reps', v)
                  }
                  keyboardType="number-pad"
                  editable={!disabled}
                  style={[s.input, s.field]}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('equipment.removeRow', {
                    index: start + i + 1,
                  })}
                  disabled={disabled || entry.sets <= 1}
                  onPress={() =>
                    change({
                      ...draft,
                      entries: draft.entries.map((e) =>
                        e.exerciseId !== entry.exerciseId
                          ? e
                          : {
                              ...e,
                              sets: e.sets - 1,
                              plannedSets: e.plannedSets!.filter(
                                (r) => r.id !== row.id,
                              ),
                            },
                      ),
                    })
                  }
                  style={s.remove}
                >
                  <Text style={s.removeText}>−</Text>
                </Pressable>
              </View>
            ))}
            <AppButton
              title={t('equipment.removeBlock')}
              secondary
              presentation="text"
              disabled={disabled}
              onPress={() =>
                change({
                  ...draft,
                  entries: draft.entries.filter(
                    (e) => e.exerciseId !== entry.exerciseId,
                  ),
                })
              }
            />
          </View>
        );
      })}
      {error ? (
        <Text accessibilityRole="alert" style={s.error}>
          {t(error)}
        </Text>
      ) : null}
      <AppButton
        title={t('equipment.addGroup')}
        disabled={disabled || !draft.entries.length}
        onPress={() => void apply()}
      />
      <AppButton
        title={t('equipment.cancel')}
        secondary
        disabled={disabled}
        onPress={onCancel}
      />
      {open && policy ? (
        <ExerciseEquipmentSheet
          policy={policy}
          selectedVariantId={draft.selectedId}
          onSelect={choose}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </View>
  );
}
const s = StyleSheet.create({
  content: { gap: spacing.sm },
  heading: { ...typography.headline, color: colors.textPrimary },
  inputs: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  field: { flex: 1, minWidth: 0 },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xxs,
  },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.sm,
    minHeight: 48,
    padding: spacing.xs,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  block: {
    backgroundColor: colors.surfaceSubtle,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  number: { ...typography.body, color: colors.textSecondary, width: 24 },
  remove: {
    width: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: { ...typography.title2, color: colors.danger },
  error: { ...typography.footnote, color: colors.danger },
});
