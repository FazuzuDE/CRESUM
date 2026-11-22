import { LocalizedText as Text } from '@/components/LayoutDirection';
import { AppSlider } from './AppSlider';
import { formatNumber } from '@/lib/i18n/format';
import { useLocalization } from './LocalizationProvider';
import { displayAppVersion } from '@/lib/app-version';
import { AccountPage } from './AccountPage';
import type { AccountSectionProps } from './AccountSection';

import type { BackupControlsProps } from './BackupControls';
import { BackupPage, type BackupPageOptions } from './BackupPage';
import { Children, useState, type ReactNode } from 'react';
import { useExerciseCharacter } from './ExerciseCharacterProvider';
import { LanguageSettings } from './LanguageSettings';
import { ExerciseCharacterSettings } from './ExerciseCharacterPicker';
import { AppScrollView } from './AppScrollView';
import { StyleSheet, View } from 'react-native';
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
  dockTransparency?: number;
  headerOpacity?: number;
  onHeaderOpacityChange?: (value: number) => void;
  onHeaderOpacityCommit?: (value: number) => void;
  onDockTransparencyChange?: (value: number) => void;
  onDockTransparencyCommit?: (value: number) => void;
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
  dockTransparency,
  headerOpacity,
  onHeaderOpacityChange,
  onHeaderOpacityCommit,
  onDockTransparencyChange,
  onDockTransparencyCommit,
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
  const { model } = useExerciseCharacter();
  const [detail, setDetail] = useState<
    'appearance' | 'character' | 'data' | null
  >(null);
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
      <AppScrollView branded dockAware contentContainerStyle={s.content}>
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
  if (detail) {
    const title =
      detail === 'appearance'
        ? t('profile.appearance')
        : detail === 'character'
          ? t('character.title')
          : t('profile.localData');
    return (
      <AppScrollView
        key={detail}
        branded
        dockAware
        contentContainerStyle={s.content}
      >
        <AppButton
          title={t('profile.back')}
          presentation="text"
          onPress={() => setDetail(null)}
        />
        <Text style={s.title} accessibilityRole="header">
          {title}
        </Text>
        {detail === 'appearance' ? (
          <>
            {headerOpacity !== undefined ? (
              <PercentSetting
                label={t('profile.headerOpacity')}
                value={headerOpacity}
                onPreview={onHeaderOpacityChange}
                onCommit={onHeaderOpacityCommit}
              />
            ) : null}
            {dockTransparency !== undefined ? (
              <PercentSetting
                label={t('profile.dockTransparency')}
                value={dockTransparency}
                onPreview={onDockTransparencyChange}
                onCommit={onDockTransparencyCommit}
              />
            ) : null}
          </>
        ) : null}
        {detail === 'character' ? (
          <GlassCard style={s.card}>
            <ExerciseCharacterSettings />
          </GlassCard>
        ) : null}
        {detail === 'data' ? (
          <GlassCard style={s.card}>
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
        ) : null}
      </AppScrollView>
    );
  }
  return (
    <AppScrollView
      key="profile"
      branded
      dockAware
      contentContainerStyle={s.content}
    >
      <Text style={s.title} accessibilityRole="header">
        {t('profile.title')}
      </Text>
      <ProfileGroup title={t('profile.trainingSection')}>
        <AppButton
          title={t('profile.myWorkouts')}
          icon="barbell-outline"
          presentation="settings"
          onPress={() =>
            onOpenPlans
              ? onOpenPlans(() => setWorkoutsOpen(true))
              : setWorkoutsOpen(true)
          }
        />
        <AppButton
          title={t('library.title')}
          icon="book-outline"
          value={t('profile.exercises', {
            count: searchLocalizedExercises({}, locale).length,
          })}
          presentation="settings"
          onPress={() => setLibraryOpen(true)}
        />
      </ProfileGroup>
      <ProfileGroup title={t('profile.settingsSection')}>
        {onPersonalize ? (
          <AppButton
            title={t('profile.personalize')}
            icon="person-outline"
            presentation="settings"
            onPress={onPersonalize}
          />
        ) : null}
        <LanguageSettings settingsRow />
        <AppButton
          title={t('character.title')}
          icon="body-outline"
          value={
            model === 'female' ? t('character.female') : t('character.male')
          }
          presentation="settings"
          onPress={() => setDetail('character')}
        />
        {dockTransparency !== undefined || headerOpacity !== undefined ? (
          <AppButton
            title={t('profile.appearance')}
            icon="sunny-outline"
            presentation="settings"
            onPress={() => setDetail('appearance')}
          />
        ) : null}
      </ProfileGroup>
      <ProfileGroup title={t('profile.dataSection')}>
        {account ? (
          <AppButton
            title={t('account.title')}
            icon="person-circle-outline"
            presentation="settings"
            onPress={() => setAccountOpen(true)}
          />
        ) : null}
        {backup ? (
          <AppButton
            title={t('backup.title')}
            icon="archive-outline"
            presentation="settings"
            onPress={() => setBackupOpen(true)}
          />
        ) : null}
        <AppButton
          title={t('profile.localData')}
          icon="save-outline"
          presentation="settings"
          onPress={() => setDetail('data')}
        />
      </ProfileGroup>
      <View style={s.about}>
        <Text style={s.aboutTitle}>CRESUM</Text>
        <Text style={s.sub}>{t('profile.about')}</Text>
        {version ? (
          <Text style={s.sub}>
            {t('profile.version', { version: displayAppVersion(version) })}
          </Text>
        ) : null}
      </View>
    </AppScrollView>
  );
}

function PercentSetting({
  label,
  value,
  onPreview,
  onCommit,
}: {
  label: string;
  value: number;
  onPreview?: (value: number) => void;
  onCommit?: (value: number) => void;
}) {
  const { locale } = useLocalization();
  const [gestureValue, setGestureValue] = useState<number | null>(null);
  const percent = formatNumber(locale, value / 100, { style: 'percent' });
  return (
    <GlassCard style={s.card}>
      <View style={s.percentHeading}>
        <Text style={s.percentLabel} accessibilityRole="header">
          {label}
        </Text>
        <Text style={s.percentValue}>{percent}</Text>
      </View>
      <AppSlider
        accessibilityLabel={label}
        accessibilityRole="adjustable"
        accessibilityValue={{ min: 0, max: 100, now: value, text: percent }}
        minimumValue={0}
        maximumValue={100}
        step={1}
        value={gestureValue ?? value}
        onSlidingStart={() => setGestureValue(value)}
        onValueChange={(next) => {
          if (gestureValue === null) onCommit?.(next);
          else onPreview?.(next);
        }}
        onSlidingComplete={(next) => {
          setGestureValue(null);
          onCommit?.(next);
        }}
      />
    </GlassCard>
  );
}

function ProfileGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={s.group}>
      <Text style={s.groupTitle} accessibilityRole="header">
        {title}
      </Text>
      <View style={s.groupCard}>
        {Children.toArray(children).map((row, index) => (
          <View key={index}>
            {index > 0 ? <View style={s.menuSeparator} /> : null}
            {row}
          </View>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  percentHeading: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  percentLabel: { ...typography.headline, color: colors.textPrimary, flex: 1 },
  percentValue: {
    ...typography.footnote,
    color: colors.textSecondary,
  },
  group: { gap: spacing.xs },
  groupTitle: {
    ...typography.headline,
    color: colors.textSecondary,
    paddingHorizontal: spacing.xs,
  },
  groupCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  menuSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
    marginHorizontal: spacing.md,
  },
  about: { gap: spacing.xxs, paddingHorizontal: spacing.xs },
  content: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    padding: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
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
