import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { recoverLocalRestore } from '@/lib/local-backup';
import { colors, spacing, typography } from '@/lib/theme';
import { AppButton } from './AppButton';

export type RunDataOperation = (
  work: (allowReloadAfterRecovery: () => void) => Promise<string>,
  returnToProfile: boolean,
) => void;
export function LocalDataGate({
  children,
}: {
  children: (
    run: RunDataOperation,
    notice: string,
    profile: boolean,
  ) => ReactNode;
}) {
  const [phase, setPhase] = useState<
    'recovering' | 'ready' | 'working' | 'blocked'
  >('recovering');
  const [notice, setNotice] = useState('');
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
      setNotice((problem as Error).message);
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
            setNotice(problem.message);
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
  const run: RunDataOperation = (work, returnToProfile) => {
    if (running.current) return;
    running.current = true;
    setPhase('working');
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
        setNotice(
          problem instanceof Error
            ? problem.message
            : 'Local data operation failed. Try again.',
        );
        setProfile(true);
        try {
          await recoverLocalRestore(AsyncStorage);
          if (reloadAfterRecovery.current) {
            setGeneration((v) => v + 1);
            reloadAfterRecovery.current = false;
          }
          setPhase('ready');
        } catch (recoveryError) {
          setNotice((recoveryError as Error).message);
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
          {children(run, notice, profile)}
        </View>
      ) : null}
      {phase !== 'ready' ? (
        <SafeAreaView style={s.root}>
          {phase === 'blocked' ? (
            <>
              <Text accessibilityRole="alert" style={s.text}>
                {notice}
              </Text>
              <AppButton
                title="Retry recovery"
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
                  ? 'Preparing local data…'
                  : 'Checking local data…'}
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
