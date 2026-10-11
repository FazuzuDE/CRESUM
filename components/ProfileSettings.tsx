import { useState } from 'react';
import { AppScrollView } from './AppScrollView';
import { StyleSheet, Text, View } from 'react-native';
import { GlassCard } from './GlassCard';
import { AppButton } from './AppButton';
import { WorkoutTemplates } from './WorkoutTemplates';
import { defaultTemplates } from '@/lib/workout-catalog';
import type { WorkoutTemplate } from '@/lib/workout-model';
import type { TemplateMutationResult } from '@/lib/workout-store';
import type { TemplateDraft } from '@/lib/workout-templates';
import { colors, radius, spacing, typography } from '@/lib/theme';

export type ProfileSettingsProps = {
  templates: WorkoutTemplate[];
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
};

export function ProfileSettings({
  templates,
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
}: ProfileSettingsProps) {
  const [workoutsOpen, setWorkoutsOpen] = useState(false);
  const [workoutEditing, setWorkoutEditing] = useState(false);
  if (workoutsOpen)
    return (
      <AppScrollView contentContainerStyle={s.content}>
        <View style={s.brandRow}>
          <Text style={s.brand}>CRESUM</Text>
          <Text style={s.tagline}>TRAIN. TRACK. GROW.</Text>
        </View>
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
        <View style={s.brandRow}>
          <Text style={s.brand}>CRESUM</Text>
          <Text style={s.tagline}>TRAIN. TRACK. GROW.</Text>
        </View>
        <View style={s.heading}>
          <Text style={s.title} accessibilityRole="header">
            Profile
          </Text>
          <Text style={s.subtitle}>Your workouts and app details</Text>
        </View>
      </View>

      <GlassCard style={s.card}>
        <AppButton
          title="WORKOUTS"
          wordmark
          secondary
          presentation="row"
          onPress={() => setWorkoutsOpen(true)}
        />
        <Text style={s.sub}>{templates.length} saved workouts</Text>
      </GlassCard>

      <GlassCard style={s.card}>
        <Text style={s.sectionTitle} accessibilityRole="header">
          Training preferences
        </Text>
        <Text style={s.sub}>Personalize your training at any time.</Text>
        {onPersonalize ? (
          <AppButton
            title="Personalization"
            secondary
            presentation="row"
            onPress={onPersonalize}
          />
        ) : null}
      </GlassCard>

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
  content: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    padding: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  header: { gap: spacing.lg, paddingVertical: spacing.xs },
  brandRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  brand: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 4,
    color: colors.textPrimary,
  },
  tagline: {
    ...typography.caption,
    letterSpacing: 1,
    color: colors.textSecondary,
  },
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
