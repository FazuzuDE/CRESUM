import frEquipment from './locales/fr/equipment';
import deEquipment from './locales/de/equipment';
import ruEquipment from './locales/ru/equipment';
import enEquipment from './locales/en/equipment';
import frSharing from './locales/fr/sharing';
import deSharing from './locales/de/sharing';
import ruSharing from './locales/ru/sharing';
import enSharing from './locales/en/sharing';
import frProfile from './locales/fr/profile';
import deProfile from './locales/de/profile';
import ruProfile from './locales/ru/profile';
import enProfile from './locales/en/profile';
import enCommon from './locales/en/common';
import enProgress from './locales/en/progress';
import ruProgress from './locales/ru/progress';
import deProgress from './locales/de/progress';
import frProgress from './locales/fr/progress';
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
import enProgramTechnique from './locales/en/program-technique';
import ruProgramTechnique from './locales/ru/program-technique';
import deProgramTechnique from './locales/de/program-technique';
import frProgramTechnique from './locales/fr/program-technique';
import enTechniqueContent from './locales/en/technique-content';
import ruTechniqueContent from './locales/ru/technique-content';
import deTechniqueContent from './locales/de/technique-content';
import frTechniqueContent from './locales/fr/technique-content';
const en = {
  ...enEquipment,
  ...enSharing,
  ...enProfile,
  ...enProgress,
  ...enCommon,
  ...enCatalog,
  ...enLibrary,
  ...enWorkout,
  ...enHome,
  ...enHistory,
  ...enOnboarding,
  ...enEditor,
  ...enProgramTechnique,
  ...enTechniqueContent,
} as const;
const ru = {
  ...ruEquipment,
  ...ruSharing,
  ...ruProfile,
  ...ruProgress,
  ...ruCommon,
  ...ruCatalog,
  ...ruLibrary,
  ...ruWorkout,
  ...ruHome,
  ...ruHistory,
  ...ruOnboarding,
  ...ruEditor,
  ...ruProgramTechnique,
  ...ruTechniqueContent,
} as const;
const de = {
  ...deEquipment,
  ...deSharing,
  ...deProfile,
  ...deProgress,
  ...deCommon,
  ...deCatalog,
  ...deLibrary,
  ...deWorkout,
  ...deHome,
  ...deHistory,
  ...deOnboarding,
  ...deEditor,
  ...deProgramTechnique,
  ...deTechniqueContent,
} as const;
const fr = {
  ...frEquipment,
  ...frSharing,
  ...frProfile,
  ...frProgress,
  ...frCommon,
  ...frCatalog,
  ...frLibrary,
  ...frWorkout,
  ...frHome,
  ...frHistory,
  ...frOnboarding,
  ...frEditor,
  ...frProgramTechnique,
  ...frTechniqueContent,
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
