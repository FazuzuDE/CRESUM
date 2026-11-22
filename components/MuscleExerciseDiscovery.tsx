import { useContext, useEffect, useMemo, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, View } from 'react-native';
import { AppButton } from './AppButton';
import { AppScrollView } from './AppScrollView';
import { DockSpace } from './DockSpace';
import { ExerciseArtwork } from './ExerciseArtwork';
import { ExerciseTechnique } from './ExerciseTechnique';
import { GlassCard } from './GlassCard';
import { DirectionalIcon, LocalizedText as Text } from './LayoutDirection';
import { useLocalization } from './LocalizationProvider';
import { MuscleMap } from './MuscleMap';
import { disclosureChevron, MuscleSegments } from './MusclePageControls';
import {
  equipmentLabel,
  muscleLabel,
  type EquipmentId,
  type MuscleId,
} from '@/lib/exercise-taxonomy';
import { catalogLabel } from '@/lib/i18n/catalog';
import { formatNumber } from '@/lib/i18n/format';
import {
  findMuscleExercises,
  groupsForArea,
  muscleAreaIds,
  type MuscleArea,
  type MuscleMatchMode,
} from '@/lib/muscle-exercise-discovery';
import { colors, radius, spacing, typography } from '@/lib/theme';
import type { LibraryExercise, WorkoutSession } from '@/lib/workout-model';

export function MuscleExerciseDiscovery({
  onBack,
  history,
  now,
}: {
  onBack: () => void;
  history: readonly WorkoutSession[];
  now: number;
}) {
  const { t, locale } = useLocalization();
  const dockSpace = useContext(DockSpace);
  const [area, setArea] = useState<MuscleArea>('upper');
  const [expanded, setExpanded] = useState<string>();
  const [selected, setSelected] = useState<ReadonlySet<MuscleId>>(
    () => new Set(),
  );
  const [results, setResults] = useState(false);
  const [mode, setMode] = useState<MuscleMatchMode>('all');
  const [equipment, setEquipment] = useState<EquipmentId>();
  const [detail, setDetail] = useState<LibraryExercise>();
  const matches = useMemo(
    () => findMuscleExercises(selected, mode),
    [selected, mode],
  );
  const availableEquipment = [
    ...new Set(matches.flatMap(({ exercise }) => exercise.equipment)),
  ];
  const filtered = equipment
    ? matches.filter(({ exercise }) => exercise.equipment.includes(equipment))
    : matches;
  const label = (id: MuscleId) =>
    catalogLabel(locale, 'muscle', id, muscleLabel(id));
  const gear = (id: EquipmentId) =>
    catalogLabel(locale, 'equipment', id, equipmentLabel(id));
  const chips = [...selected].map((id) => (
    <Text key={id} style={s.badge}>
      {label(id)}
    </Text>
  ));

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (detail) setDetail(undefined);
        else if (results) setResults(false);
        else onBack();
        return true;
      },
    );
    return () => subscription.remove();
  }, [detail, onBack, results]);

  function toggle(id: MuscleId) {
    setSelected((previous) => {
      const next = new Set(previous);
      if (!next.delete(id)) next.add(id);
      return next;
    });
    setEquipment(undefined);
  }

  function selectOnMap(id: MuscleId) {
    for (const key of muscleAreaIds) {
      const group = groupsForArea(key).find(({ muscles }) =>
        muscles.includes(id),
      );
      if (group) {
        setArea(key);
        setExpanded(group.label);
        break;
      }
    }
    toggle(id);
  }

  return (
    <>
      {results ? (
        <AppScrollView
          key="results"
          branded
          back={{ onPress: () => setResults(false) }}
          dockAware
          contentContainerStyle={s.content}
        >
          <Text style={s.title} accessibilityRole="header">
            {t('muscle.results')}
          </Text>
          <View style={s.wrap}>{chips}</View>
          <MuscleSegments
            options={{ all: t('muscle.matchAll'), any: t('muscle.matchAny') }}
            value={mode}
            onChange={(next) => {
              setMode(next);
              setEquipment(undefined);
            }}
          />
          <GlassCard style={s.stack}>
            <Text style={s.heading} accessibilityRole="header">
              {t('library.equipment')}
            </Text>
            <View style={s.wrap}>
              {[undefined, ...availableEquipment].map((id) => (
                <Pressable
                  key={id ?? 'all'}
                  accessibilityRole="button"
                  accessibilityState={{ selected: equipment === id }}
                  style={({ pressed }) => [
                    s.filter,
                    equipment === id && s.activeFilter,
                    pressed && s.pressed,
                  ]}
                  onPress={() => setEquipment(id)}
                >
                  <Text style={equipment === id ? s.accent : s.note}>
                    {id ? gear(id) : t('library.all')}
                  </Text>
                </Pressable>
              ))}
            </View>
          </GlassCard>
          {filtered.length ? (
            <GlassCard style={s.list}>
              {filtered.map(({ exercise, primary, secondary }, index) => (
                <Pressable
                  key={exercise.id}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    s.result,
                    index > 0 && s.separator,
                    pressed && s.pressed,
                  ]}
                  onPress={() => setDetail(exercise)}
                >
                  <ExerciseArtwork imageKey={exercise.imageKey} size={40} />
                  <View style={s.resultCopy}>
                    <Text style={s.heading}>
                      {catalogLabel(
                        locale,
                        'exercise',
                        exercise.id,
                        exercise.name,
                      )}
                    </Text>
                    <Text style={s.note}>
                      {exercise.equipment.map(gear).join(' · ')}
                    </Text>
                    <View style={s.wrap}>
                      {primary.map((id) => (
                        <Text key={id} style={s.badge}>
                          {label(id)} · {t('muscle.primary')}
                        </Text>
                      ))}
                      {secondary.map((id) => (
                        <Text key={id} style={[s.badge, s.secondaryBadge]}>
                          {label(id)} · {t('muscle.secondary')}
                        </Text>
                      ))}
                    </View>
                  </View>
                  <DirectionalIcon
                    name="chevron-forward"
                    size={18}
                    color={colors.primary}
                    accessible={false}
                  />
                </Pressable>
              ))}
            </GlassCard>
          ) : (
            <GlassCard style={s.stack}>
              <Text style={s.note}>{t('library.empty')}</Text>
              {mode === 'all' && selected.size > 1 ? (
                <AppButton
                  title={t('muscle.matchAny')}
                  presentation="text"
                  onPress={() => {
                    setMode('any');
                    setEquipment(undefined);
                  }}
                />
              ) : null}
            </GlassCard>
          )}
          <Text style={s.note}>{t('muscle.catalogBasis')}</Text>
        </AppScrollView>
      ) : (
        <View key="picker" style={s.page}>
          <AppScrollView
            branded
            back={{ onPress: onBack }}
            contentContainerStyle={s.content}
          >
            <Text style={s.title} accessibilityRole="header">
              {t('muscle.choose')}
            </Text>
            <Text style={s.note}>{t('muscle.chooseHint')}</Text>
            <GlassCard style={s.stack}>
              <MuscleMap
                muscles={[...selected].map((id) => ({
                  id,
                  primary: 1,
                  secondary: 0,
                }))}
                onSelect={selectOnMap}
              />
              {selected.size > 0 ? (
                <View style={s.selection}>
                  <View style={[s.wrap, s.selectedChips]}>{chips}</View>
                  <AppButton
                    presentation="text"
                    title={t('muscle.clearSelection')}
                    onPress={() => {
                      setSelected(new Set());
                      setEquipment(undefined);
                    }}
                  />
                </View>
              ) : null}
            </GlassCard>
            <MuscleSegments
              options={{
                upper: t('muscle.area.upper'),
                core: t('muscle.area.core'),
                lower: t('muscle.area.lower'),
              }}
              value={area}
              onChange={(key) => {
                setArea(key);
                setExpanded(undefined);
              }}
            />
            <GlassCard style={s.list}>
              {groupsForArea(area).map((group, index) => {
                const open = expanded === group.label;
                const count = group.muscles.filter((id) =>
                  selected.has(id),
                ).length;
                return (
                  <View key={group.label} style={index > 0 && s.separator}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ expanded: open }}
                      style={({ pressed }) => [s.group, pressed && s.pressed]}
                      onPress={() =>
                        setExpanded(open ? undefined : group.label)
                      }
                    >
                      <Text style={s.heading}>
                        {t(`muscle.group.${group.label}`)}
                      </Text>
                      {count > 0 ? (
                        <Text style={[s.badge, s.groupCount]}>
                          {formatNumber(locale, count)}
                        </Text>
                      ) : null}
                      <DirectionalIcon
                        name={disclosureChevron(open)}
                        size={18}
                        color={colors.textSecondary}
                        accessible={false}
                      />
                    </Pressable>
                    {open
                      ? group.muscles.map((id) => (
                          <Pressable
                            key={id}
                            accessibilityRole="checkbox"
                            accessibilityLabel={label(id)}
                            accessibilityState={{ checked: selected.has(id) }}
                            style={({ pressed }) => [
                              s.checkboxRow,
                              pressed && s.pressed,
                            ]}
                            onPress={() => toggle(id)}
                          >
                            <View
                              style={[
                                s.checkbox,
                                selected.has(id) && s.checked,
                              ]}
                            >
                              {selected.has(id) ? (
                                <DirectionalIcon
                                  name="checkmark"
                                  size={15}
                                  color={colors.surface}
                                  accessible={false}
                                />
                              ) : null}
                            </View>
                            <Text style={s.checkboxLabel}>{label(id)}</Text>
                          </Pressable>
                        ))
                      : null}
                  </View>
                );
              })}
            </GlassCard>
          </AppScrollView>
          <View style={[s.footer, { marginBottom: dockSpace }]}>
            <AppButton
              title={[
                t('muscle.showExercises'),
                ...(selected.size ? [formatNumber(locale, selected.size)] : []),
              ].join(' · ')}
              disabled={!selected.size}
              onPress={() => setResults(true)}
            />
          </View>
        </View>
      )}
      {detail ? (
        <ExerciseTechnique
          key={detail.id}
          exercise={detail}
          history={history}
          now={now}
          onClose={() => setDetail(undefined)}
        />
      ) : null}
    </>
  );
}

const s = StyleSheet.create({
  page: { flex: 1 },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    backgroundColor: colors.background,
  },
  content: { padding: spacing.lg, gap: spacing.md },
  stack: { gap: spacing.sm },
  title: { ...typography.largeTitle, color: colors.textPrimary },
  heading: { ...typography.headline, color: colors.textPrimary, flexShrink: 1 },
  note: { ...typography.footnote, color: colors.textSecondary },
  accent: { ...typography.footnote, color: colors.primary, fontWeight: '600' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xxs },
  selection: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  selectedChips: { flex: 1 },
  badge: {
    ...typography.caption,
    color: colors.primary,
    backgroundColor: colors.primaryTint,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    flexShrink: 1,
  },
  secondaryBadge: {
    color: colors.textSecondary,
    backgroundColor: colors.surfaceSubtle,
  },
  filter: {
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: spacing.sm,
  },
  activeFilter: { backgroundColor: colors.primaryTint },
  pressed: { opacity: 0.65 },
  list: { paddingVertical: spacing.xxs },
  group: {
    minHeight: 44,
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  groupCount: { marginStart: 'auto' },
  checkboxRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingStart: spacing.xs,
  },
  checkbox: {
    height: 22,
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.textSecondary,
    borderRadius: spacing.xxs,
  },
  checked: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkboxLabel: {
    ...typography.subheadline,
    color: colors.textPrimary,
    flex: 1,
  },
  result: {
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  resultCopy: { flex: 1, gap: spacing.xxs },
  separator: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separator,
  },
});
