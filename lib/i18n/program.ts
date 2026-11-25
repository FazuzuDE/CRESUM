import type { MessageKey, Translate } from './messages';
import type { AppLocale } from './registry';
import type { ProgramDefinition } from '../training-programs/model';
import type { ProgramAssignment } from '../training-programs/assignment';
import type { WorkoutTemplate } from '../workout-model';
import { defaultTemplates } from '../workout-catalog';
import { catalogLabel } from './catalog';

export const goalMessage = {
  universal: 'program.universal',
  build_muscle: 'onboarding.muscle',
  get_stronger: 'onboarding.strength',
  lose_weight: 'onboarding.loseWeight',
  general_fitness: 'onboarding.fitness',
} as const;

export function programTitle(
  t: Translate,
  locale: AppLocale,
  program: ProgramDefinition,
) {
  return program.revision === 2
    ? t(goalMessage[program.goal])
    : catalogLabel(locale, 'program', program.id, program.name);
}
const dayKeys: Readonly<
  Record<string, Extract<MessageKey, `program.day.${string}`> | undefined>
> = {
  F: 'program.day.F',
  U: 'program.day.U',
  L: 'program.day.L',
  A: 'program.day.A',
  B: 'program.day.B',
  C: 'program.day.C',
  D: 'program.day.D',
  E: 'program.day.E',
  G: 'program.day.G',
  H: 'program.day.H',
};
export function programDayLabel(
  t: Translate,
  key: string,
  fallback: string,
): string {
  const message = dayKeys[key];
  if (['1', '2', '3'].includes(key))
    return t('onboarding.workoutIndex', { index: Number(key) });
  if (key === 'universal-1') return t('muscle.group.chest');
  if (key === 'universal-2') return t('muscle.group.legs');
  if (key === 'universal-3') return t('program.chestAndArms');
  return message ? t(message) : fallback;
}

export function workoutTemplateLabel(
  t: Translate,
  locale: AppLocale,
  template: WorkoutTemplate,
  assignment?: ProgramAssignment | null,
): string {
  const builtIn = defaultTemplates.find(({ id }) => id === template.id);
  if (builtIn?.name === template.name)
    return catalogLabel(locale, 'template', template.id, template.name);
  const index =
    assignment?.templates.findIndex(({ id }) => id === template.id) ?? -1;
  const program = assignment?.program;
  const day = program?.days[index];
  if (program && day && template.name === `${program.name} · ${day.name}`)
    return `${programTitle(t, locale, program)} · ${programDayLabel(t, day.key, day.name)}`;
  return template.name;
}
