export const localeRegistry = {
  en: { nativeName: 'English', direction: 'ltr', released: true },
  ru: { nativeName: 'Русский', direction: 'ltr', released: false },
  de: { nativeName: 'Deutsch', direction: 'ltr', released: false },
  fr: { nativeName: 'Français', direction: 'ltr', released: false },
  uk: { nativeName: 'Українська', direction: 'ltr', released: false },
  es: { nativeName: 'Español', direction: 'ltr', released: false },
  it: { nativeName: 'Italiano', direction: 'ltr', released: false },
  pl: { nativeName: 'Polski', direction: 'ltr', released: false },
  tr: { nativeName: 'Türkçe', direction: 'ltr', released: false },
  hi: { nativeName: 'हिन्दी', direction: 'ltr', released: false },
  bn: { nativeName: 'বাংলা', direction: 'ltr', released: false },
  'zh-Hans': { nativeName: '简体中文', direction: 'ltr', released: false },
  'pt-BR': {
    nativeName: 'Português (Brasil)',
    direction: 'ltr',
    released: false,
  },
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
    if (language === 'pt') return 'pt-BR';
    if (language === 'zh') {
      const parts = tag.toLowerCase().split('-');
      if (parts.includes('hans')) return 'zh-Hans';
      if (
        parts.includes('hant') ||
        parts.some((part) => ['tw', 'hk', 'mo'].includes(part))
      )
        continue;
      return 'zh-Hans';
    }
    if (isAppLocale(language)) return language;
  }
  return 'en';
}
