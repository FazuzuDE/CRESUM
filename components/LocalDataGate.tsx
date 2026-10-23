import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { recoverLocalRestore } from '@/lib/local-backup';
import { colors, spacing, typography } from '@/lib/theme';
import { AppButton } from './AppButton';
import { useLocalization } from './LocalizationProvider';
import { presentAppError } from '@/lib/i18n/errors';
import type { Translate } from '@/lib/i18n/messages';

export type RunDataOperation = (
  work: (allowReloadAfterRecovery: () => void) => Promise<string>,
  returnToProfile: boolean,
  presentNotice?: (t: Translate) => string,
) => void;
export function LocalDataGate({
  children,
}: {
  children: (
    run: RunDataOperation,
    notice: string,
    profile: boolean,
    access: { ready: boolean; isReady: () => boolean },
  ) => ReactNode;
}) {
  const { t } = useLocalization();
  const [phase, setPhase] = useState<
    'recovering' | 'ready' | 'working' | 'blocked'
  >('recovering');
  const [notice, setNotice] = useState('');
  const [problem, setProblem] = useState<{ error: unknown }>();
  const [noticePresenter, setNoticePresenter] =
    useState<(t: Translate) => string>();
  const shownNotice = problem
    ? presentAppError(
        t,
        problem.error,
        phase === 'blocked' ? 'error.localRecovery' : 'error.localOperation',
      )
    : notice && noticePresenter
      ? noticePresenter(t)
      : notice;
  const [profile, setProfile] = useState(false);
  const running = useRef(false);
  const reloadAfterRecovery = useRef(false);
  const [loaded, setLoaded] = useState(false);
  const [generation, setGeneration] = useState(0);
  const recover = async () => {
    if (running.current) return;
    running.current = true;
    try {
      await recoverLocalRestore(AsyncStorage);
      if (reloadAfterRecovery.current) {
        setGeneration((v) => v + 1);
        reloadAfterRecovery.current = false;
      }
      setLoaded(true);
      setPhase('ready');
    } catch (problem) {
      setProblem({ error: problem });
      setPhase('blocked');
    } finally {
      running.current = false;
    }
  };
  useEffect(() => {
    let mounted = true;
    running.current = true;
    void recoverLocalRestore(AsyncStorage)
      .then(
        () => {
          if (mounted) {
            setLoaded(true);
            setPhase('ready');
          }
        },
        (problem) => {
          if (mounted) {
            setProblem({ error: problem });
            setPhase('blocked');
          }
        },
      )
      .finally(() => {
        running.current = false;
      });
    return () => {
      mounted = false;
    };
  }, []);
  const run: RunDataOperation = (work, returnToProfile, presentNotice) => {
    if (running.current) return;
    running.current = true;
    setPhase('working');
    setProblem(undefined);
    setNoticePresenter(() => presentNotice);
    void (async () => {
      try {
        setNotice(
          await work(() => {
            reloadAfterRecovery.current = true;
          }),
        );
        reloadAfterRecovery.current = false;
        setProfile(returnToProfile);
        if (!returnToProfile) setGeneration((v) => v + 1);
        setPhase('ready');
      } catch (problem) {
        setProblem({ error: problem });
        setProfile(true);
        try {
          await recoverLocalRestore(AsyncStorage);
          if (reloadAfterRecovery.current) {
            setGeneration((v) => v + 1);
            reloadAfterRecovery.current = false;
          }
          setPhase('ready');
        } catch (recoveryError) {
          setProblem({ error: recoveryError });
          setPhase('blocked');
        }
      } finally {
        running.current = false;
      }
    })();
  };
  return (
    <View style={s.container}>
      {loaded ? (
        <View
          key={generation}
          style={[s.container, phase !== 'ready' && { display: 'none' }]}
          pointerEvents={phase === 'ready' ? 'auto' : 'none'}
          accessibilityElementsHidden={phase !== 'ready'}
          importantForAccessibility={
            phase === 'ready' ? 'auto' : 'no-hide-descendants'
          }
        >
          {/* The render callback only passes this handler to event props. */}
          {/* eslint-disable-next-line react-hooks/refs */}
          {children(run, shownNotice, profile, {
            ready: phase === 'ready',
            isReady: () => phase === 'ready' && !running.current,
          })}
        </View>
      ) : null}
      {phase !== 'ready' ? (
        <SafeAreaView style={s.root}>
          {phase === 'blocked' ? (
            <>
              <Text accessibilityRole="alert" style={s.text}>
                {shownNotice}
              </Text>
              <AppButton
                title={t('recovery.retry')}
                onPress={() => {
                  setPhase('recovering');
                  void recover();
                }}
              />
            </>
          ) : (
            <>
              <ActivityIndicator />
              <Text style={s.text}>
                {phase === 'working'
                  ? t('recovery.preparing')
                  : t('recovery.checking')}
              </Text>
            </>
          )}
        </SafeAreaView>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  root: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    gap: spacing.md,
    justifyContent: 'center',
  },
  text: { ...typography.body, color: colors.textPrimary },
});
