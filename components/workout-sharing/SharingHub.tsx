import { formatEntryNumber } from '@/lib/i18n/format';
import { TemplateEditor } from '../TemplateEditor';
import type { TemplateDraft } from '@/lib/workout-templates';
import type { TemplateMutationResult } from '@/lib/workout-store';
import { useEffect, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppButton } from '../AppButton';
import { BrandHeader } from '../BrandHeader';
import { useLocalization } from '../LocalizationProvider';
import { PlanPreview, type ImportPlan } from './PlanPreview';
import { SharePlanSheet } from './SharePlanSheet';
import { PlanLibrary } from './PlanLibrary';
import { PlanScanner } from './PlanScanner';
import type { SharingClient, ResolvedPlan } from '@/lib/workout-sharing/client';
import type { WorkoutTemplate } from '@/lib/workout-model';
import { parsePlanLink } from '@/lib/workout-sharing/links';
import { exportSharedPlan } from '@/lib/workout-sharing/adapter';
import { catalogLabel } from '@/lib/i18n/catalog';
import { findExercise } from '@/lib/exercise-library';
import { isBuiltInTemplate } from '@/lib/workout-templates';
import { colors, spacing, typography, radius } from '@/lib/theme';
export function SharingHub({
  templates,
  busy,
  client,
  signedIn,
  onClose,
  onImport,
  onStart,
  onContinue,
  hasActiveWorkout,
  initialTemplate,
  initialToken,
  onUpdate,
  onCreate,
  onManage,
  onEditorChange,
}: {
  templates: WorkoutTemplate[];
  busy: boolean;
  client: SharingClient | null;
  signedIn: boolean;
  onClose: () => void;
  onImport: ImportPlan;
  onStart: (t: WorkoutTemplate) => void;
  onContinue: () => void;
  hasActiveWorkout: boolean;
  initialTemplate?: WorkoutTemplate;
  initialToken?: string;
  onCreate?: (draft: TemplateDraft) => Promise<TemplateMutationResult>;
  onManage?: () => void;
  onEditorChange?: (editing: boolean) => void;
  onUpdate?: (
    id: string,
    draft: TemplateDraft,
  ) => Promise<TemplateMutationResult>;
}) {
  const { t, locale } = useLocalization();
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editingExercise, setEditingExercise] = useState<string>();
  const [creating, setCreating] = useState(false);
  useEffect(() => {
    onEditorChange?.(creating || editing);
    return () => onEditorChange?.(false);
  }, [creating, editing, onEditorChange]);
  const [selected, setSelected] = useState(initialTemplate?.id);
  const [screen, setScreen] = useState<'mine' | 'library' | 'share' | 'scan'>(
    'mine',
  );
  const [resolved, setResolved] = useState<ResolvedPlan | null>(null);
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(!!initialToken && !!client);
  const [error, setError] = useState(false);
  const epoch = useRef(0);
  const template = templates.find((v) => v.id === selected);
  const open = async (value: string, library = false) => {
    const id = ++epoch.current;
    setLoading(true);
    setError(false);
    setResolved(null);
    try {
      if (!client) throw Error();
      const token = library ? null : parsePlanLink(value, client.host)?.token;
      if (!library && !token) throw Error();
      const result = library
        ? await client.resolveLibrary(value)
        : await client.resolve(token!);
      if (id === epoch.current) {
        setResolved(result);
        setSelected(undefined);
        setScreen('mine');
      }
    } catch {
      if (id === epoch.current) setError(true);
    } finally {
      if (id === epoch.current) setLoading(false);
    }
  };
  useEffect(() => {
    if (!initialToken || !client) return;
    const id = ++epoch.current;
    void client
      .resolve(initialToken)
      .then(
        (result) => {
          if (id === epoch.current) setResolved(result);
        },
        () => {
          if (id === epoch.current) setError(true);
        },
      )
      .finally(() => {
        if (id === epoch.current) setLoading(false);
      });
    const generation = epoch;
    return () => {
      generation.current++;
    };
  }, [initialToken, client]);
  useEffect(() => {
    const generation = epoch;
    return () => {
      generation.current++;
    };
  }, []);
  const back = () => {
    epoch.current++;
    setLoading(false);
    setError(false);
    setResolved(null);
    setSelected(undefined);
    setScreen('mine');
  };
  let savedPlan: ReturnType<typeof exportSharedPlan> | undefined;
  if (template) {
    try {
      savedPlan = exportSharedPlan(template, true);
    } catch {
      /* Unsupported legacy catalog entries remain editable through existing management. */
    }
  }
  if (creating && onCreate)
    return (
      <TemplateEditor
        mode="create"
        busy={busy}
        onCancel={() => setCreating(false)}
        onSave={async (draft) => {
          const result = await onCreate(draft);
          if (result.ok) setCreating(false);
          return result;
        }}
      />
    );
  const canEdit =
    template && (isBuiltInTemplate(template.id) ? onCreate : onUpdate);
  if (editing && template && canEdit)
    return (
      <TemplateEditor
        mode="edit"
        template={template}
        initialStep={adding ? 'library' : 'composition'}
        initialExerciseId={adding ? undefined : editingExercise}
        busy={busy}
        onCancel={() => setEditing(false)}
        onSave={async (draft) => {
          const result = isBuiltInTemplate(template.id)
            ? await onCreate!(draft)
            : await onUpdate!(template.id, draft);
          if (result.ok) {
            if (result.template) setSelected(result.template.id);
            setEditing(false);
            setAdding(false);
          }
          return result;
        }}
      />
    );
  return (
    <GestureHandlerRootView style={s.root}>
      <BrandHeader />
      {Platform.OS === 'web' && initialToken ? (
        <Text style={s.copy}>{t('sharing.install')}</Text>
      ) : null}
      <AppButton
        title={t('sharing.close')}
        disabled={busy}
        onPress={onClose}
        secondary
        presentation="text"
      />
      {template || resolved || screen !== 'mine' ? (
        <AppButton
          title={t('sharing.back')}
          disabled={busy}
          onPress={back}
          secondary
          presentation="text"
        />
      ) : null}
      {error ? (
        <Text accessibilityRole="alert" style={s.copy}>
          {t('sharing.unavailable')}
        </Text>
      ) : null}
      {loading ? <Text style={s.copy}>{t('sharing.loading')}</Text> : null}
      {resolved ? (
        <PlanPreview
          key={resolved.origin.publicationId}
          {...resolved}
          onOpenSaved={(value) => {
            setSelected(value.id);
            setResolved(null);
            setScreen('mine');
          }}
          onImport={onImport}
          onStart={onStart}
          onContinue={onContinue}
          hasActiveWorkout={hasActiveWorkout}
          savedTemplate={templates.find(
            (v) =>
              v.origin?.publicationId === resolved.origin.publicationId &&
              v.origin.version === resolved.origin.version,
          )}
        />
      ) : screen === 'scan' ? (
        <PlanScanner
          onClose={back}
          onRead={(url) => {
            setScreen('mine');
            void open(url);
          }}
        />
      ) : screen === 'share' && template ? (
        <SharePlanSheet
          key={template.id + signedIn}
          template={template}
          client={client}
          signedIn={signedIn}
        />
      ) : template ? (
        <>
          <Text style={s.title}>
            {isBuiltInTemplate(template.id)
              ? catalogLabel(locale, 'template', template.id, template.name)
              : template.name}
          </Text>
          {savedPlan?.exercises.map((e) => (
            <Swipeable
              key={e.exerciseId}
              enabled={!!canEdit && !busy}
              overshootRight={false}
              renderRightActions={() => (
                <AppButton
                  title={t('templates.edit')}
                  accessibilityLabel={t('templates.editNamed', {
                    name: catalogLabel(
                      locale,
                      'exercise',
                      e.exerciseId,
                      findExercise(e.exerciseId)?.name ?? e.exerciseId,
                    ),
                  })}
                  disabled={busy}
                  onPress={() => {
                    setAdding(false);
                    setEditingExercise(e.exerciseId);
                    setEditing(true);
                  }}
                />
              )}
            >
              <View style={s.card}>
                <View style={s.exerciseHeader}>
                  <Text style={[s.name, s.start]}>
                    {catalogLabel(
                      locale,
                      'exercise',
                      e.exerciseId,
                      findExercise(e.exerciseId)?.name ?? e.exerciseId,
                    )}
                  </Text>
                  {canEdit ? (
                    <Pressable
                      style={s.more}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: busy }}
                      accessibilityLabel={t('templates.more', {
                        name: catalogLabel(
                          locale,
                          'exercise',
                          e.exerciseId,
                          findExercise(e.exerciseId)?.name ?? e.exerciseId,
                        ),
                      })}
                      disabled={busy}
                      onPress={() => {
                        setAdding(false);
                        setEditingExercise(e.exerciseId);
                        setEditing(true);
                      }}
                    >
                      <Ionicons
                        name="ellipsis-horizontal"
                        size={24}
                        color={colors.primary}
                        accessible={false}
                      />
                    </Pressable>
                  ) : null}
                </View>
                <Text style={s.copy}>
                  {t('sharing.sets', { count: e.sets })}
                </Text>
                {e.target ? (
                  <Text style={s.copy}>
                    {t('sharing.targetRange', {
                      min: e.target.repMin,
                      max: e.target.repMax,
                      restMin: e.target.restMin,
                      restMax: e.target.restMax,
                    })}
                  </Text>
                ) : null}
                {e.target?.perSide ? (
                  <Text style={s.copy}>{t('sharing.perSide')}</Text>
                ) : null}
                {e.weightKg !== undefined ? (
                  <Text style={s.copy}>
                    {t('sharing.weight', {
                      weight: formatEntryNumber(locale, e.weightKg),
                    })}
                  </Text>
                ) : null}
              </View>
            </Swipeable>
          ))}
          {!savedPlan ? (
            <Text style={s.copy}>{t('sharing.unavailable')}</Text>
          ) : null}
          {canEdit ? (
            <>
              {isBuiltInTemplate(template.id) ? (
                <Text style={s.copy}>{t('sharing.editCopy')}</Text>
              ) : null}
              <AppButton
                title={t('editor.addExercise')}
                secondary
                disabled={busy}
                onPress={() => {
                  setAdding(true);
                  setEditing(true);
                }}
              />
            </>
          ) : null}
          <View style={s.row}>
            <View style={s.start}>
              <AppButton
                title={t(
                  hasActiveWorkout ? 'sharing.continue' : 'sharing.start',
                )}
                disabled={busy || !savedPlan}
                onPress={() =>
                  hasActiveWorkout ? onContinue() : onStart(template)
                }
              />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('sharing.share')}
              disabled={busy || !savedPlan}
              onPress={() => setScreen('share')}
              style={s.share}
            >
              <Ionicons name="share-outline" size={24} color={colors.surface} />
            </Pressable>
          </View>
        </>
      ) : screen === 'library' ? (
        <PlanLibrary client={client} onSelect={(id) => void open(id, true)} />
      ) : (
        <>
          <Text style={s.title}>{t('sharing.title')}</Text>
          {onCreate ? (
            <AppButton
              title={t('templates.create')}
              onPress={() => setCreating(true)}
              disabled={busy}
            />
          ) : null}
          <AppButton
            title={t('sharing.library')}
            onPress={() => setScreen('library')}
            disabled={busy || !client}
            secondary
          />
          {client ? (
            <>
              <AppButton
                title={t('sharing.scan')}
                onPress={() => setScreen('scan')}
                disabled={busy}
              />
              <TextInput
                value={link}
                onChangeText={setLink}
                accessibilityLabel={t('sharing.paste')}
                placeholder={t('sharing.paste')}
                autoCapitalize="none"
                autoCorrect={false}
                style={s.input}
              />
              <AppButton
                title={t('sharing.open')}
                onPress={() => void open(link.trim())}
                disabled={busy || loading || !link.trim()}
              />
            </>
          ) : (
            <Text style={s.copy}>{t('sharing.unconfigured')}</Text>
          )}
          {templates.map((v) => (
            <AppButton
              key={v.id}
              title={
                isBuiltInTemplate(v.id)
                  ? catalogLabel(locale, 'template', v.id, v.name)
                  : v.name
              }
              onPress={() => setSelected(v.id)}
              disabled={busy}
              secondary
            />
          ))}
          {onManage ? (
            <AppButton
              title={t('sharing.manage')}
              onPress={onManage}
              disabled={busy}
              secondary
              presentation="text"
            />
          ) : null}
        </>
      )}
    </GestureHandlerRootView>
  );
}
const s = StyleSheet.create({
  more: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  root: { gap: spacing.md },
  title: { ...typography.title1, color: colors.textPrimary },
  name: { ...typography.headline, color: colors.textPrimary },
  copy: { ...typography.footnote, color: colors.textSecondary },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  row: { flexDirection: 'row', gap: spacing.xs, alignItems: 'stretch' },
  start: { flex: 1 },
  share: {
    minWidth: 56,
    minHeight: 56,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 44,
  },
});
