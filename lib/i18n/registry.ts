export const localeRegistry = {
  ur: { flag: '🇵🇰', nativeName: 'اردو', direction: 'rtl', released: false },
  sv: {
    flag: '🇸🇪',
    nativeName: 'Svenska',
    direction: 'ltr',
    released: false,
  },
  nl: {
    flag: '🇳🇱',
    nativeName: 'Nederlands',
    direction: 'ltr',
    released: false,
  },
  en: { flag: '🇬🇧', nativeName: 'English', direction: 'ltr', released: true },
  ru: { flag: '🇷🇺', nativeName: 'Русский', direction: 'ltr', released: false },
  de: { flag: '🇩🇪', nativeName: 'Deutsch', direction: 'ltr', released: false },
  fr: { flag: '🇫🇷', nativeName: 'Français', direction: 'ltr', released: false },
  uk: {
    flag: '🇺🇦',
    nativeName: 'Українська',
    direction: 'ltr',
    released: false,
  },
  es: { flag: '🇪🇸', nativeName: 'Español', direction: 'ltr', released: false },
  it: { flag: '🇮🇹', nativeName: 'Italiano', direction: 'ltr', released: false },
  pl: { flag: '🇵🇱', nativeName: 'Polski', direction: 'ltr', released: false },
  tr: { flag: '🇹🇷', nativeName: 'Türkçe', direction: 'ltr', released: false },
  hi: { flag: '🇮🇳', nativeName: 'हिन्दी', direction: 'ltr', released: false },
  bn: { flag: '🇧🇩', nativeName: 'বাংলা', direction: 'ltr', released: false },
  ar: { flag: '🇸🇦', nativeName: 'العربية', direction: 'rtl', released: false },
  ja: { flag: '🇯🇵', nativeName: '日本語', direction: 'ltr', released: false },
  ko: { flag: '🇰🇷', nativeName: '한국어', direction: 'ltr', released: false },
  id: {
    flag: '🇮🇩',
    nativeName: 'Bahasa Indonesia',
    direction: 'ltr',
    released: false,
  },
  mr: { flag: '🇮🇳', nativeName: 'मराठी', direction: 'ltr', released: false },
  vi: {
    flag: '🇻🇳',
    nativeName: 'Tiếng Việt',
    direction: 'ltr',
    released: false,
  },
  'zh-Hans': {
    flag: '🇨🇳',
    nativeName: '简体中文',
    direction: 'ltr',
    released: false,
  },
  'pt-BR': {
    flag: '🇧🇷',
    nativeName: 'Português (Brasil)',
    direction: 'ltr',
    released: false,
  },
} as const satisfies Record<
  string,
  {
    flag: string;
    nativeName: string;
    direction: 'ltr' | 'rtl';
    released: boolean;
  }
>;
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
