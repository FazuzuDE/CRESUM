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
  findTechnique,
  techniqueSources,
  type TechniquePhase,
} from '@/lib/exercise-technique';
import { equipmentLabel, muscleLabel } from '@/lib/exercise-taxonomy';
import type { LibraryExercise, WorkoutSession } from '@/lib/workout-model';
import { colors, radius, spacing, typography } from '@/lib/theme';

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
  const [tab, setTab] = useState(initialTab);
  const guide = findTechnique(exercise.id);
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
            {tab}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              history !== undefined
                ? 'Close exercise details'
                : 'Close technique'
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
                {exercise.name}
              </Text>
              <Text style={s.metadata}>
                {exercise.primaryMuscles.map(muscleLabel).join(' · ')} ·{' '}
                {exercise.equipment.map(equipmentLabel).join(' · ')}
              </Text>
            </View>
            {history !== undefined ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Expand exercise illustration"
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
                  accessibilityLabel={`Exercise detail ${value}`}
                  accessibilityState={{ selected: tab === value }}
                  onPress={() => setTab(value)}
                  style={[s.tab, value === tab && s.activeTab]}
                >
                  <Text style={[s.metadata, value === tab && s.activeTabText]}>
                    {value}
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
                name={exercise.name}
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
              accessibilityLabel="Expand exercise illustration"
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
                <Section title="Setup" items={guide.setup} />
                <Section title="Movement" items={guide.movement} />
                <Section title="Key checks" items={guide.checks} />
                <Disclosure
                  title="Common mistakes"
                  open={mistakes}
                  onPress={() => setMistakes(!mistakes)}
                />
                {mistakes ? (
                  <Section
                    title="Common mistakes"
                    items={guide.mistakes}
                    hideTitle
                  />
                ) : null}
                <Disclosure
                  title="Sources"
                  open={sources}
                  onPress={() => setSources(!sources)}
                />
                {sources ? (
                  <View style={s.sourceList}>
                    <Text style={s.metadata}>
                      CRESUM summaries of the references below. Source-checked
                      12 Oct 2026; not an individualized assessment.
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
                          accessibilityLabel={`Open source ${source.title}`}
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
                        Could not open this source. Try again when online.
                      </Text>
                    ) : null}
                  </View>
                ) : null}
                <Text style={s.metadata}>
                  Use a controllable load and follow the actual machine’s setup
                  instructions. Stop if movement causes pain; seek qualified
                  guidance for symptoms or unfamiliar equipment.
                </Text>
              </>
            ) : (
              <Text style={s.metadata}>
                Technique unavailable for this exercise.
              </Text>
            )}
          </View>
        </AppScrollView>
        {viewer ? (
          <TechniqueViewer
            name={exercise.name}
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
