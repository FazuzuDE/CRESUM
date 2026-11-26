import {
  canonicalExerciseId,
  exerciseLibrary,
  legacyExerciseIds,
} from '../../exercise-library';
import {
  defaultExerciseEquipment,
  exerciseEquipmentCatalog,
} from '../../exercise-equipment-catalog';
import { catalogs } from '../messages';

import { localeRegistry, type AppLocale } from '../registry';
import { searchAliases } from './aliases';
import type { SearchAliasCatalog } from './types';

const label = (locale: AppLocale, key: string): string => {
  const value = (catalogs[locale] as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : '';
};

// Language-neutral folding lets a Russian query work in a German interface.
export function normalizeSearch(value: string): string {
  return (
    value
      // Fold width only for ASCII/kana in search; never rewrite stored text.
      .replace(/[\uff01-\uff9f]+/gu, (span) => span.normalize('NFKC'))
      .replace(/[\u30a1-\u30f6]/gu, (kana) =>
        String.fromCharCode(kana.charCodeAt(0) - 0x60),
      )
      .toLowerCase()
      .replace(/ß/g, 'ss')
      .replace(/ł/g, 'l')
      .replace(/đ/g, 'd')
      .replace(/ı/g, 'i')
      .replace(/\u0640/g, '')
      .replace(/ى|ی/g, 'ي')
      .replace(/ک/g, 'ك')
      .normalize('NFD')
      // Keep Latin and Cyrillic folding while retaining meaningful Indic marks.
      .replace(/(\p{Script=Latin}|\p{Script=Cyrillic})\p{M}+/gu, '$1')
      .replace(/[\u064b-\u065f\u0670]/g, '')
      .normalize('NFC')
      .replace(/['’ʼ]/g, '')
      .replace(/[^\p{L}\p{N}\p{M}]+/gu, ' ')
      .trim()
      .replace(/\s+/g, ' ')
  );
}

const cyrillic: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  ґ: 'g',
  д: 'd',
  е: 'e',
  є: 'ye',
  ж: 'zh',
  з: 'z',
  и: 'i',
  і: 'i',
  ї: 'yi',
  й: 'i',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'kh',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'shch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
};
const romanize = (value: string) =>
  value.replace(/[а-яіїєґ]/g, (letter) => cyrillic[letter] ?? letter);

function forms(value: string): string[] {
  const folded = normalizeSearch(value);
  // Also accept German keyboard spellings such as Bankdruecken.
  const german = normalizeSearch(
    value
      // Fold width only for ASCII/kana in search; never rewrite stored text.
      .replace(/[\uff01-\uff9f]+/gu, (span) => span.normalize('NFKC'))
      .replace(/[\u30a1-\u30f6]/gu, (kana) =>
        String.fromCharCode(kana.charCodeAt(0) - 0x60),
      )
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue'),
  );
  // Accept optional spaces between Thai words without dropping vowel or tone marks.
  const thaiJoined = folded.replace(
    /(\p{Script=Thai}) +(?=\p{Script=Thai})/gu,
    '$1',
  );
  // Fold optional spaces and join controls in Telugu compound search terms.
  const teluguJoined = folded.replace(
    /(\p{Script=Telugu}) +(?=\p{Script=Telugu})/gu,
    '$1',
  );
  // Accept Arabic-script presentation forms and invisible join controls in Urdu queries.
  const presentation = normalizeSearch(
    value
      .replace(/[\ufb50-\ufdff\ufe70-\ufefc]+/gu, (span) =>
        span.normalize('NFKC'),
      )
      .replace(
        /(?<=\p{Script=Arabic})[\u200c\u200d](?=\p{Script=Arabic})/gu,
        '',
      ),
  );
  return [
    ...new Set([
      folded,
      romanize(folded),
      german,
      thaiJoined,
      teluguJoined,
      presentation,
    ]),
  ].filter(Boolean);
}

type Field = { values: string[]; tokens: string[] };
const field = (values: readonly string[]): Field => {
  const normalized = [...new Set(values.flatMap(forms))];
  return {
    values: normalized,
    tokens: [...new Set(normalized.flatMap((x) => x.split(' ')))],
  };
};
export const prepareExerciseQuery = (query: string): Field => field([query]);
type SearchDocument = { names: Field; equipment: Field; muscle: Field };

const locales = Object.keys(localeRegistry) as AppLocale[];
const documents = new Map<string, SearchDocument>();
for (const exercise of exerciseLibrary) {
  const names = [
    exercise.name,
    ...Object.entries(legacyExerciseIds)
      .filter(([, id]) => id === exercise.id)
      .map(([alias]) => alias),
  ];
  const equipment: string[] = [];
  const muscle: string[] = [];
  for (const locale of locales) {
    names.push(
      label(locale, `catalog.exercise.${exercise.id}`),
      ...searchAliases[locale].exercise[exercise.id],
    );
    for (const id of defaultExerciseEquipment(exercise.id)) {
      const record = exerciseEquipmentCatalog.find((entry) => entry.id === id)!;
      const key =
        'messageKey' in record ? record.messageKey : `catalog.equipment.${id}`;
      const label = (catalogs[locale] as Record<string, unknown>)[key];
      if (typeof label === 'string') equipment.push(label);
      equipment.push(
        ...searchAliases[locale].equipment[
          id as keyof SearchAliasCatalog['equipment']
        ],
      );
    }
    for (const id of [
      ...exercise.primaryMuscles,
      ...exercise.secondaryMuscles,
    ]) {
      muscle.push(
        catalogs[locale][`catalog.muscle.${id}`],
        ...searchAliases[locale].muscle[id],
      );
    }
  }
  documents.set(exercise.id, {
    names: field(names),
    equipment: field(equipment),
    muscle: field(muscle),
  });
}

// A single edit only on longer tokens: short abbreviations must stay precise.
function oneEdit(left: string, right: string): boolean {
  if (left.length < 5 || Math.abs(left.length - right.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < left.length && j < right.length) {
    if (left[i] === right[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (left.length >= right.length) i++;
    if (right.length >= left.length) j++;
  }
  return edits + Number(i < left.length || j < right.length) <= 1;
}

function fieldScore(target: Field, query: string): number {
  if (target.values.includes(query)) return 100;
  if (target.values.some((value) => value.startsWith(query))) return 85;
  const tokens = query.split(' ');
  if (tokens.every((token) => target.tokens.includes(token))) return 80;
  if (
    tokens.every((token) =>
      target.tokens.some((word) => word.startsWith(token)),
    )
  )
    return 70;
  if (target.values.some((value) => value.includes(query))) return 60;
  return 0;
}

/** Pure discovery score. Zero means no match; never resolves or rewrites history. */
export function exerciseSearchScore(
  exerciseId: string,
  query: Field,
  locale: AppLocale,
  snapshotName?: string,
): number {
  if (!query.values.length) return 1;
  const id = canonicalExerciseId(exerciseId);
  const document = id ? documents.get(id) : undefined;
  const snapshot = snapshotName ? field([snapshotName]) : undefined;
  let best = 0;
  for (const value of query.values) {
    const snapshotScore = snapshot ? fieldScore(snapshot, value) : 0;
    if (snapshotScore) best = Math.max(best, 900 + snapshotScore);
    if (!document || !id) continue;
    const nameScore = fieldScore(document.names, value);
    if (nameScore) best = Math.max(best, 900 + nameScore);
    // For equivalent results, favor the current display language's exact name.
    if (forms(label(locale, `catalog.exercise.${id}`)).includes(value))
      best = Math.max(best, 1001);
    const equipmentScore = fieldScore(document.equipment, value);
    if (equipmentScore) best = Math.max(best, 400 + equipmentScore);
    const muscleScore = fieldScore(document.muscle, value);
    if (muscleScore) best = Math.max(best, 200 + muscleScore);
    const tokens = value.split(' ');
    const combined = [
      ...document.names.tokens,
      ...document.equipment.tokens,
      ...document.muscle.tokens,
    ];
    if (
      tokens.every((token) => combined.some((word) => word.startsWith(token)))
    )
      best = Math.max(best, 150);
    if (
      tokens.every((token) =>
        document.names.tokens.some(
          (word) => word === token || oneEdit(token, word),
        ),
      )
    )
      best = Math.max(best, 100);
  }
  return best;
}
