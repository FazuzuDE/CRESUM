import {
  ExerciseGroupComposer,
  type EquipmentCompositionDraft,
} from './ExerciseGroupComposer';
import { createWorkoutSnapshotId } from '@/lib/workout-snapshot-id';
import type { PlannedSet, WorkoutTemplate } from '@/lib/workout-model';
import { applyEquipmentGroupDraft } from '@/lib/exercise-groups';
import { useRef, useState } from 'react';
import { ExerciseEquipmentRow } from './ExerciseEquipmentRow';
import { ExerciseEquipmentSheet } from './ExerciseEquipmentSheet';
import { TechniqueArtwork } from './TechniqueArtwork';
import { TechniquePhaseControl } from './TechniquePhaseControl';
import { equipmentPolicyFor } from '@/lib/exercise-equipment';
import { useEquipmentFocus } from './useEquipmentFocus';
import type { TechniquePhase } from '@/lib/exercise-technique';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from './AppButton';
import { Confirmation } from './Confirmation';
import { ExerciseLibrary } from './ExerciseLibrary';
import { GlassCard } from './GlassCard';
import { canonicalExerciseId, findExercise } from '@/lib/exercise-library';
import {
  normalizePlannedWeight,
  validPlannedSets,
} from '@/lib/planned-exercise';
import type { TemplateMutationResult } from '@/lib/workout-store';
import {
  createTemplateDraft,
  moveDraftExercise,
  removeDraftExercise,
  TemplateDraft,
  validateTemplateDraft,
  staleExerciseIds,
} from '@/lib/workout-templates';
import { colors, radius, spacing, typography } from '@/lib/theme';
import { useLocalization } from './LocalizationProvider';
import { catalogLabel } from '@/lib/i18n/catalog';
import { formatEntryNumber } from '@/lib/i18n/format';
import type { MessageKey } from '@/lib/i18n/messages';

type Props = {
  mode: 'create' | 'edit';
  template?: WorkoutTemplate;
  initialStep?: 'library' | 'composition';
  initialExerciseId?: string;
  busy: boolean;
  onSave: (draft: TemplateDraft) => Promise<TemplateMutationResult>;
  onCancel: () => void;
};
type Step = 'name' | 'library' | 'configure' | 'composition';
type Configuration = {
  exerciseId: string;
  sets: string;
  weight: string;
  editing: boolean;
  plannedSets?: PlannedSet[];
};

export function TemplateEditor({
  mode,
  template,
  busy,
  onSave,
  onCancel,
  initialStep,
  initialExerciseId,
}: Props) {
  const { t, locale } = useLocalization();
  const [equipmentOpen, setEquipmentOpen] = useState(false);
  const equipmentFocus = useEquipmentFocus(equipmentOpen);
  const [phase, setPhase] = useState<TechniquePhase>('START');
  const [groupCache, setGroupCache] = useState<
    Record<string, EquipmentCompositionDraft>
  >({});
  const [groupDirty, setGroupDirty] = useState(false);
  const configurationCache = useRef<Record<string, Configuration>>({});
  const [draft, setDraft] = useState(() => createTemplateDraft(template));
  const selectedExercise = draft.exerciseIds.includes(initialExerciseId ?? '')
    ? initialExerciseId
    : undefined;
  const [step, setStep] = useState<Step>(
    selectedExercise
      ? 'configure'
      : (initialStep ?? (mode === 'create' ? 'name' : 'composition')),
  );
  const [configuration, setConfiguration] = useState<Configuration | undefined>(
    () => {
      if (!selectedExercise) return undefined;
      const planned = draft.plannedExercises?.find(
        (item) => item.exerciseId === selectedExercise,
      );
      return {
        exerciseId: selectedExercise,
        sets: String(planned?.sets ?? 3),
        weight: planned?.weight ?? '',
        editing: true,
        plannedSets: planned?.plannedSets?.map((row) => ({ ...row })),
      };
    },
  );
  const [saving, setSaving] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [error, setError] = useState<
    Extract<MessageKey, `error.editor${string}`> | ''
  >('');
  const disabled = busy || saving;
  const equipmentPolicy = configuration
    ? equipmentPolicyFor(configuration.exerciseId)
    : null;
  const configuredEntry = draft.plannedExercises?.find(
    (e) => e.exerciseId === configuration?.exerciseId,
  );
  const compositionKey = configuredEntry?.exerciseGroup
    ? 'group:' + configuredEntry.exerciseGroup.id
    : 'exercise:' + (configuration?.exerciseId ?? '');
  const invalidateGroupCache = (id: string) =>
    setGroupCache((cache) =>
      Object.fromEntries(
        Object.entries(cache).filter(
          ([, value]) => !value.entries.some((e) => e.exerciseId === id),
        ),
      ),
    );
  const chooseEquipment = (exerciseId: string) => {
    if (!configuration || configuration.exerciseId === exerciseId) return;
    if (
      draft.exerciseIds.includes(exerciseId) &&
      !configurationCache.current[exerciseId]?.editing
    ) {
      setError('error.editorDuplicate');
      return;
    }
    configurationCache.current[configuration.exerciseId] = { ...configuration };
    setConfiguration(
      configurationCache.current[exerciseId] ?? {
        exerciseId,
        sets: '3',
        weight: '',
        editing: false,
      },
    );
    setError('');
  };
  const changed =
    groupDirty ||
    JSON.stringify(draft) !== JSON.stringify(createTemplateDraft(template)) ||
    (configuration !== undefined &&
      (configuration.sets !== '3' || configuration.weight.trim() !== ''));

  const nextFromName = () => {
    if (!draft.name.trim()) {
      setError('error.editorName');
      return;
    }
    setError('');
    setStep(draft.exerciseIds.length ? 'composition' : 'library');
  };
  const selectExercise = (exerciseId: string) => {
    const id = canonicalExerciseId(exerciseId) ?? exerciseId;
    if (draft.exerciseIds.includes(id)) {
      setError('error.editorDuplicate');
      return;
    }
    setConfiguration((current) =>
      current?.exerciseId === id && !current.editing
        ? current
        : { exerciseId: id, sets: '3', weight: '', editing: false },
    );
    setError('');
    setStep('configure');
  };
  const editExercise = (exerciseId: string) => {
    const planned = draft.plannedExercises?.find(
      (item) => item.exerciseId === exerciseId,
    );
    setConfiguration((current) =>
      current?.exerciseId === exerciseId && current.editing
        ? current
        : {
            exerciseId,
            sets: String(planned?.sets ?? 3),
            weight: planned?.weight ?? '',
            editing: true,
            plannedSets: planned?.plannedSets?.map((row) => ({ ...row })),
          },
    );
    setError('');
    setStep('configure');
  };
  const applyConfiguration = () => {
    if (!configuration) return;
    const sets = Number(configuration.sets.trim());
    if (!/^\d+$/.test(configuration.sets.trim()) || !validPlannedSets(sets)) {
      setError('error.editorSets');
      return;
    }
    const weight = configuration.weight.trim();
    const normalizedWeight = weight
      ? normalizePlannedWeight(weight)
      : undefined;
    if (weight && normalizedWeight === null) {
      setError('error.editorWeight');
      return;
    }
    const plannedSets = configuration.plannedSets
      ? Array.from({ length: sets }, (_, index) => {
          const row = configuration.plannedSets![index] ?? {
            id: createWorkoutSnapshotId(),
          };
          return {
            ...row,
            ...(row.weight === undefined
              ? {}
              : { weight: normalizePlannedWeight(row.weight) ?? row.weight }),
          };
        })
      : undefined;
    setDraft((current) => ({
      ...current,
      exerciseIds: configuration.editing
        ? current.exerciseIds
        : [...current.exerciseIds, configuration.exerciseId],
      plannedExercises: [
        ...(current.plannedExercises ?? []).filter(
          (item) => item.exerciseId !== configuration.exerciseId,
        ),
        {
          ...current.plannedExercises?.find(
            (item) => item.exerciseId === configuration.exerciseId,
          ),
          exerciseId: configuration.exerciseId,
          sets,
          ...(plannedSets ? { plannedSets } : {}),
          target: current.plannedExercises?.find(
            (item) => item.exerciseId === configuration.exerciseId,
          )?.target,
          weight: normalizedWeight ?? undefined,
        },
      ],
    }));
    setConfiguration(undefined);
    setError('');
    setStep('composition');
  };
  const goBack = () => {
    setError('');
    if (step === 'configure')
      setStep(configuration?.editing ? 'composition' : 'library');
    else if (step === 'library')
      setStep(draft.exerciseIds.length ? 'composition' : 'name');
    else if (step === 'composition') setStep('name');
  };
  const save = async () => {
    const validation = validateTemplateDraft(draft);
    if (!validation.ok) {
      setError(
        !draft.exerciseIds.length
          ? 'error.editorEmpty'
          : staleExerciseIds(draft).length
            ? 'error.editorUnavailable'
            : 'error.editorReview',
      );
      return;
    }
    setSaving(true);
    setError('');
    try {
      const result = await onSave(validation.draft);
      if (!result.ok)
        setError(
          result.code === 'template_missing'
            ? 'error.editorMissing'
            : 'error.editorSave',
        );
    } catch {
      setError('error.editorSave');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Confirmation
        visible={confirmCancel}
        title={t('editor.discardTitle')}
        message={t('editor.discardMessage')}
        confirmLabel={t('editor.discard')}
        cancelLabel={t('editor.keep')}
        onConfirm={onCancel}
        onCancel={() => setConfirmCancel(false)}
      />
      <ExerciseLibrary
        visible={step === 'library'}
        onClose={goBack}
        onAdd={(exercise) => selectExercise(exercise.id)}
        selectedIds={draft.exerciseIds}
      />
      <GlassCard style={s.card}>
        <Text style={s.title} accessibilityRole="header">
          {mode === 'create' ? t('editor.create') : t('editor.edit')}
        </Text>
        {step === 'name' ? (
          <>
            <Text style={s.heading}>{t('editor.name')}</Text>
            <TextInput
              accessibilityLabel={t('editor.name')}
              value={draft.name}
              onChangeText={(name) => {
                setDraft((current) => ({ ...current, name }));
                setError('');
              }}
              editable={!disabled}
              placeholder={t('editor.name')}
              placeholderTextColor={colors.textTertiary}
              returnKeyType="next"
              onSubmitEditing={nextFromName}
              style={s.input}
            />
            {error ? (
              <Text accessibilityRole="alert" style={s.error}>
                {t(error)}
              </Text>
            ) : null}
            <AppButton
              title={t('editor.next')}
              disabled={disabled}
              onPress={nextFromName}
            />
          </>
        ) : null}
        {step === 'configure' &&
        configuration &&
        ((equipmentPolicy?.choices.length ?? 0) > 1 ||
          configuredEntry?.exerciseGroup) ? (
          <ExerciseGroupComposer
            key={configuration.exerciseId}
            initialExerciseId={configuration.exerciseId}
            initialDraft={
              groupCache[compositionKey]
                ? {
                    ...groupCache[compositionKey],
                    selectedId: configuration.exerciseId,
                  }
                : undefined
            }
            initialEntries={
              configuration.editing
                ? (() => {
                    const original = draft.plannedExercises?.find(
                      (e) => e.exerciseId === configuration.exerciseId,
                    );
                    return original?.exerciseGroup
                      ? draft.plannedExercises!.filter(
                          (e) =>
                            e.exerciseGroup?.id === original.exerciseGroup!.id,
                        )
                      : [
                          original ?? {
                            exerciseId: configuration.exerciseId,
                            sets: 3,
                          },
                        ];
                  })()
                : []
            }
            existingOutsideIds={draft.exerciseIds.filter((id) => {
              if (!configuration.editing) return true;
              const original = draft.plannedExercises?.find(
                (e) => e.exerciseId === configuration.exerciseId,
              );
              return original?.exerciseGroup
                ? draft.plannedExercises?.find((e) => e.exerciseId === id)
                    ?.exerciseGroup?.id !== original.exerciseGroup.id
                : id !== configuration.exerciseId;
            })}
            busy={disabled}
            onDirty={() => setGroupDirty(true)}
            onDraftChange={(value) => {
              setGroupCache((cache) => ({
                ...cache,
                [compositionKey]: value,
              }));
            }}
            onCancel={goBack}
            onApply={(entries) => {
              try {
                setDraft(
                  applyEquipmentGroupDraft(
                    draft,
                    configuration.exerciseId,
                    entries,
                    configuration.editing,
                  ),
                );
                setGroupCache((cache) => {
                  const next = { ...cache };
                  delete next[compositionKey];
                  for (const [key, value] of Object.entries(next)) {
                    if (
                      value.group.id === entries[0]?.exerciseGroup?.id ||
                      value.entries.some((e) =>
                        entries.some((n) => n.exerciseId === e.exerciseId),
                      )
                    )
                      delete next[key];
                  }
                  return next;
                });
                setConfiguration(undefined);
                setError('');
                setStep('composition');
                return true;
              } catch {
                setError('error.editorDuplicate');
                return false;
              }
            }}
          />
        ) : step === 'configure' && configuration ? (
          <>
            <Text style={s.heading}>
              {catalogLabel(
                locale,
                'exercise',
                configuration.exerciseId,
                findExercise(configuration.exerciseId)?.name ??
                  t('editor.unavailable'),
              )}
            </Text>
            <TechniqueArtwork
              imageKey={configuration.exerciseId}
              phase={phase}
            />
            <TechniquePhaseControl phase={phase} onChange={setPhase} />
            <ExerciseEquipmentRow
              exerciseId={configuration.exerciseId}
              focusRef={equipmentFocus}
              onPress={disabled ? undefined : () => setEquipmentOpen(true)}
            />
            <Text style={s.label}>{t('editor.sets')}</Text>
            <TextInput
              accessibilityLabel={t('editor.sets')}
              value={configuration.sets}
              onChangeText={(sets) => {
                setConfiguration({ ...configuration, sets });
                setError('');
              }}
              editable={!disabled}
              keyboardType="number-pad"
              style={s.input}
            />
            <Text style={s.label}>{t('editor.weight')}</Text>
            <TextInput
              accessibilityLabel={t('editor.weightLabel')}
              value={configuration.weight}
              onChangeText={(weight) => {
                setConfiguration({ ...configuration, weight });
                setError('');
              }}
              editable={!disabled}
              keyboardType="decimal-pad"
              placeholder={t('editor.unset')}
              placeholderTextColor={colors.textTertiary}
              style={s.input}
            />
            {configuration.plannedSets?.map((row, index) => (
              <View key={row.id} style={{ gap: spacing.xs }}>
                <TextInput
                  accessibilityLabel={t('equipment.rowWeight', {
                    index: index + 1,
                  })}
                  value={row.weight ?? ''}
                  editable={!disabled}
                  keyboardType="decimal-pad"
                  style={s.input}
                  onChangeText={(weight) =>
                    setConfiguration({
                      ...configuration,
                      plannedSets: configuration.plannedSets!.map((r) => {
                        if (r.id !== row.id) return r;
                        const next = { ...r };
                        if (weight.trim()) next.weight = weight;
                        else delete next.weight;
                        return next;
                      }),
                    })
                  }
                />
                <TextInput
                  accessibilityLabel={t('equipment.rowReps', {
                    index: index + 1,
                  })}
                  value={row.reps ?? ''}
                  editable={!disabled}
                  keyboardType="number-pad"
                  style={s.input}
                  onChangeText={(reps) =>
                    setConfiguration({
                      ...configuration,
                      plannedSets: configuration.plannedSets!.map((r) => {
                        if (r.id !== row.id) return r;
                        const next = { ...r };
                        if (reps.trim()) next.reps = reps;
                        else delete next.reps;
                        return next;
                      }),
                    })
                  }
                />
              </View>
            ))}
            <Text style={s.secondary}>{t('editor.help')}</Text>
            {error ? (
              <Text accessibilityRole="alert" style={s.error}>
                {t(error)}
              </Text>
            ) : null}
            <AppButton
              title={
                configuration.editing
                  ? t('editor.updateExercise')
                  : t('editor.addExercise')
              }
              disabled={disabled}
              onPress={applyConfiguration}
            />
          </>
        ) : null}
        {step === 'composition' ? (
          <>
            <Text style={s.heading}>{draft.name.trim()}</Text>
            <Text style={s.secondary}>
              {t('editor.exercises', {
                count: new Set(
                  draft.exerciseIds.map(
                    (id) =>
                      draft.plannedExercises?.find((e) => e.exerciseId === id)
                        ?.exerciseGroup?.id ?? id,
                  ),
                ).size,
              })}
            </Text>
            {draft.exerciseIds.map((id, index) => {
              const exercise = findExercise(id);
              const label = exercise
                ? catalogLabel(locale, 'exercise', id, exercise.name)
                : t('editor.unavailableNamed', { id });
              const planned = draft.plannedExercises?.find(
                (item) => item.exerciseId === id,
              );
              return (
                <View key={`${id}-${index}`} style={s.exerciseRow}>
                  <View style={s.exerciseCopy}>
                    {planned?.exerciseGroup &&
                    draft.plannedExercises?.find(
                      (e) => e.exerciseId === draft.exerciseIds[index - 1],
                    )?.exerciseGroup?.id !== planned.exerciseGroup.id ? (
                      <Text accessibilityRole="header" style={s.heading}>
                        {planned.exerciseGroup.name}
                      </Text>
                    ) : null}
                    {planned?.exerciseGroup ? (
                      <ExerciseEquipmentRow exerciseId={id} />
                    ) : null}
                    <Text style={s.exerciseName}>
                      {exercise ? label : t('editor.unavailable')}
                    </Text>
                    {planned?.plannedSets ? (
                      <View>
                        {planned.plannedSets.map((row, i) => (
                          <Text key={row.id} style={s.secondary}>
                            {t('history.set', {
                              index: i + 1,
                              weight: row.weight
                                ? formatEntryNumber(locale, row.weight)
                                : t('editor.unset'),
                              reps: row.reps
                                ? formatEntryNumber(locale, row.reps)
                                : t('editor.unset'),
                            })}
                          </Text>
                        ))}
                      </View>
                    ) : exercise ? (
                      <Text style={s.secondary}>
                        {t('editor.planned', {
                          sets: t('editor.setCount', {
                            count: planned?.sets ?? 3,
                          }),
                          weight: planned?.weight
                            ? t('editor.weightValue', {
                                weight: formatEntryNumber(
                                  locale,
                                  planned.weight,
                                ),
                              })
                            : t('editor.weightUnset'),
                        })}
                      </Text>
                    ) : (
                      <Text style={s.error}>{id}</Text>
                    )}
                  </View>
                  <View style={s.actions}>
                    {exercise ? (
                      <IconAction
                        label={t('editor.editNamed', { name: label })}
                        icon="create-outline"
                        disabled={disabled}
                        onPress={() => editExercise(id)}
                      />
                    ) : null}
                    <IconAction
                      label={t('editor.up', { name: label })}
                      icon="arrow-up"
                      disabled={disabled || index === 0}
                      onPress={() =>
                        setDraft((current) =>
                          moveDraftExercise(current, index, -1),
                        )
                      }
                    />
                    <IconAction
                      label={t('editor.down', { name: label })}
                      icon="arrow-down"
                      disabled={
                        disabled || index === draft.exerciseIds.length - 1
                      }
                      onPress={() =>
                        setDraft((current) =>
                          moveDraftExercise(current, index, 1),
                        )
                      }
                    />
                    <IconAction
                      label={t('editor.remove', {
                        name: exercise
                          ? label
                          : label.toLocaleLowerCase(locale),
                      })}
                      icon="close"
                      danger
                      disabled={disabled}
                      onPress={() => {
                        invalidateGroupCache(id);
                        setDraft((current) =>
                          removeDraftExercise(current, index),
                        );
                        setError('');
                      }}
                    />
                  </View>
                </View>
              );
            })}
            {error ? (
              <Text accessibilityRole="alert" style={s.error}>
                {t(error)}
              </Text>
            ) : null}
            <AppButton
              title={t('editor.addExercise')}
              secondary
              disabled={disabled}
              onPress={() => {
                setError('');
                setStep('library');
              }}
            />
            <AppButton
              title={saving ? t('editor.saving') : t('editor.save')}
              disabled={disabled}
              onPress={() => {
                void save();
              }}
            />
          </>
        ) : null}
        {step === 'configure' || step === 'composition' ? (
          <AppButton
            title={t('editor.back')}
            secondary
            disabled={disabled}
            onPress={goBack}
          />
        ) : null}
        {step !== 'library' ? (
          <AppButton
            title={t('editor.cancel')}
            secondary
            disabled={disabled}
            onPress={() => (changed ? setConfirmCancel(true) : onCancel())}
          />
        ) : null}
      </GlassCard>
      {equipmentOpen && equipmentPolicy && configuration ? (
        <ExerciseEquipmentSheet
          policy={equipmentPolicy}
          selectedVariantId={configuration.exerciseId}
          onSelect={chooseEquipment}
          onClose={() => setEquipmentOpen(false)}
        />
      ) : null}
    </>
  );
}

function IconAction({
  label,
  icon,
  danger = false,
  disabled,
  onPress,
}: {
  label: string;
  icon: 'create-outline' | 'arrow-up' | 'arrow-down' | 'close';
  danger?: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [s.iconAction, (pressed || disabled) && s.dimmed]}
    >
      <Ionicons
        name={icon}
        size={18}
        color={danger ? colors.danger : colors.textSecondary}
      />
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: { gap: spacing.md },
  title: { ...typography.title3, color: colors.textPrimary },
  heading: {
    ...typography.headline,
    color: colors.textPrimary,
    flexWrap: 'wrap',
  },
  label: { ...typography.subheadline, color: colors.textPrimary },
  secondary: { ...typography.footnote, color: colors.textSecondary },
  error: { ...typography.footnote, color: colors.danger },
  input: {
    ...typography.body,
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
  },
  exerciseRow: {
    minHeight: 60,
    alignItems: 'stretch',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
  },
  exerciseCopy: { flex: 1, minWidth: 0 },
  exerciseName: {
    ...typography.subheadline,
    color: colors.textPrimary,
    flexWrap: 'wrap',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: spacing.xxs,
  },
  iconAction: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dimmed: { opacity: 0.5 },
});
