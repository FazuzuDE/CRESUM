import 'intl-pluralrules';
import { createInstance } from 'i18next';
import { catalogs, type MessageCatalog, type Translate } from './messages';
import type { AppLocale } from './registry';
// UI callers receive only a translation function, never the mutable engine.
// Share one engine per locale instead of rebuilding its resources per component.
const translators = new Map<AppLocale, Translate>();
function flatten(catalog: MessageCatalog): Record<string, string> {
  return Object.fromEntries(
    Object.entries(catalog).flatMap(([key, value]) =>
      typeof value === 'string'
        ? [[key, value]]
        : Object.entries(value).map(([category, text]) => [
            `${key}_${category}`,
            text!,
          ]),
    ),
  );
}
export function createTranslator(
  locale: AppLocale,
  overrides?: MessageCatalog,
): Translate {
  if (!overrides) {
    const cached = translators.get(locale);
    if (cached) return cached;
  }
  const engine = createInstance();
  void engine.init({
    lng: locale,
    fallbackLng: 'en',
    initAsync: false,
    keySeparator: false,
    returnEmptyString: false,
    resources: {
      en: { translation: flatten(catalogs.en) },
      [locale]: { translation: flatten({ ...catalogs[locale], ...overrides }) },
    },
    interpolation: { escapeValue: false },
  });
  const translate = ((key: string, options?: Record<string, unknown>) =>
    engine.t(key, options)) as Translate;
  if (!overrides) translators.set(locale, translate);
  return translate;
}
