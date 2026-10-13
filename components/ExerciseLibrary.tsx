import { AppScrollView } from './AppScrollView';
import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExerciseTechnique } from './ExerciseTechnique';
import { ExerciseArtwork } from './ExerciseArtwork';
import { exerciseLibrary, filterExercises } from '@/lib/exercise-library';
import {
  equipmentLabel,
  equipmentTaxonomy,
  EquipmentId,
  muscleLabel,
  muscleTaxonomy,
  MuscleId,
} from '@/lib/exercise-taxonomy';
import { LibraryExercise } from '@/lib/workout-model';
import { colors, radius, spacing, typography } from '@/lib/theme';

type ExerciseLibraryProps = {
  visible: boolean;
  presentation?: 'sheet' | 'page';
  onClose: () => void;
  onAdd?: (exercise: LibraryExercise) => void;
  selectedIds?: readonly string[];
  onToggle?: (id: string) => void;
};

export function ExerciseLibrary({
  visible,
  presentation = 'sheet',
  onClose,
  onAdd,
  selectedIds = [],
  onToggle,
}: ExerciseLibraryProps) {
  const [guide, setGuide] = useState<LibraryExercise | null>(null);
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<MuscleId>();
  const [equipment, setEquipment] = useState<EquipmentId>();

  const reset = () => {
    setQuery('');
    setMuscle(undefined);
    setEquipment(undefined);
  };
  const close = () => {
    setGuide(null);
    reset();
    onClose();
  };

  useEffect(() => {
    if (!visible) {
      setGuide(null);
      setQuery('');
      setMuscle(undefined);
      setEquipment(undefined);
    }
  }, [visible]);

  const results = filterExercises(exerciseLibrary, {
    query,
    muscle,
    equipment,
  });
  const selectionMode = Boolean(onToggle);
  const browsing = !selectionMode && !onAdd;
  const CopyContainer = browsing ? Pressable : View;

  const content = (
    <SafeAreaView style={s.sheet}>
      <View style={s.identity}>
        <Text style={s.wordmark}>CRESUM</Text>
        <Text style={s.tagline}>TRAIN. TRACK. GROW.</Text>
      </View>
      <View style={s.header}>
        <View style={s.headerCopy}>
          <Text style={s.title}>Exercise Library</Text>
          <Text style={s.subtitle}>{results.length} exercises</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            presentation === 'page'
              ? 'Back to Profile'
              : 'Close exercise library'
          }
          onPress={close}
          style={s.close}
        >
          <Text style={s.closeText}>
            {presentation === 'page' ? 'Back' : 'Close'}
          </Text>
        </Pressable>
      </View>

      <TextInput
        accessibilityLabel="Search exercise library"
        value={query}
        onChangeText={setQuery}
        placeholder="Search exercises"
        placeholderTextColor={colors.textTertiary}
        returnKeyType="search"
        style={s.search}
      />

      <Text style={s.filterLabel}>Muscle</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.filterScroller}
        contentContainerStyle={s.filters}
      >
        <FilterChip
          label="All"
          group="muscle"
          selected={!muscle}
          onPress={() => setMuscle(undefined)}
        />
        {muscleTaxonomy.map((item) => (
          <FilterChip
            key={item.id}
            label={item.label}
            group="muscle"
            selected={muscle === item.id}
            onPress={() => setMuscle(item.id)}
          />
        ))}
      </ScrollView>

      <Text style={s.filterLabel}>Equipment</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.filterScroller}
        contentContainerStyle={s.filters}
      >
        <FilterChip
          label="All"
          group="equipment"
          selected={!equipment}
          onPress={() => setEquipment(undefined)}
        />
        {equipmentTaxonomy.map((item) => (
          <FilterChip
            key={item.id}
            label={item.label}
            group="equipment"
            selected={equipment === item.id}
            onPress={() => setEquipment(item.id)}
          />
        ))}
      </ScrollView>

      <AppScrollView
        keyboardShouldPersistTaps="handled"
        style={s.resultList}
        contentContainerStyle={s.results}
      >
        {results.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyTitle}>No exercises found</Text>
            <Text style={s.subtitle}>Try another search or filter.</Text>
          </View>
        ) : (
          results.map((exercise) => {
            const selected = selectedIds.includes(exercise.id);
            return (
              <View
                key={exercise.id}
                style={[s.row, selected && s.selectedRow]}
              >
                <View style={s.copy}>
                  <CopyContainer
                    accessibilityRole={browsing ? 'button' : undefined}
                    accessibilityLabel={
                      browsing ? `View ${exercise.name}` : undefined
                    }
                    onPress={browsing ? () => setGuide(exercise) : undefined}
                    style={s.nameCopy}
                  >
                    <Text style={s.name}>{exercise.name}</Text>
                    <Text style={s.metadata}>
                      {exercise.primaryMuscles.map(muscleLabel).join(' · ')}
                    </Text>
                    <Text style={s.metadata}>
                      {exercise.equipment.map(equipmentLabel).join(' · ')}
                    </Text>
                  </CopyContainer>
                  {selectionMode ? (
                    <Pressable
                      accessibilityRole="checkbox"
                      accessibilityLabel={`Select ${exercise.name}`}
                      accessibilityState={{ checked: selected }}
                      onPress={() => onToggle?.(exercise.id)}
                      style={[s.action, selected && s.selectedAction]}
                    >
                      <Text
                        style={[s.actionText, selected && s.selectedActionText]}
                      >
                        {selected ? 'Selected' : 'Select'}
                      </Text>
                    </Pressable>
                  ) : onAdd ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${selected ? 'Already added' : 'Add'} ${exercise.name}`}
                      accessibilityState={{ disabled: selected }}
                      disabled={selected}
                      onPress={() => onAdd?.(exercise)}
                      style={[s.addAction, selected && s.disabledAction]}
                    >
                      <Text
                        style={[
                          s.addActionText,
                          selected && s.disabledActionText,
                        ]}
                      >
                        {selected ? 'Added' : 'Add'}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Technique for ${exercise.name}`}
                  accessibilityHint="Opens instructions without selecting this exercise"
                  onPress={() => setGuide(exercise)}
                  style={s.techniqueAction}
                >
                  <ExerciseArtwork imageKey={exercise.imageKey} size={76} />
                  <Text style={s.techniqueLabel}>Technique</Text>
                </Pressable>
              </View>
            );
          })
        )}
      </AppScrollView>
      {guide ? (
        <ExerciseTechnique
          key={guide.id}
          exercise={guide}
          onClose={() => setGuide(null)}
        />
      ) : null}
    </SafeAreaView>
  );
  if (presentation === 'page') return visible ? content : null;
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={close}
    >
      {content}
    </Modal>
  );
}

function FilterChip({
  label,
  group,
  selected,
  onPress,
}: {
  label: string;
  group: 'muscle' | 'equipment';
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Filter ${group} ${label}`}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[s.filter, selected && s.selectedFilter]}
    >
      <Text style={[s.filterText, selected && s.selectedFilterText]}>
        {label}
      </Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  sheet: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: colors.background,
  },
  header: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerCopy: { flex: 1, minWidth: 0 },
  title: { ...typography.largeTitle, color: colors.textPrimary },
  subtitle: { ...typography.footnote, color: colors.textSecondary },
  close: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  closeText: { ...typography.headline, color: colors.primary },
  search: {
    ...typography.body,
    minHeight: 48,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    marginVertical: spacing.sm,
  },
  filterLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  filterScroller: { flexGrow: 0, flexShrink: 0 },
  filters: { gap: spacing.xs, paddingVertical: spacing.xs },
  filter: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSubtle,
  },
  selectedFilter: { backgroundColor: colors.primaryTint },
  filterText: { ...typography.caption, color: colors.textSecondary },
  selectedFilterText: { color: colors.primary },
  results: {
    paddingVertical: spacing.sm,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  resultList: { flex: 1 },
  row: {
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
  },
  selectedRow: { backgroundColor: colors.surfaceSubtle },
  copy: { flex: 1, minWidth: 0, gap: spacing.xs },
  nameCopy: { minHeight: 44, justifyContent: 'center', gap: spacing.xxs },
  techniqueAction: { width: 76, alignItems: 'center', gap: spacing.xxs },
  techniqueLabel: { ...typography.caption, color: colors.primary },
  identity: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  wordmark: {
    ...typography.footnote,
    fontWeight: '700',
    letterSpacing: 4,
    color: colors.textPrimary,
  },
  tagline: {
    ...typography.caption,
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  name: { ...typography.headline, color: colors.textPrimary, flexWrap: 'wrap' },
  metadata: { ...typography.footnote, color: colors.textSecondary },
  action: {
    minWidth: 72,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  selectedAction: { backgroundColor: colors.primary },
  actionText: { ...typography.caption, color: colors.primary },
  selectedActionText: { color: colors.surface },
  addAction: {
    minWidth: 56,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  addActionText: { ...typography.headline, color: colors.surface },
  disabledAction: { backgroundColor: colors.surfaceSubtle },
  disabledActionText: { color: colors.textSecondary },
  empty: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xxl,
  },
  emptyTitle: { ...typography.headline, color: colors.textPrimary },
});
