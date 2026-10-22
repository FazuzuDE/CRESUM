import enCommon from './locales/en/common';
import ruCommon from './locales/ru/common';
import deCommon from './locales/de/common';
import frCommon from './locales/fr/common';
import enCatalog from './locales/en/catalog';
import ruCatalog from './locales/ru/catalog';
import deCatalog from './locales/de/catalog';
import frCatalog from './locales/fr/catalog';
import enLibrary from './locales/en/library';
import ruLibrary from './locales/ru/library';
import deLibrary from './locales/de/library';
import frLibrary from './locales/fr/library';
const en = { ...enCommon, ...enCatalog, ...enLibrary } as const;
const ru = { ...ruCommon, ...ruCatalog, ...ruLibrary } as const;
const de = { ...deCommon, ...deCatalog, ...deLibrary } as const;
const fr = { ...frCommon, ...frCatalog, ...frLibrary } as const;
export type MessageValue =
  string | Readonly<Partial<Record<Intl.LDMLPluralRule, string>>>;
export type MessageCatalog = Readonly<Record<string, MessageValue>>;
export const catalogs = { en, ru, de, fr } satisfies Record<
  string,
  MessageCatalog
>;
export type MessageKey = keyof typeof en;
type TrimFormat<S extends string> = S extends `${infer Name},${string}`
  ? Name
  : S;
type Vars<S extends string> =
  S extends `${string}{{${infer Name}}}${infer Tail}`
    ? TrimFormat<Name> | Vars<Tail>
    : never;
type TextOf<V> = V extends string
  ? V
  : V[keyof V] extends string
    ? V[keyof V]
    : never;
type ParamValue<K> = K extends 'count' ? number : string | number;
export type MessageParams = {
  [K in MessageKey]: [Vars<TextOf<(typeof en)[K]>>] extends [never]
    ? undefined
    : { [P in Vars<TextOf<(typeof en)[K]>>]: ParamValue<P> };
};
export type Translate = <K extends MessageKey>(
  key: K,
  ...args: MessageParams[K] extends undefined ? [] : [MessageParams[K]]
) => string;
