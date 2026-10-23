import type { PlanOrigin } from '../workout-model';
import type { AppLocale } from '../i18n/registry';
import { validPlanOrigin } from './import';
import { equipmentTaxonomy } from '../exercise-taxonomy';
export type LibraryPlan = {
  origin: PlanOrigin;
  metadata: {
    title: Record<AppLocale, string>;
    description: Record<AppLocale, string>;
    goal: 'build_muscle' | 'get_stronger' | 'general_fitness';
    experience: 'beginner' | 'some' | 'experienced';
    equipment: string[];
  };
};
const object = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
export function parseLibrary(input: unknown): LibraryPlan[] {
  if (!Array.isArray(input) || input.length > 500)
    throw Error('Invalid library');
  const seen = new Set<string>();
  for (const item of input) {
    if (
      !object(item) ||
      !validPlanOrigin(item.origin) ||
      !object(item.metadata) ||
      seen.has(item.origin.publicationId)
    )
      throw Error('Invalid library');
    seen.add(item.origin.publicationId);
    const m = item.metadata;
    for (const field of ['title', 'description']) {
      const pack = m[field];
      if (
        !object(pack) ||
        !['en', 'ru', 'de', 'fr'].every(
          (locale) =>
            typeof pack[locale] === 'string' &&
            (pack[locale] as string).trim().length > 0 &&
            (pack[locale] as string).length < 1000,
        )
      )
        throw Error('Incomplete library metadata');
    }
    if (
      !['build_muscle', 'get_stronger', 'general_fitness'].includes(
        String(m.goal),
      ) ||
      !['beginner', 'some', 'experienced'].includes(String(m.experience)) ||
      !Array.isArray(m.equipment) ||
      !m.equipment.every(
        (id) =>
          typeof id === 'string' && equipmentTaxonomy.some((e) => e.id === id),
      )
    )
      throw Error('Invalid library filters');
  }
  return JSON.parse(JSON.stringify(input)) as LibraryPlan[];
}
export function filterPlans(
  plans: LibraryPlan[],
  query: string,
  locale: AppLocale,
  filters: { goal?: string; experience?: string; equipment?: string } = {},
) {
  const text = query.trim().toLocaleLowerCase(locale);
  return plans.filter(
    (p) =>
      (!filters.goal || p.metadata.goal === filters.goal) &&
      (!filters.experience || p.metadata.experience === filters.experience) &&
      (!filters.equipment ||
        p.metadata.equipment.includes(filters.equipment)) &&
      [p.metadata.title[locale], p.metadata.description[locale]]
        .join(' ')
        .toLocaleLowerCase(locale)
        .includes(text),
  );
}
export class PlanLibraryCache {
  constructor(
    private storage: {
      getItem(k: string): Promise<string | null>;
      setItem(k: string, v: string): Promise<unknown>;
    },
  ) {}
  async read(): Promise<LibraryPlan[] | null> {
    try {
      const raw = await this.storage.getItem('cresum_plan_library_v1');
      return raw ? parseLibrary(JSON.parse(raw)) : null;
    } catch {
      return null;
    }
  }
  async write(plans: LibraryPlan[]): Promise<void> {
    const valid = parseLibrary(plans);
    await this.storage.setItem('cresum_plan_library_v1', JSON.stringify(valid));
  }
}
