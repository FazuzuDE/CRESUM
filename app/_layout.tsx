import { enabledAppLocales } from '@/lib/i18n/registry';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LocalizationProvider } from '@/components/LocalizationProvider';
import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { LocaleStore } from '@/lib/i18n/preference-store';
import {
  AppThemeProvider,
  useAppColors,
  useAppTheme,
} from '@/components/AppThemeProvider';
import { StatusBar } from 'expo-status-bar';

export default function Layout() {
  const [localeStore] = useState(
    () =>
      new LocaleStore(
        AsyncStorage,
        () => (getLocales() ?? []).map((value) => value.languageTag),
        enabledAppLocales({
          nl: process.env.EXPO_PUBLIC_DUTCH_PREVIEW === 'true',
          sv: process.env.EXPO_PUBLIC_SWEDISH_PREVIEW === 'true',
        }),
      ),
  );
  return (
    <AppThemeProvider storage={AsyncStorage}>
      <AppNavigator localeStore={localeStore} />
    </AppThemeProvider>
  );
}

function AppNavigator({ localeStore }: { localeStore: LocaleStore }) {
  const { scheme } = useAppTheme();
  const colors = useAppColors();
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.textPrimary,
      border: colors.separator,
      notification: colors.danger,
    },
  };
  return (
    <GestureHandlerRootView
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <ThemeProvider value={navigationTheme}>
        <LocalizationProvider store={localeStore}>
          <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
        </LocalizationProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
