export const localeRegistry = {
  en: { nativeName: 'English', direction: 'ltr', released: true },
  ru: { nativeName: 'Русский', direction: 'ltr', released: false },
  de: { nativeName: 'Deutsch', direction: 'ltr', released: false },
  fr: { nativeName: 'Français', direction: 'ltr', released: false },
} as const;
export type AppLocale = keyof typeof localeRegistry;
export type LanguagePreference = 'system' | AppLocale;
export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === 'string' && Object.hasOwn(localeRegistry, value);
}
export function resolveLocale(
  preference: LanguagePreference,
  deviceTags: readonly string[],
): AppLocale {
  if (preference !== 'system' && isAppLocale(preference)) return preference;
  for (const tag of deviceTags) {
    if (!/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(tag)) continue;
    const language = tag.split('-')[0].toLowerCase();
    if (isAppLocale(language)) return language;
  }
  return 'en';
}
