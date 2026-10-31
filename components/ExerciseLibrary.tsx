import { AppScrollView } from './AppScrollView';
import { BrandHeader } from './BrandHeader';
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
import { colors, radius, spacing, typography } from '@/lib/theme';

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

  const reset = () => {
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
    <SafeAreaView style={s.sheet}>
      <BrandHeader />
      <View style={s.header}>
        <View style={s.headerCopy}>
          <Text style={s.title}>{t('library.title')}</Text>
          <Text style={s.subtitle}>
            {t('library.count', { count: results.length })}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            presentation === 'page'
              ? t('library.backProfile')
              : t('library.closeLibrary')
          }
          onPress={close}
          style={s.close}
        >
          <Text style={s.closeText}>
            {t(presentation === 'page' ? 'library.back' : 'library.close')}
          </Text>
        </Pressable>
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

      <Text style={s.filterLabel}>{t('library.muscle')}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.filterScroller}
        contentContainerStyle={s.filters}
      >
        <FilterChip
          label={t('library.all')}
          group="muscle"
          selected={!muscle}
          onPress={() => setMuscle(undefined)}
        />
        {muscleTaxonomy.map((item) => (
          <FilterChip
            key={item.id}
            label={catalogLabel(locale, 'muscle', item.id, item.label)}
            group="muscle"
            selected={muscle === item.id}
            onPress={() => setMuscle(item.id)}
          />
        ))}
      </ScrollView>

      <Text style={s.filterLabel}>{t('library.equipment')}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.filterScroller}
        contentContainerStyle={s.filters}
      >
        <FilterChip
          label={t('library.all')}
          group="equipment"
          selected={!equipment}
          onPress={() => setEquipment(undefined)}
        />
        {equipmentTaxonomy.map((item) => (
          <FilterChip
            key={item.id}
            label={catalogLabel(locale, 'equipment', item.id, item.label)}
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
                        .map((id) => catalogLabel(locale, 'equipment', id, id))
                        .join(' · ')}
                    </Text>
                  </CopyContainer>
                  {history !== undefined ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t('library.statisticsFor', { name })}
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
                        style={[s.actionText, selected && s.selectedActionText]}
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
                  <Text style={s.techniqueLabel}>{t('library.technique')}</Text>
                </Pressable>
              </View>
            );
          })
        )}
      </AppScrollView>
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
  const { t } = useLocalization();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t(
        group === 'muscle' ? 'library.filterMuscle' : 'library.filterEquipment',
        { label },
      )}
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
