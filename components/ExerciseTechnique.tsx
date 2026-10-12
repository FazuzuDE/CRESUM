import { useState } from 'react';
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
import type { LibraryExercise } from '@/lib/workout-model';
import { colors, radius, spacing, typography } from '@/lib/theme';

export function ExerciseTechnique({
  exercise,
  onClose,
}: {
  exercise: LibraryExercise;
  onClose: () => void;
}) {
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
        <View style={s.header}>
          <Text accessibilityRole="header" style={s.headerTitle}>
            Technique
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close technique"
            onPress={onClose}
            style={s.close}
          >
            <Ionicons name="close" size={22} color={colors.textPrimary} />
          </Pressable>
        </View>
        <AppScrollView contentContainerStyle={s.content}>
          <View>
            <Text accessibilityRole="header" style={s.title}>
              {exercise.name}
            </Text>
            <Text style={s.metadata}>
              {exercise.primaryMuscles.map(muscleLabel).join(' · ')} ·{' '}
              {exercise.equipment.map(equipmentLabel).join(' · ')}
            </Text>
          </View>
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
                    CRESUM summaries of the references below. Source-checked 12
                    Oct 2026; not an individualized assessment.
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
