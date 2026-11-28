import {
  createThemedStyles,
  useAppColors,
} from '@/components/AppThemeProvider';
import { LayoutDirectionContext } from './LayoutDirection';
import { localeRegistry } from '@/lib/i18n/registry';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import {
  ActivityIndicator,
  AppState,
  Platform,
  Text,
  View,
} from 'react-native';
import { LocaleStore, type LocaleSnapshot } from '@/lib/i18n/preference-store';
import { createTranslator } from '@/lib/i18n/engine';
import { formatLocaleTag } from '@/lib/i18n/format';
import { spacing, typography } from '@/lib/theme';
import { AppButton } from './AppButton';

const Context = createContext<LocaleStore | null>(null);
const english: LocaleSnapshot = {
  preference: 'en',
  locale: 'en',
  loading: false,
  saving: false,
  error: null,
};
const noopSubscribe = () => () => {};
const englishSnapshot = () => english;
export function useLocalization() {
  const store = useContext(Context);
  const snapshot = useSyncExternalStore(
    store?.subscribe ?? noopSubscribe,
    store?.getSnapshot ?? englishSnapshot,
    store?.getSnapshot ?? englishSnapshot,
  );
  const t = useMemo(() => createTranslator(snapshot.locale), [snapshot.locale]);
  return { ...snapshot, t, store, select: store?.select, retry: store?.load };
}
export function LocalizationProvider({
  children,
  store,
}: {
  children: ReactNode;
  store: LocaleStore;
}) {
  const colors = useAppColors();
  const s = useStyles();
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );
  const t = useMemo(() => createTranslator(snapshot.locale), [snapshot.locale]);
  useEffect(() => {
    void store.load();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') store.refreshDeviceLocales();
    });
    return () => subscription.remove();
  }, [store]);
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined')
      document.documentElement.lang = formatLocaleTag(snapshot.locale);
  }, [snapshot.locale]);
  const direction = localeRegistry[snapshot.locale].direction;
  return (
    <Context.Provider value={store}>
      <LayoutDirectionContext.Provider value={direction}>
        {snapshot.loading ? (
          <View style={[s.loading, { direction }]}>
            <ActivityIndicator color={colors.primary} />
            <Text style={s.copy}>{t('common.loading')}</Text>
          </View>
        ) : (
          <View style={[s.root, { direction }]}>
            {snapshot.error === 'read' ? (
              <View style={s.notice}>
                <Text accessibilityRole="alert" style={s.copy}>
                  {t('language.readError')}
                </Text>
                <AppButton
                  title={t('common.retry')}
                  onPress={() => void store.load()}
                />
              </View>
            ) : null}
            {children}
          </View>
        )}
      </LayoutDirectionContext.Provider>
    </Context.Provider>
  );
}
const useStyles = createThemedStyles((colors) => ({
  root: { flex: 1 },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background,
  },
  notice: { padding: spacing.md, backgroundColor: colors.surfaceSubtle },
  copy: { ...typography.footnote, color: colors.textSecondary },
}));
