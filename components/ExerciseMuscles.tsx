import { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  muscleTaxonomy,
  muscleLabel,
  type MuscleId,
} from '@/lib/exercise-taxonomy';
import { anatomicalMissingGroups } from '@/lib/anatomical-muscle-map';
import type { LibraryExercise } from '@/lib/workout-model';
import { catalogLabel } from '@/lib/i18n/catalog';
import {
  colors,
  muscleMapPresentation,
  radius,
  spacing,
  typography,
} from '@/lib/theme';
import { MuscleMap } from './MuscleMap';
import { AppScrollView } from './AppScrollView';
import { useLocalization } from './LocalizationProvider';
import { useEquipmentFocus } from './useEquipmentFocus';

/** Exercise roles only; numeric flags adapt the shared map, never logged sets. */
export function ExerciseMuscles({ exercise }: { exercise: LibraryExercise }) {
  const [open, setOpen] = useState(false);
  const focus = useEquipmentFocus(open);
  const { locale, t } = useLocalization();
  const { width, fontScale } = useWindowDimensions();
  const stacked =
    width < muscleMapPresentation.compactStackWidth ||
    fontScale > muscleMapPresentation.compactStackFontScale;
  const name = catalogLabel(locale, 'exercise', exercise.id, exercise.name);
  const label = (id: MuscleId) =>
    catalogLabel(locale, 'muscle', id, muscleLabel(id));
  const names = (ids: readonly MuscleId[]) =>
    ids.map(label).join(' · ') || t('exerciseMuscles.none');
  const muscles = muscleTaxonomy.map(({ id }) => ({
    id,
    primary: Number(exercise.primaryMuscles.includes(id)),
    secondary: Number(exercise.secondaryMuscles.includes(id)),
  }));
  const involved = [...exercise.primaryMuscles, ...exercise.secondaryMuscles];
  const missing = anatomicalMissingGroups
    .filter(({ id }) => involved.includes(id))
    .map(({ id }) => id);
  const roles = () => (
    <View style={s.roles}>
      <View style={s.role}>
        <View style={[s.dot, { backgroundColor: colors.musclePrimary }]} />
        <View style={s.copy}>
          <Text style={s.roleTitle}>{t('muscle.primary')}</Text>
          <Text style={s.body}>{names(exercise.primaryMuscles)}</Text>
        </View>
      </View>
      <View style={s.role}>
        <View style={[s.dot, { backgroundColor: colors.muscleSecondary }]} />
        <View style={s.copy}>
          <Text style={s.roleTitle}>{t('muscle.secondary')}</Text>
          <Text style={s.body}>{names(exercise.secondaryMuscles)}</Text>
        </View>
      </View>
    </View>
  );
  const coverage = () => (
    <>
      {missing.length ? (
        <Text style={s.note}>
          {t('exerciseMuscles.coverage', { muscles: names(missing) })}
        </Text>
      ) : null}
      {involved.includes('rear-delts') ? (
        <Text style={s.note}>{t('muscle.rearDeltRegion')}</Text>
      ) : null}
      {involved.includes('upper-back') ? (
        <Text style={s.note}>{t('muscle.upperBackProjection')}</Text>
      ) : null}
      {involved.includes('lower-back') ? (
        <Text style={s.note}>{t('exerciseMuscles.lowerBack')}</Text>
      ) : null}
    </>
  );
  return (
    <View style={s.card}>
      <Text accessibilityRole="header" style={s.title}>
        {t('exerciseMuscles.title')}
      </Text>
      <View
        testID="exercise-muscle-summary"
        style={[s.summary, stacked && s.stacked]}
      >
        <View
          style={stacked ? s.stackedMap : s.compactMap}
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <MuscleMap
            muscles={muscles}
            height={muscleMapPresentation.compactHeight}
          />
        </View>
        <View style={s.copy}>
          {roles()}
          <Pressable
            ref={focus}
            accessibilityRole="button"
            accessibilityLabel={t('exerciseMuscles.open', { name })}
            accessibilityState={{ expanded: open }}
            onPress={() => setOpen(true)}
            style={({ pressed }) => [s.more, pressed && s.pressed]}
          >
            <Text style={s.link}>{t('exerciseMuscles.more')}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
          </Pressable>
        </View>
      </View>
      {coverage()}
      {open ? (
        <Modal
          testID="exercise-muscle-details"
          visible
          animationType="slide"
          presentationStyle="pageSheet"
          allowSwipeDismissal
          onRequestClose={() => setOpen(false)}
        >
          <SafeAreaView style={s.modal} accessibilityViewIsModal>
            <View style={s.heading}>
              <Text accessibilityRole="header" style={s.modalTitle}>
                {t('exerciseMuscles.title')}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('exerciseMuscles.close')}
                onPress={() => setOpen(false)}
                style={s.close}
              >
                <Ionicons name="close" size={22} color={colors.textPrimary} />
              </Pressable>
            </View>
            <AppScrollView contentContainerStyle={s.details}>
              <Text style={s.title}>{name}</Text>
              <View
                pointerEvents="none"
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                <MuscleMap
                  muscles={muscles}
                  height={muscleMapPresentation.height}
                />
              </View>
              {roles()}
              <Text style={s.note}>{t('exerciseMuscles.meaning')}</Text>
              {coverage()}
            </AppScrollView>
          </SafeAreaView>
        </Modal>
      ) : null}
    </View>
  );
}
const s = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.separator,
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: { ...typography.headline, color: colors.textPrimary },
  summary: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stacked: { flexDirection: 'column', alignItems: 'stretch' },
  compactMap: { flex: 1 },
  stackedMap: { alignSelf: 'center', width: '100%' },
  copy: { flex: 1, minWidth: 0 },
  roles: { gap: spacing.sm },
  role: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  dot: {
    width: spacing.xs,
    height: spacing.xs,
    borderRadius: radius.pill,
    marginTop: spacing.xs,
  },
  roleTitle: {
    ...typography.footnote,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  body: { ...typography.footnote, color: colors.textSecondary },
  note: { ...typography.footnote, color: colors.textSecondary },
  more: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingVertical: spacing.xs,
  },
  pressed: { opacity: 0.6 },
  link: { ...typography.subheadline, color: colors.primary, flexShrink: 1 },
  modal: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  heading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  modalTitle: { ...typography.title2, color: colors.textPrimary, flex: 1 },
  close: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  details: { gap: spacing.md, paddingTop: spacing.sm },
});
