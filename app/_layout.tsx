import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LocalizationProvider } from '@/components/LocalizationProvider';
import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { LocaleStore } from '@/lib/i18n/preference-store';
import { localeRegistry, type AppLocale } from '@/lib/i18n/registry';
export default function Layout() {
  const [localeStore] = useState(
    () =>
      new LocaleStore(
        AsyncStorage,
        () => (getLocales() ?? []).map((value) => value.languageTag),
        (Object.keys(localeRegistry) as AppLocale[]).filter(
          (locale) => localeRegistry[locale].released,
        ),
      ),
  );
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LocalizationProvider store={localeStore}>
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
      </LocalizationProvider>
    </GestureHandlerRootView>
  );
}
