import { useLocalization } from './LocalizationProvider';
import { displayAppVersion } from '@/lib/app-version';
import { AccountPage } from './AccountPage';
import type { AccountSectionProps } from './AccountSection';
import { Ionicons } from '@expo/vector-icons';
import type { BackupControlsProps } from './BackupControls';
import { BackupPage, type BackupPageOptions } from './BackupPage';
import { useState } from 'react';
import { BrandHeader } from './BrandHeader';
import { LanguageSettings } from './LanguageSettings';
import { AppScrollView } from './AppScrollView';
import { StyleSheet, Text, View } from 'react-native';
import { GlassCard } from './GlassCard';
import { AppButton } from './AppButton';
import { ExerciseLibrary } from './ExerciseLibrary';
import { WorkoutTemplates } from './WorkoutTemplates';
import { defaultTemplates } from '@/lib/workout-catalog';
import type { WorkoutTemplate, WorkoutSession } from '@/lib/workout-model';
import type { TemplateMutationResult } from '@/lib/workout-store';
import type { TemplateDraft } from '@/lib/workout-templates';
import { colors, radius, spacing, typography } from '@/lib/theme';
import { catalogLabel, searchLocalizedExercises } from '@/lib/i18n/catalog';

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
  onOpenPlans?: (onManage: () => void) => void;
  startTemplate?: (template: WorkoutTemplate) => void;
  hideBuiltIn?: (templateId: string) => Promise<boolean>;
  restoreBuiltIn?: (templateId: string) => Promise<boolean>;
  hiddenBuiltInIds?: string[];
  hiddenError?: string;
  hasActiveWorkout?: boolean;
  onPersonalize?: () => void;
  onResetLocalData?: () => void;
  account?: AccountSectionProps;
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
  onOpenPlans,
  hideBuiltIn,
  restoreBuiltIn,
  hiddenBuiltInIds = [],
  hiddenError,
  hasActiveWorkout = false,
  onPersonalize,
  onResetLocalData,
  backup,
  account,
}: ProfileSettingsProps) {
  const { t, locale } = useLocalization();
  const [accountOpen, setAccountOpen] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [workoutsOpen, setWorkoutsOpen] = useState(false);
  const [workoutEditing, setWorkoutEditing] = useState(false);
  if (accountOpen && account)
    return (
      <AccountPage account={account} onClose={() => setAccountOpen(false)} />
    );
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
          title={t('profile.back')}
          disabled={workoutEditing || busy}
          secondary
          presentation="text"
          onPress={() => setWorkoutsOpen(false)}
        />
        <Text
          style={[s.title, { letterSpacing: 4 }]}
          accessibilityRole="header"
        >
          {t('profile.workouts')}
        </Text>
        <Text style={s.subtitle}>{t('profile.routines')}</Text>
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
              {t('profile.hidden')}
            </Text>
            <Text style={s.sub}>{t('profile.restoreHint')}</Text>
            {defaultTemplates
              .filter((template) => hiddenBuiltInIds.includes(template.id))
              .map((template) => (
                <View key={template.id} style={s.restoreRow}>
                  <Text style={s.restoreName}>
                    {catalogLabel(
                      locale,
                      'template',
                      template.id,
                      template.name,
                    )}
                  </Text>
                  <AppButton
                    title={t('profile.restore')}
                    accessibilityLabel={t('profile.restoreLabel', {
                      name: catalogLabel(
                        locale,
                        'template',
                        template.id,
                        template.name,
                      ),
                    })}
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
            {t('error.hiddenWorkouts')}
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
            {t('profile.title')}
          </Text>
          <Text style={s.subtitle}>{t('profile.subtitle')}</Text>
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
              title={t('profile.workouts')}
              wordmark
              secondary
              presentation="row"
              onPress={() =>
                onOpenPlans
                  ? onOpenPlans(() => setWorkoutsOpen(true))
                  : setWorkoutsOpen(true)
              }
            />
            <Text style={s.sub}>
              {t('profile.saved', { count: templates.length })}
            </Text>
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
              title={t('profile.library')}
              wordmark
              secondary
              presentation="row"
              onPress={() => setLibraryOpen(true)}
            />
            <Text style={s.sub}>
              {t('profile.exercises', {
                count: searchLocalizedExercises({}, locale).length,
              })}
            </Text>
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
                  title={t('profile.personalize')}
                  secondary
                  presentation="row"
                  onPress={onPersonalize}
                />
                <Text style={s.sub}>{t('profile.preferences')}</Text>
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
                title={t('backup.title')}
                secondary
                presentation="row"
                onPress={() => setBackupOpen(true)}
              />
              <Text style={s.sub}>{t('profile.backupHint')}</Text>
            </View>
          </View>
        </GlassCard>
      ) : null}
      {account ? (
        <GlassCard>
          <View style={s.menuRow}>
            <View style={s.menuIcon}>
              <Ionicons
                name="person-circle-outline"
                size={24}
                color={colors.textPrimary}
              />
            </View>
            <View style={s.menuCopy}>
              <AppButton
                title={t('account.title')}
                secondary
                presentation="row"
                onPress={() => setAccountOpen(true)}
              />
              <Text style={s.sub}>
                {account.snapshot.status === 'signed_in'
                  ? t('profile.connected')
                  : t('profile.optionalEmail')}
              </Text>
            </View>
          </View>
        </GlassCard>
      ) : null}
      <GlassCard style={s.card}>
        <LanguageSettings />
      </GlassCard>
      <GlassCard style={s.card}>
        <Text style={s.sectionTitle} accessibilityRole="header">
          {t('profile.localData')}
        </Text>
        <Text style={s.sub}>{t('profile.removeHint')}</Text>
        {onResetLocalData ? (
          <AppButton
            title={t('profile.reset')}
            destructive
            presentation="text"
            disabled={busy}
            onPress={onResetLocalData}
          />
        ) : null}
      </GlassCard>

      <GlassCard style={s.card}>
        <Text style={s.aboutTitle}>CRESUM</Text>
        <Text style={s.sub}>{t('profile.about')}</Text>
        {version ? (
          <Text style={s.sub}>
            {t('profile.version', { version: displayAppVersion(version) })}
          </Text>
        ) : null}
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
