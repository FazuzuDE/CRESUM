import { useState } from 'react';
import { BrandHeader } from './BrandHeader';
import { ExerciseStatistics } from './ExerciseStatistics';
import { ExerciseArtwork } from './ExerciseArtwork';
import {
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppScrollView } from './AppScrollView';
import { TechniqueArtwork } from './TechniqueArtwork';
import { TechniquePhaseControl } from './TechniquePhaseControl';
import { TechniqueViewer } from './TechniqueViewer';
import {
  techniqueSources,
  type TechniquePhase,
} from '@/lib/exercise-technique';
import { equipmentLabel, muscleLabel } from '@/lib/exercise-taxonomy';
import type { LibraryExercise, WorkoutSession } from '@/lib/workout-model';
import { colors, radius, spacing, typography } from '@/lib/theme';
import { useLocalization } from './LocalizationProvider';
import { catalogLabel } from '@/lib/i18n/catalog';
import { formatDate } from '@/lib/i18n/format';
import { localizedTechnique } from '@/lib/i18n/technique';

export function ExerciseTechnique({
  exercise,
  onClose,
  history,
  initialTab = 'Technique',
  now,
}: {
  exercise: LibraryExercise;
  onClose: () => void;
  history?: readonly WorkoutSession[];
  initialTab?: 'Technique' | 'Statistics';
  now?: number;
}) {
  const { t, locale } = useLocalization();
  const exerciseName = catalogLabel(
    locale,
    'exercise',
    exercise.id,
    exercise.name,
  );
  const [tab, setTab] = useState(initialTab);
  const guide = localizedTechnique(locale, exercise.id);
  const [phase, setPhase] = useState<TechniquePhase>('START'),
    [viewer, setViewer] = useState(false),
    [mistakes, setMistakes] = useState(false),
    [sources, setSources] = useState(false),
    [linkError, setLinkError] = useState(false);
  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      allowSwipeDismissal
      onRequestClose={onClose}
    >
      <SafeAreaView style={s.root}>
        <View style={s.grabber} />
        <BrandHeader tagline={false} />
        <View style={s.header}>
          <Text accessibilityRole="header" style={s.headerTitle}>
            {tab === 'Technique'
              ? t('technique.title')
              : t('technique.statistics')}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              history !== undefined
                ? t('technique.closeDetails')
                : t('technique.close')
            }
            onPress={onClose}
            style={s.close}
          >
            <Ionicons name="close" size={22} color={colors.textPrimary} />
          </Pressable>
        </View>
        <AppScrollView contentContainerStyle={s.content}>
          <View style={s.detailHeading}>
            <View style={s.headingCopy}>
              <Text accessibilityRole="header" style={s.title}>
                {exerciseName}
              </Text>
              <Text style={s.metadata}>
                {exercise.primaryMuscles
                  .map((id) =>
                    catalogLabel(locale, 'muscle', id, muscleLabel(id)),
                  )
                  .join(' · ')}{' '}
                ·{' '}
                {exercise.equipment
                  .map((id) =>
                    catalogLabel(locale, 'equipment', id, equipmentLabel(id)),
                  )
                  .join(' · ')}
              </Text>
            </View>
            {history !== undefined ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('technique.expand')}
                onPress={() => setViewer(true)}
                style={s.thumbnail}
              >
                <ExerciseArtwork imageKey={exercise.imageKey} size={76} />
              </Pressable>
            ) : null}
          </View>
          {history !== undefined ? (
            <View style={s.tabs}>
              {(['Technique', 'Statistics'] as const).map((value) => (
                <Pressable
                  key={value}
                  accessibilityRole="button"
                  accessibilityLabel={t('technique.tab', {
                    tab:
                      value === 'Technique'
                        ? t('technique.title')
                        : t('technique.statistics'),
                  })}
                  accessibilityState={{ selected: tab === value }}
                  onPress={() => setTab(value)}
                  style={[s.tab, value === tab && s.activeTab]}
                >
                  <Text style={[s.metadata, value === tab && s.activeTabText]}>
                    {value === 'Technique'
                      ? t('technique.title')
                      : t('technique.statistics')}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          {history !== undefined ? (
            <View
              style={tab === 'Statistics' ? undefined : { display: 'none' }}
              accessibilityElementsHidden={tab !== 'Statistics'}
              importantForAccessibility={
                tab === 'Statistics' ? 'auto' : 'no-hide-descendants'
              }
            >
              <ExerciseStatistics
                history={history}
                exerciseId={exercise.id}
                name={exerciseName}
                now={now}
              />
            </View>
          ) : null}
          <View
            accessibilityElementsHidden={tab !== 'Technique'}
            importantForAccessibility={
              tab === 'Technique' ? 'auto' : 'no-hide-descendants'
            }
            style={[
              s.techniqueContent,
              tab === 'Statistics' && { display: 'none' },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('technique.expand')}
              onPress={() => setViewer(true)}
              style={s.artwork}
            >
              <TechniqueArtwork imageKey={exercise.imageKey} phase={phase} />
              <View style={s.expand}>
                <Ionicons
                  name="expand-outline"
                  size={20}
                  color={colors.textPrimary}
                />
              </View>
            </Pressable>
            <TechniquePhaseControl phase={phase} onChange={setPhase} />
            {guide ? (
              <>
                <Text style={s.metadata}>{guide.scope}</Text>
                <Section title={t('technique.setup')} items={guide.setup} />
                <Section
                  title={t('technique.movement')}
                  items={guide.movement}
                />
                <Section title={t('technique.checks')} items={guide.checks} />
                <Disclosure
                  title={t('technique.mistakes')}
                  open={mistakes}
                  onPress={() => setMistakes(!mistakes)}
                />
                {mistakes ? (
                  <Section
                    title={t('technique.mistakes')}
                    items={guide.mistakes}
                    hideTitle
                  />
                ) : null}
                <Disclosure
                  title={t('technique.sources')}
                  open={sources}
                  onPress={() => setSources(!sources)}
                />
                {sources ? (
                  <View style={s.sourceList}>
                    <Text style={s.metadata}>
                      {t('technique.sourceNote', {
                        date: formatDate(
                          locale,
                          new Date(2026, 9, 12).getTime(),
                          { day: 'numeric', month: 'short', year: 'numeric' },
                        ),
                      })}
                    </Text>
                    {guide.adaptation ? (
                      <Text style={s.metadata}>{guide.adaptation}</Text>
                    ) : null}
                    {guide.sources.map((id) => {
                      const source = techniqueSources[id];
                      return (
                        <Pressable
                          key={id}
                          accessibilityRole="link"
                          accessibilityLabel={t('technique.openSource', {
                            title: source.title,
                          })}
                          onPress={() => {
                            setLinkError(false);
                            void Linking.openURL(source.url).catch(() =>
                              setLinkError(true),
                            );
                          }}
                          style={s.source}
                        >
                          <Text style={s.link}>{source.title}</Text>
                          <Text style={s.metadata}>{source.publisher}</Text>
                        </Pressable>
                      );
                    })}
                    {linkError ? (
                      <Text accessibilityRole="alert" style={s.error}>
                        {t('technique.linkError')}
                      </Text>
                    ) : null}
                  </View>
                ) : null}
                <Text style={s.metadata}>{t('technique.safety')}</Text>
              </>
            ) : (
              <Text style={s.metadata}>{t('technique.unavailable')}</Text>
            )}
          </View>
        </AppScrollView>
        {viewer ? (
          <TechniqueViewer
            name={exerciseName}
            imageKey={exercise.imageKey}
            phase={phase}
            onPhase={setPhase}
            onClose={() => setViewer(false)}
          />
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}
function Section({
  title,
  items,
  hideTitle = false,
}: {
  title: string;
  items: readonly string[];
  hideTitle?: boolean;
}) {
  return (
    <View style={s.section}>
      {!hideTitle ? (
        <Text accessibilityRole="header" style={s.sectionTitle}>
          {title}
        </Text>
      ) : null}
      {items.map((item, index) => (
        <Text key={item} style={s.body}>
          {items.length > 1 ? `${index + 1}. ` : ''}
          {item}
        </Text>
      ))}
    </View>
  );
}
function Disclosure({
  title,
  open,
  onPress,
}: {
  title: string;
  open: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ expanded: open }}
      onPress={onPress}
      style={s.disclosure}
    >
      <Text style={[s.body, { flex: 1, flexShrink: 1 }]}>{title}</Text>
      <Ionicons
        name={open ? 'chevron-up' : 'chevron-forward'}
        size={18}
        color={colors.textSecondary}
      />
    </Pressable>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.separator,
    alignSelf: 'center',
    marginTop: spacing.xs,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { ...typography.headline, color: colors.textPrimary },
  close: {
    width: 44,
    minHeight: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: spacing.md, gap: spacing.md },
  techniqueContent: { gap: spacing.md },
  detailHeading: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  headingCopy: { flex: 1, minWidth: 120 },
  thumbnail: { minWidth: 76, minHeight: 76 },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSubtle,
    padding: spacing.xxs,
    borderRadius: radius.md,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xs,
    borderRadius: radius.sm,
  },
  activeTab: { backgroundColor: colors.primaryTint },
  activeTabText: { color: colors.primary },
  title: { ...typography.title1, color: colors.textPrimary },
  metadata: { ...typography.footnote, color: colors.textSecondary },
  artwork: { position: 'relative' },
  expand: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: { gap: spacing.xs },
  sectionTitle: { ...typography.headline, color: colors.textPrimary },
  body: { ...typography.callout, color: colors.textPrimary },
  disclosure: {
    minHeight: 48,
    borderTopWidth: 1,
    borderTopColor: colors.separator,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sourceList: { gap: spacing.sm },
  source: { minHeight: 44, gap: spacing.xxs, paddingVertical: spacing.xs },
  link: { ...typography.footnote, color: colors.primary },
  error: { ...typography.footnote, color: colors.danger },
});
