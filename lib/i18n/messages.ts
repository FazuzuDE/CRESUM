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
import enWorkout from './locales/en/workout';
import ruWorkout from './locales/ru/workout';
import deWorkout from './locales/de/workout';
import frWorkout from './locales/fr/workout';
import enHome from './locales/en/home';
import ruHome from './locales/ru/home';
import deHome from './locales/de/home';
import frHome from './locales/fr/home';
import enHistory from './locales/en/history';
import ruHistory from './locales/ru/history';
import deHistory from './locales/de/history';
import frHistory from './locales/fr/history';
import enOnboarding from './locales/en/onboarding';
import ruOnboarding from './locales/ru/onboarding';
import deOnboarding from './locales/de/onboarding';
import frOnboarding from './locales/fr/onboarding';
import enEditor from './locales/en/editor';
import ruEditor from './locales/ru/editor';
import deEditor from './locales/de/editor';
import frEditor from './locales/fr/editor';
const en = {
  ...enCommon,
  ...enCatalog,
  ...enLibrary,
  ...enWorkout,
  ...enHome,
  ...enHistory,
  ...enOnboarding,
  ...enEditor,
} as const;
const ru = {
  ...ruCommon,
  ...ruCatalog,
  ...ruLibrary,
  ...ruWorkout,
  ...ruHome,
  ...ruHistory,
  ...ruOnboarding,
  ...ruEditor,
} as const;
const de = {
  ...deCommon,
  ...deCatalog,
  ...deLibrary,
  ...deWorkout,
  ...deHome,
  ...deHistory,
  ...deOnboarding,
  ...deEditor,
} as const;
const fr = {
  ...frCommon,
  ...frCatalog,
  ...frLibrary,
  ...frWorkout,
  ...frHome,
  ...frHistory,
  ...frOnboarding,
  ...frEditor,
} as const;
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
