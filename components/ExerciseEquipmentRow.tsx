import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { equipmentPolicyFor } from '@/lib/exercise-equipment';
import { resolveAttachmentArtwork } from '@/lib/exercise-artwork';
import { findExercise } from '@/lib/exercise-library';
import { catalogLabel } from '@/lib/i18n/catalog';
import { colors, radius, spacing, typography } from '@/lib/theme';
import { useLocalization } from './LocalizationProvider';
import type { Ref } from 'react';

export function ExerciseEquipmentRow({
  exerciseId,
  onPress,
  focusRef,
}: {
  exerciseId: string;
  onPress?: () => void;
  focusRef?: Ref<View>;
}) {
  const { t, locale } = useLocalization();
  const policy = equipmentPolicyFor(exerciseId);
  if (!policy) return null;
  if (policy.requirement === 'not-applicable')
    return <Text style={s.detail}>{t('equipment.notRequired')}</Text>;
  const choice = policy.choices.find((c) => c.variantId === exerciseId);
  const exercise = findExercise(exerciseId);
  const name =
    choice?.id === 'none'
      ? t('equipment.none')
      : choice?.nameKey
        ? t(choice.nameKey)
        : t('equipment.choose');
  const source = resolveAttachmentArtwork(exerciseId);
  const interactive = Boolean(onPress) && policy.choices.length > 1;
  const content = (
    <>
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
        <Text style={s.detail}>{t(policy.label)}</Text>
        <Text style={s.name}>{name}</Text>
        <Text style={s.detail}>
          {choice?.gripKey
            ? t(choice.gripKey)
            : exercise
              ? catalogLabel(locale, 'exercise', exercise.id, exercise.name)
              : t('equipment.unavailable')}
        </Text>
      </View>
      {interactive ? (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.textSecondary}
        />
      ) : null}
    </>
  );
  return interactive ? (
    <Pressable
      ref={focusRef}
      accessibilityRole="button"
      accessibilityLabel={t('equipment.change', { name })}
      accessibilityHint={t('equipment.chooseHint')}
      onPress={onPress}
      style={s.row}
    >
      {content}
    </Pressable>
  ) : (
    <View style={s.row}>{content}</View>
  );
}
const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    minHeight: 72,
  },
  thumbnail: {
    width: 64,
    height: 64,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: { width: '100%', height: '100%' },
  copy: { flex: 1, minWidth: 0 },
  name: { ...typography.headline, color: colors.textPrimary },
  detail: { ...typography.footnote, color: colors.textSecondary },
});
