import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { ExerciseEquipmentPolicy } from '@/lib/exercise-equipment';
import { isValidEquipmentPolicy } from '@/lib/exercise-equipment';
import { resolveAttachmentArtwork } from '@/lib/exercise-artwork';
import { findExercise } from '@/lib/exercise-library';
import { catalogLabel } from '@/lib/i18n/catalog';
import { colors, radius, spacing, typography } from '@/lib/theme';
import { AppScrollView } from './AppScrollView';
import { useLocalization } from './LocalizationProvider';

export function ExerciseEquipmentSheet({
  policy,
  selectedVariantId,
  onSelect,
  onClose,
}: {
  policy: ExerciseEquipmentPolicy;
  selectedVariantId: string;
  onSelect: (variantId: string) => void;
  onClose: () => void;
}) {
  const { t, locale } = useLocalization();
  if (!isValidEquipmentPolicy(policy) || policy.choices.length < 2) return null;
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <Pressable
          style={s.backdrop}
          accessibilityRole="button"
          accessibilityLabel={t('equipment.close')}
          onPress={onClose}
        />
        <SafeAreaView
          edges={['bottom', 'left', 'right']}
          style={s.sheet}
          accessibilityViewIsModal
        >
          <View style={s.grabber} />
          <View style={s.heading}>
            <Text accessibilityRole="header" style={s.title}>
              {t(policy.label)}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('equipment.close')}
              onPress={onClose}
              style={s.close}
            >
              <Ionicons name="close" size={22} color={colors.textPrimary} />
            </Pressable>
          </View>
          <AppScrollView contentContainerStyle={s.list}>
            {policy.choices.map((choice) => {
              const exercise = findExercise(choice.variantId)!;
              const name =
                choice.id === 'none'
                  ? t('equipment.none')
                  : choice.nameKey
                    ? t(choice.nameKey)
                    : catalogLabel(
                        locale,
                        'exercise',
                        exercise.id,
                        exercise.name,
                      );
              const source = resolveAttachmentArtwork(choice.variantId);
              const selected = choice.variantId === selectedVariantId;
              return (
                <Pressable
                  key={choice.id}
                  accessibilityRole="radio"
                  accessibilityLabel={name}
                  accessibilityState={{ checked: selected }}
                  onPress={() => {
                    onSelect(choice.variantId);
                    onClose();
                  }}
                  style={s.option}
                >
                  <View style={s.thumbnail}>
                    {source ? (
                      <Image
                        source={source}
                        resizeMode="contain"
                        style={s.image}
                        accessibilityLabel={name}
                      />
                    ) : (
                      <Ionicons
                        name="barbell-outline"
                        size={26}
                        color={colors.textSecondary}
                      />
                    )}
                  </View>
                  <View style={s.copy}>
                    <Text style={s.name}>{name}</Text>
                    {choice.gripKey ? (
                      <Text style={s.detail}>{t(choice.gripKey)}</Text>
                    ) : null}
                    {!source && choice.id !== 'none' ? (
                      <Text style={s.detail}>
                        {t('equipment.imageUnavailable')}
                      </Text>
                    ) : null}
                  </View>
                  <Ionicons
                    name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                    size={24}
                    color={selected ? colors.primary : colors.textTertiary}
                  />
                </Pressable>
              );
            })}
          </AppScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
const s = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.scrim,
  },
  backdrop: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    maxHeight: '80%',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.textTertiary,
    marginBottom: spacing.sm,
  },
  heading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { ...typography.title2, color: colors.textPrimary, flex: 1 },
  close: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: { paddingBottom: spacing.md },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
    minHeight: 88,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: { width: '100%', height: '100%' },
  copy: { flex: 1, minWidth: 0 },
  name: { ...typography.headline, color: colors.textPrimary },
  detail: { ...typography.footnote, color: colors.textSecondary },
});
