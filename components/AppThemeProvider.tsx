import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Appearance,
  Platform,
  StyleSheet,
  useColorScheme,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { palettes, type AppColors, type AppColorScheme } from '@/lib/theme';

export const THEME_PREFERENCE_KEY = 'cresum.colorScheme';
export const themePreferences = ['system', 'light', 'dark'] as const;
type ThemePreference = (typeof themePreferences)[number];
type ThemeStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
};

const ThemeContext = createContext<{
  preference: ThemePreference;
  scheme: AppColorScheme;
  select: (preference: ThemePreference) => void;
}>({
  preference: 'system',
  scheme: 'light',
  select: () => {},
});

export function AppThemeProvider({
  children,
  storage,
}: {
  children: ReactNode;
  storage: ThemeStorage;
}) {
  const deviceScheme = useColorScheme();
  const [saved, setSaved] = useState<ThemePreference>();
  const selected = useRef(false);
  const pendingWrite = useRef(Promise.resolve());
  useEffect(() => {
    let active = true;
    void storage.getItem(THEME_PREFERENCE_KEY).then(
      (value) => {
        if (!active || selected.current) return;
        setSaved(value === 'dark' || value === 'light' ? value : 'system');
      },
      () => {
        if (active && !selected.current) setSaved('system');
      },
    );
    return () => {
      active = false;
    };
  }, [storage]);
  useEffect(() => {
    if (saved && (Platform.OS === 'ios' || Platform.OS === 'android')) {
      Appearance.setColorScheme(saved === 'system' ? 'auto' : saved);
    }
  }, [saved]);
  const select = useCallback(
    (next: ThemePreference) => {
      selected.current = true;
      setSaved(next);
      pendingWrite.current = pendingWrite.current
        .then(() => storage.setItem(THEME_PREFERENCE_KEY, next))
        .catch(() => {});
    },
    [storage],
  );
  const preference = saved ?? 'system';
  const scheme =
    preference === 'system' ? (deviceScheme ?? 'light') : preference;
  const value = useMemo(
    () => ({ preference, scheme, select }),
    [preference, scheme, select],
  );
  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(ThemeContext);
}

export function useAppColors() {
  return palettes[useAppTheme().scheme];
}

type NamedStyles = Record<string, ViewStyle | TextStyle | ImageStyle>;

export function createThemedStyles<Styles extends NamedStyles>(
  createStyles: (colors: AppColors) => Styles & NamedStyles,
) {
  const styles = {
    light: StyleSheet.create(createStyles(palettes.light)),
    dark: StyleSheet.create(createStyles(palettes.dark)),
  };
  return function useThemedStyles() {
    return styles[useAppTheme().scheme];
  };
}
