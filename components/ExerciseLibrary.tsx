import {
  LocalizedText as Text,
  LocalizedTextInput as TextInput,
  DirectionalIcon as Ionicons,
} from '@/components/LayoutDirection';
import { ScreenModal } from './ScreenModal';
import { AppScrollView } from './AppScrollView';
import { AppPicker } from './AppPicker';
import { WheelPickerSheet } from './WheelPickerSheet';
import { GlassMaterial } from './GlassMaterial';
import { useReducedTransparency } from './useReducedTransparency';

import { useEffect, useState } from 'react';
import { Pressable, Keyboard, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExerciseEquipmentRow } from './ExerciseEquipmentRow';
import { ExerciseEquipmentSheet } from './ExerciseEquipmentSheet';
import { equipmentPolicyFor } from '@/lib/exercise-equipment';
import { findExercise } from '@/lib/exercise-library';
import { ExerciseTechnique } from './ExerciseTechnique';
import { ExerciseArtwork } from './ExerciseArtwork';
import { catalogLabel, searchLocalizedExercises } from '@/lib/i18n/catalog';
import { useLocalization } from './LocalizationProvider';
import {
  equipmentTaxonomy,
  EquipmentId,
  muscleTaxonomy,
  MuscleId,
} from '@/lib/exercise-taxonomy';
import { LibraryExercise, type WorkoutSession } from '@/lib/workout-model';
import { cardShadow, colors, radius, spacing, typography } from '@/lib/theme';

type FilterGroup = 'muscle' | 'equipment';

type ExerciseLibraryProps = {
  visible: boolean;
  presentation?: 'sheet' | 'page';
  onClose: () => void;
  onAdd?: (exercise: LibraryExercise) => void;
  selectedIds?: readonly string[];
  onToggle?: (id: string) => void;
  history?: readonly WorkoutSession[];
  now?: number;
};

export function ExerciseLibrary({
  visible,
  presentation = 'sheet',
  onClose,
  onAdd,
  selectedIds = [],
  onToggle,
  history,
  now,
}: ExerciseLibraryProps) {
  const { locale, t } = useLocalization();
  const [guide, setGuide] = useState<LibraryExercise | null>(null);
  const [guideTab, setGuideTab] = useState<'Technique' | 'Statistics'>(
    'Technique',
  );
  const openGuide = (
    exercise: LibraryExercise,
    tab: 'Technique' | 'Statistics' = 'Technique',
  ) => {
    setGuideTab(tab);
    setGuide(exercise);
  };
  const [gobletId, setGobletId] = useState<string>();
  const [gobletEquipmentOpen, setGobletEquipmentOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<MuscleId>();
  const [equipment, setEquipment] = useState<EquipmentId>();
  const [filterDraft, setFilterDraft] = useState<{
    group: FilterGroup;
    row: number;
  }>();
  const reduceTransparency = useReducedTransparency(visible);
  const filterTitles = {
    muscle: t('library.muscle'),
    equipment: t('library.equipment'),
  };
  const filters = {
    muscle: [
      t('library.all'),
      ...muscleTaxonomy.map(({ id, label }) =>
        catalogLabel(locale, 'muscle', id, label),
      ),
    ],
    equipment: [
      t('library.all'),
      ...equipmentTaxonomy.map(({ id, label }) =>
        catalogLabel(locale, 'equipment', id, label),
      ),
    ],
  };
  const selectedRows = {
    muscle: muscleTaxonomy.findIndex((item) => item.id === muscle) + 1,
    equipment: equipmentTaxonomy.findIndex((item) => item.id === equipment) + 1,
  };

  const reset = () => {
    setFilterDraft(undefined);
    setQuery('');
    setMuscle(undefined);
    setEquipment(undefined);
  };
  const close = () => {
    setGuide(null);
    setGobletId(undefined);
    setGobletEquipmentOpen(false);
    reset();
    onClose();
  };

  useEffect(() => {
    if (!visible) {
      setGobletId(undefined);
      setGobletEquipmentOpen(false);
      setGuide(null);
      setFilterDraft(undefined);
      setQuery('');
      setMuscle(undefined);
      setEquipment(undefined);
    }
  }, [visible]);

  const results = searchLocalizedExercises(
    {
      query,
      muscle,
      equipment,
    },
    locale,
  );
  const selectionMode = Boolean(onToggle);
  const browsing = !selectionMode && !onAdd;
  const CopyContainer = browsing ? Pressable : View;

  const content = (
    <SafeAreaView
      edges={presentation === 'page' ? [] : ['left', 'right']}
      style={s.sheet}
    >
      <AppScrollView
        branded
        dockAware={presentation === 'page'}
        back={
          presentation === 'page'
            ? { accessibilityLabel: t('library.backProfile'), onPress: close }
            : undefined
        }
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.content}
      >
        <View style={s.header}>
          <View style={s.headerCopy}>
            <Text style={s.title}>{t('library.title')}</Text>
            <Text style={s.subtitle}>
              {t('library.count', { count: results.length })}
            </Text>
          </View>
          {presentation !== 'page' ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('library.closeLibrary')}
              onPress={close}
              style={s.close}
            >
              <Text style={s.closeText}>{t('library.close')}</Text>
            </Pressable>
          ) : null}
        </View>

        <TextInput
          accessibilityLabel={t('library.searchLabel')}
          value={query}
          onChangeText={setQuery}
          placeholder={t('library.searchPlaceholder')}
          placeholderTextColor={colors.textTertiary}
          returnKeyType="search"
          style={s.search}
        />

        <View style={s.filterBar}>
          <GlassMaterial
            borderRadius={radius.pill}
            solid={Platform.OS === 'ios' && reduceTransparency}
          />
          {(['muscle', 'equipment'] as const).map((group) => (
            <FilterButton
              key={group}
              group={group}
              title={filterTitles[group]}
              value={filters[group][selectedRows[group]]}
              filtered={selectedRows[group] > 0}
              onPress={() => {
                Keyboard.dismiss();
                setFilterDraft({ group, row: selectedRows[group] });
              }}
            />
          ))}
        </View>

        <View style={s.results}>
          {results.length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyTitle}>{t('library.empty')}</Text>
              <Text style={s.subtitle}>{t('library.emptyHint')}</Text>
            </View>
          ) : (
            results.map((listedExercise) => {
              const exercise =
                listedExercise.id === 'goblet-squat'
                  ? findExercise(
                      gobletId ??
                        selectedIds.find(
                          (id) =>
                            id === 'goblet-squat' ||
                            id === 'kettlebell-goblet-squat',
                        ) ??
                        (equipment === 'kettlebell'
                          ? 'kettlebell-goblet-squat'
                          : 'goblet-squat'),
                    )!
                  : listedExercise;
              const name = catalogLabel(
                locale,
                'exercise',
                exercise.id,
                exercise.name,
              );
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
                        browsing ? t('library.view', { name }) : undefined
                      }
                      onPress={browsing ? () => openGuide(exercise) : undefined}
                      style={s.nameCopy}
                    >
                      <Text style={s.name}>{name}</Text>
                      <Text style={s.metadata}>
                        {exercise.primaryMuscles
                          .map((id) => catalogLabel(locale, 'muscle', id, id))
                          .join(' · ')}
                      </Text>
                      <Text style={s.metadata}>
                        {exercise.equipment
                          .map((id) =>
                            catalogLabel(locale, 'equipment', id, id),
                          )
                          .join(' · ')}
                      </Text>
                    </CopyContainer>
                    {history !== undefined ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t('library.statisticsFor', {
                          name,
                        })}
                        accessibilityHint={t('library.statisticsHint')}
                        onPress={() => openGuide(exercise, 'Statistics')}
                        style={s.statisticsAction}
                      >
                        <Text style={s.techniqueLabel}>
                          {t('library.statistics')}
                        </Text>
                      </Pressable>
                    ) : null}
                    {listedExercise.id === 'goblet-squat' ? (
                      <ExerciseEquipmentRow
                        exerciseId={exercise.id}
                        onPress={() => setGobletEquipmentOpen(true)}
                      />
                    ) : null}
                    {selectionMode ? (
                      <Pressable
                        accessibilityRole="checkbox"
                        accessibilityLabel={t('library.selectName', { name })}
                        accessibilityState={{ checked: selected }}
                        onPress={() => onToggle?.(exercise.id)}
                        style={[s.action, selected && s.selectedAction]}
                      >
                        <Text
                          style={[
                            s.actionText,
                            selected && s.selectedActionText,
                          ]}
                        >
                          {t(selected ? 'library.selected' : 'library.select')}
                        </Text>
                      </Pressable>
                    ) : onAdd ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t(
                          selected
                            ? 'library.alreadyAddedName'
                            : 'library.addName',
                          { name },
                        )}
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
                          {t(selected ? 'library.added' : 'library.add')}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('library.techniqueFor', { name })}
                    accessibilityHint={t('library.techniqueHint')}
                    onPress={() => openGuide(exercise)}
                    style={s.techniqueAction}
                  >
                    <ExerciseArtwork imageKey={exercise.imageKey} size={76} />
                    <Text style={s.techniqueLabel}>
                      {t('library.technique')}
                    </Text>
                  </Pressable>
                </View>
              );
            })
          )}
        </View>
      </AppScrollView>
      {visible && filterDraft ? (
        <WheelPickerSheet
          title={filterTitles[filterDraft.group]}
          onCancel={() => setFilterDraft(undefined)}
          onConfirm={() => {
            if (filterDraft.group === 'muscle') {
              setMuscle(muscleTaxonomy[filterDraft.row - 1]?.id);
            } else {
              setEquipment(equipmentTaxonomy[filterDraft.row - 1]?.id);
            }
            setFilterDraft(undefined);
          }}
        >
          <AppPicker
            flexible
            columns={[filters[filterDraft.group]]}
            labels={[filterTitles[filterDraft.group]]}
            selected={[filterDraft.row]}
            onChange={(_, row) =>
              setFilterDraft((current) =>
                current?.group === filterDraft.group
                  ? { ...current, row }
                  : current,
              )
            }
          />
        </WheelPickerSheet>
      ) : null}
      {gobletEquipmentOpen ? (
        <ExerciseEquipmentSheet
          policy={equipmentPolicyFor('goblet-squat')!}
          selectedVariantId={
            gobletId ??
            selectedIds.find(
              (id) => id === 'goblet-squat' || id === 'kettlebell-goblet-squat',
            ) ??
            (equipment === 'kettlebell'
              ? 'kettlebell-goblet-squat'
              : 'goblet-squat')
          }
          onSelect={setGobletId}
          onClose={() => setGobletEquipmentOpen(false)}
        />
      ) : null}
      {guide ? (
        <ExerciseTechnique
          key={guide.id}
          exercise={guide}
          onEquipmentChange={
            guide.id === 'goblet-squat' ||
            guide.id === 'kettlebell-goblet-squat'
              ? setGobletId
              : undefined
          }
          history={history}
          initialTab={guideTab}
          now={now}
          onClose={() => setGuide(null)}
        />
      ) : null}
    </SafeAreaView>
  );
  if (presentation === 'page') return visible ? content : null;
  return (
    <ScreenModal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={close}
    >
      {content}
    </ScreenModal>
  );
}

function FilterButton({
  title,
  value,
  group,
  filtered,
  onPress,
}: {
  title: string;
  value: string;
  group: FilterGroup;
  filtered: boolean;
  onPress: () => void;
}) {
  const { t } = useLocalization();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t(
        group === 'muscle' ? 'library.filterMuscle' : 'library.filterEquipment',
        { label: value },
      )}
      onPress={onPress}
      style={({ pressed }) => [
        s.filter,
        filtered && s.selectedFilter,
        pressed && s.pressedFilter,
      ]}
    >
      <View style={s.filterCopy}>
        <Text style={s.filterLabel}>{title}</Text>
        <Text style={[s.filterValue, filtered && s.selectedFilterText]}>
          {value}
        </Text>
      </View>
      <Ionicons name="chevron-down" size={16} color={colors.primary} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  sheet: {
    flex: 1,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
  },
  content: { paddingTop: spacing.sm },
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
  filterBar: {
    flexDirection: 'row',
    padding: spacing.xxs,
    borderRadius: radius.pill,
    ...cardShadow,
  },
  filterLabel: { ...typography.caption, color: colors.textSecondary },
  filter: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    gap: spacing.xxs,
    borderRadius: radius.pill,
  },
  filterCopy: { flex: 1, minWidth: 0 },
  filterValue: { ...typography.subheadline, color: colors.textPrimary },
  selectedFilter: { backgroundColor: colors.primaryTint },
  selectedFilterText: { color: colors.primary },
  pressedFilter: { opacity: 0.65 },
  results: {
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
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
  techniqueLabel: {
    ...typography.caption,
    color: colors.primary,
    maxWidth: '100%',
    textAlign: 'center',
  },
  statisticsAction: {
    minHeight: 44,
    justifyContent: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.xs,
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
  addActionText: {
    ...typography.headline,
    color: colors.surface,
    maxWidth: '100%',
    textAlign: 'center',
  },
  disabledAction: { backgroundColor: colors.surfaceSubtle },
  disabledActionText: { color: colors.textSecondary },
  empty: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xxl,
  },
  emptyTitle: { ...typography.headline, color: colors.textPrimary },
});
