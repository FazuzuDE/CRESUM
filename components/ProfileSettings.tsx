import { Ionicons } from '@expo/vector-icons';
import type { BackupControlsProps } from './BackupControls';
import { BackupPage, type BackupPageOptions } from './BackupPage';
import { useState } from 'react';
import { BrandHeader } from './BrandHeader';
import { AppScrollView } from './AppScrollView';
import { StyleSheet, Text, View } from 'react-native';
import { GlassCard } from './GlassCard';
import { AppButton } from './AppButton';
import { ExerciseLibrary } from './ExerciseLibrary';
import { exerciseLibrary } from '@/lib/exercise-library';
import { WorkoutTemplates } from './WorkoutTemplates';
import { defaultTemplates } from '@/lib/workout-catalog';
import type { WorkoutTemplate, WorkoutSession } from '@/lib/workout-model';
import type { TemplateMutationResult } from '@/lib/workout-store';
import type { TemplateDraft } from '@/lib/workout-templates';
import { colors, radius, spacing, typography } from '@/lib/theme';

export type ProfileSettingsProps = {
  templates: WorkoutTemplate[];
  history?: readonly WorkoutSession[];
  busy: boolean;
  version?: string;
  createTemplate: (draft: TemplateDraft) => Promise<TemplateMutationResult>;
  updateTemplate: (
    templateId: string,
    draft: TemplateDraft,
  ) => Promise<TemplateMutationResult>;
  deleteTemplate: (templateId: string) => Promise<TemplateMutationResult>;
  duplicateTemplate?: (templateId: string) => Promise<TemplateMutationResult>;
  startTemplate?: (template: WorkoutTemplate) => void;
  hideBuiltIn?: (templateId: string) => Promise<boolean>;
  restoreBuiltIn?: (templateId: string) => Promise<boolean>;
  hiddenBuiltInIds?: string[];
  hiddenError?: string;
  hasActiveWorkout?: boolean;
  onPersonalize?: () => void;
  onResetLocalData?: () => void;
  backup?: BackupControlsProps & Partial<BackupPageOptions>;
};

export function ProfileSettings({
  templates,
  history = [],
  busy,
  version,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  duplicateTemplate,
  startTemplate,
  hideBuiltIn,
  restoreBuiltIn,
  hiddenBuiltInIds = [],
  hiddenError,
  hasActiveWorkout = false,
  onPersonalize,
  onResetLocalData,
  backup,
}: ProfileSettingsProps) {
  const [backupOpen, setBackupOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [workoutsOpen, setWorkoutsOpen] = useState(false);
  const [workoutEditing, setWorkoutEditing] = useState(false);
  if (backupOpen && backup)
    return (
      <BackupPage
        backup={backup}
        history={history}
        onClose={() => setBackupOpen(false)}
      />
    );
  if (libraryOpen)
    return (
      <ExerciseLibrary
        visible
        presentation="page"
        history={history}
        onClose={() => setLibraryOpen(false)}
      />
    );
  if (workoutsOpen)
    return (
      <AppScrollView contentContainerStyle={s.content}>
        <BrandHeader />
        <AppButton
          title="Back to Profile"
          disabled={workoutEditing || busy}
          secondary
          presentation="text"
          onPress={() => setWorkoutsOpen(false)}
        />
        <Text
          style={[s.title, { letterSpacing: 4 }]}
          accessibilityRole="header"
        >
          WORKOUTS
        </Text>
        <Text style={s.subtitle}>Your saved training routines</Text>
        <View style={s.section}>
          <WorkoutTemplates
            showHeading={false}
            templates={templates}
            busy={busy}
            onCreate={createTemplate}
            onUpdate={updateTemplate}
            onDelete={deleteTemplate}
            onDuplicate={duplicateTemplate}
            onStart={startTemplate}
            onHide={hideBuiltIn}
            hasActiveWorkout={hasActiveWorkout}
            onEditorChange={setWorkoutEditing}
          />
        </View>

        {hiddenBuiltInIds.length ? (
          <GlassCard style={s.card}>
            <Text style={s.sectionTitle} accessibilityRole="header">
              Hidden workouts
            </Text>
            <Text style={s.sub}>Restore a workout to your list.</Text>
            {defaultTemplates
              .filter((template) => hiddenBuiltInIds.includes(template.id))
              .map((template) => (
                <View key={template.id} style={s.restoreRow}>
                  <Text style={s.restoreName}>{template.name}</Text>
                  <AppButton
                    title="Restore"
                    accessibilityLabel={`Restore ${template.name}`}
                    presentation="text"
                    disabled={busy || !restoreBuiltIn}
                    onPress={() => void restoreBuiltIn?.(template.id)}
                  />
                </View>
              ))}
          </GlassCard>
        ) : null}
        {hiddenError ? (
          <Text accessibilityRole="alert" style={s.error}>
            {hiddenError}
          </Text>
        ) : null}
      </AppScrollView>
    );
  return (
    <AppScrollView contentContainerStyle={s.content}>
      <View style={s.header}>
        <BrandHeader />
        <View style={s.heading}>
          <Text style={s.title} accessibilityRole="header">
            Profile
          </Text>
          <Text style={s.subtitle}>Your workouts and app details</Text>
        </View>
      </View>

      <GlassCard style={s.card}>
        <View style={s.menuRow}>
          <View style={s.menuIcon}>
            <Ionicons
              name="barbell-outline"
              size={24}
              color={colors.textPrimary}
            />
          </View>
          <View style={s.menuCopy}>
            <AppButton
              title="WORKOUTS"
              wordmark
              secondary
              presentation="row"
              onPress={() => setWorkoutsOpen(true)}
            />
            <Text style={s.sub}>{templates.length} saved workouts</Text>
          </View>
        </View>
        <View style={s.menuSeparator} />
        <View style={s.menuRow}>
          <View style={s.menuIcon}>
            <Ionicons
              name="book-outline"
              size={24}
              color={colors.textPrimary}
            />
          </View>
          <View style={s.menuCopy}>
            <AppButton
              title="EXERCISE LIBRARY"
              wordmark
              secondary
              presentation="row"
              onPress={() => setLibraryOpen(true)}
            />
            <Text style={s.sub}>{exerciseLibrary.length} exercises</Text>
          </View>
        </View>
        {onPersonalize ? (
          <>
            <View style={s.menuSeparator} />
            <View style={s.menuRow}>
              <View style={s.menuIcon}>
                <Ionicons
                  name="person-outline"
                  size={24}
                  color={colors.textPrimary}
                />
              </View>
              <View style={s.menuCopy}>
                <AppButton
                  title="Personalization"
                  secondary
                  presentation="row"
                  onPress={onPersonalize}
                />
                <Text style={s.sub}>Training preferences</Text>
              </View>
            </View>
          </>
        ) : null}
      </GlassCard>
      {backup ? (
        <GlassCard style={{ ...s.card, ...s.backupCard }}>
          <View style={s.menuRow}>
            <View style={[s.menuIcon, s.backupIcon]}>
              <Ionicons
                name="archive-outline"
                size={24}
                color={colors.primary}
              />
            </View>
            <View style={s.menuCopy}>
              <AppButton
                title="Backup & restore"
                secondary
                presentation="row"
                onPress={() => setBackupOpen(true)}
              />
              <Text style={s.sub}>Files, history and backup schedule</Text>
            </View>
          </View>
        </GlassCard>
      ) : null}
      <GlassCard style={s.card}>
        <Text style={s.sectionTitle} accessibilityRole="header">
          Local data
        </Text>
        <Text style={s.sub}>Remove all CRESUM data saved on this device.</Text>
        {onResetLocalData ? (
          <AppButton
            title="Reset local data"
            destructive
            presentation="text"
            disabled={busy}
            onPress={onResetLocalData}
          />
        ) : null}
      </GlassCard>

      <GlassCard style={s.card}>
        <Text style={s.aboutTitle}>CRESUM</Text>
        <Text style={s.sub}>About the app</Text>
        {version ? <Text style={s.sub}>Version {version}</Text> : null}
      </GlassCard>
    </AppScrollView>
  );
}

const s = StyleSheet.create({
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  menuCopy: { flex: 1 },
  menuIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
  },
  menuSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
    marginVertical: spacing.sm,
  },
  backupCard: { backgroundColor: colors.primaryTint },
  backupIcon: { backgroundColor: colors.surface },
  content: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    padding: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  header: { gap: spacing.lg, paddingVertical: spacing.xs },
  heading: { gap: spacing.xxs },
  title: { ...typography.largeTitle, color: colors.textPrimary },
  sub: { ...typography.footnote, color: colors.textSecondary },
  subtitle: { ...typography.subheadline, color: colors.textSecondary },
  section: { gap: spacing.sm },
  sectionTitle: {
    ...typography.title3,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  card: { gap: spacing.sm, borderRadius: radius.xxl },
  restoreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  restoreName: { ...typography.headline, color: colors.textPrimary, flex: 1 },
  error: { ...typography.footnote, color: colors.danger },
  aboutTitle: { ...typography.headline, color: colors.textPrimary },
});
