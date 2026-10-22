import 'intl-pluralrules';
import { createInstance } from 'i18next';
import { catalogs, type MessageCatalog, type Translate } from './messages';
import type { AppLocale } from './registry';
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
  return ((key: string, options?: Record<string, unknown>) =>
    engine.t(key, options)) as Translate;
}
