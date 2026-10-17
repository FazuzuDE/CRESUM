import { useMemo, useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from './AppButton';
import { AppScrollView } from './AppScrollView';
import { BrandHeader } from './BrandHeader';
import { GlassCard } from './GlassCard';
import { MuscleMap } from './MuscleMap';
import {
  projectMuscleParticipation,
  type MusclePeriod,
} from '@/lib/muscle-participation';
import type { MuscleId } from '@/lib/exercise-taxonomy';
import type { WorkoutSession } from '@/lib/workout-model';
import { colors, spacing, typography } from '@/lib/theme';

export function MuscleProgress({
  history,
  activeWorkout,
  now,
  onOverview,
}: {
  history: WorkoutSession[];
  activeWorkout?: WorkoutSession;
  now: number;
  onOverview: () => void;
}) {
  const [period, setPeriod] = useState<MusclePeriod>('7d');
  const [selected, setSelected] = useState<MuscleId>();
  const [showSets, setShowSets] = useState(false);
  const data = useMemo(
    () => projectMuscleParticipation(history, activeWorkout, period, now),
    [history, activeWorkout, period, now],
  );
  const muscle = data.muscles.find((item) => item.id === selected);
  function select(id: MuscleId) {
    setSelected(id);
    setShowSets(false);
  }
  return (
    <>
      <AppScrollView contentContainerStyle={s.content}>
        <BrandHeader />
        <Text style={s.title} accessibilityRole="header">
          Progress
        </Text>
        <View style={s.tabs}>
          <AppButton title="Overview" secondary onPress={onOverview} />
          <AppButton title="Muscles" selected onPress={() => {}} />
        </View>
        <Text style={s.heading} accessibilityRole="header">
          Muscle Map
        </Text>
        <View style={s.periods}>
          {(
            [
              ['workout', 'Workout'],
              ['7d', '7 days'],
              ['4w', '4 weeks'],
            ] as const
          ).map(([id, label]) => (
            <AppButton
              key={id}
              title={label}
              secondary={period !== id}
              selected={period === id}
              onPress={() => {
                setPeriod(id);
                setSelected(undefined);
              }}
            />
          ))}
        </View>
        <GlassCard>
          <View style={s.card}>
            <Text style={s.heading}>{data.context}</Text>
            {data.workoutName ? (
              <Text style={s.body}>{data.workoutName}</Text>
            ) : null}
            <Text style={s.body}>{data.totalSets} completed sets</Text>
            <MuscleMap muscles={data.muscles} onSelect={select} />
            <View style={s.legend}>
              <Text style={s.body}>
                <Text style={{ color: colors.musclePrimary }}>● </Text>Primary
              </Text>
              <Text style={s.body}>
                <Text style={{ color: colors.muscleSecondary }}>● </Text>
                Secondary
              </Text>
              <Text style={s.body}>
                <Text style={{ color: colors.muscleNeutral }}>● </Text>No mapped
                sets
              </Text>
            </View>
            <Text style={s.note}>
              Schematic muscle groups, not measured activation or recovery.
              Color shows role, not intensity; primary takes precedence when
              both roles occur.
            </Text>
          </View>
        </GlassCard>
        {data.totalSets === 0 ? (
          <Text style={s.body}>
            No completed sets in this period. Log a set to see muscle
            participation.
          </Text>
        ) : null}
        {data.unmappedSets > 0 ? (
          <Text style={s.body}>
            {data.unmappedSets} completed sets have no catalog mapping and are
            not shown on the map.
          </Text>
        ) : null}
        <Text style={s.note}>
          Based on current exercise catalog mappings. A set may involve several
          muscles. Primary and secondary counts are separate, not additive
          totals. One logged bilateral set counts once.
        </Text>
        <GlassCard>
          <View style={s.card}>
            {data.muscles.map((item) => (
              <AppButton
                key={item.id}
                title={`${item.label} · ${item.primary} primary · ${item.secondary} secondary`}
                accessibilityLabel={`${item.label}, ${item.primary} primary sets, ${item.secondary} secondary sets. Show details`}
                presentation="row"
                onPress={() => select(item.id)}
              />
            ))}
          </View>
        </GlassCard>
      </AppScrollView>
      <Modal
        visible={!!muscle}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelected(undefined)}
      >
        <SafeAreaView style={s.modal}>
          <AppScrollView contentContainerStyle={s.content}>
            <AppButton
              title="Done"
              secondary
              onPress={() => setSelected(undefined)}
            />
            {muscle ? (
              <>
                <Text style={s.title} accessibilityRole="header">
                  {muscle.label}
                </Text>
                <Text style={s.body}>{data.context}</Text>
                <Text style={s.heading}>
                  {muscle.primary} primary · {muscle.secondary} secondary sets
                </Text>
                <MuscleMap
                  muscles={data.muscles.map((item) =>
                    item.id === muscle.id
                      ? item
                      : { ...item, primary: 0, secondary: 0 },
                  )}
                  selected={muscle.id}
                  onSelect={select}
                />
                <Text style={s.heading}>Contributing exercises</Text>
                {Array.from(
                  new Set(muscle.sets.map((set) => set.libraryId)),
                ).map((id) => {
                  const sets = muscle.sets.filter(
                    (set) => set.libraryId === id,
                  );
                  return (
                    <GlassCard key={id}>
                      <View style={s.card}>
                        <Text style={s.heading}>{sets[0].exerciseName}</Text>
                        <Text style={s.body}>
                          {sets.filter((set) => set.role === 'primary').length}{' '}
                          primary ·{' '}
                          {
                            sets.filter((set) => set.role === 'secondary')
                              .length
                          }{' '}
                          secondary
                        </Text>
                      </View>
                    </GlassCard>
                  );
                })}
                {!muscle.sets.length ? (
                  <Text style={s.body}>
                    No mapped completed sets for this muscle in this period.
                  </Text>
                ) : (
                  <AppButton
                    title={
                      showSets ? 'Hide completed sets' : 'View completed sets'
                    }
                    secondary
                    onPress={() => setShowSets(!showSets)}
                  />
                )}
                {showSets
                  ? muscle.sets.map((set, index) => (
                      <GlassCard
                        key={`${set.workoutId}:${set.exerciseId}:${set.setId}:${index}`}
                      >
                        <View style={s.card}>
                          <Text style={s.heading}>{set.exerciseName}</Text>
                          <Text style={s.body}>
                            {set.workoutName} ·{' '}
                            {new Date(set.date).toLocaleDateString()}
                          </Text>
                          <Text style={s.body}>
                            Set {set.setNumber} · {set.role}
                          </Text>
                          <Text style={s.body}>
                            Logged weight: {set.weight || '—'} kg · Logged reps:{' '}
                            {set.reps || '—'}
                            {set.otherSideReps !== undefined
                              ? ` / ${set.otherSideReps}`
                              : ''}
                          </Text>
                        </View>
                      </GlassCard>
                    ))
                  : null}
              </>
            ) : null}
          </AppScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
}
const s = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md },
  modal: { flex: 1, backgroundColor: colors.background },
  title: { ...typography.largeTitle, color: colors.textPrimary },
  heading: { ...typography.headline, color: colors.textPrimary },
  body: { ...typography.subheadline, color: colors.textSecondary },
  note: { ...typography.footnote, color: colors.textSecondary },
  card: { gap: spacing.sm },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  periods: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
