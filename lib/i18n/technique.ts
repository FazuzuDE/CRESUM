import { canonicalExerciseId } from '../exercise-library';
import { findTechnique, type ExerciseTechnique } from '../exercise-technique';
import { catalogs, type MessageCatalog } from './messages';
import type { AppLocale } from './registry';

export function localizedTechnique(
  locale: AppLocale,
  id: string,
): ExerciseTechnique | undefined {
  const canonical = canonicalExerciseId(id);
  const guide = findTechnique(id);
  if (!canonical || !guide) return undefined;
  const messages: MessageCatalog = catalogs[locale];
  const text = (field: string, fallback: string, index?: number) => {
    const value =
      messages[
        `guide.${canonical}.${field}${index === undefined ? '' : `.${index}`}`
      ];
    return typeof value === 'string' ? value : fallback;
  };
  return {
    ...guide,
    scope: text('scope', guide.scope),
    setup: guide.setup.map((value, index) => text('setup', value, index)),
    movement: guide.movement.map((value, index) =>
      text('movement', value, index),
    ),
    checks: guide.checks.map((value, index) => text('checks', value, index)),
    mistakes: guide.mistakes.map((value, index) =>
      text('mistakes', value, index),
    ),
    ...(guide.adaptation
      ? { adaptation: text('adaptation', guide.adaptation) }
      : {}),
  };
}
