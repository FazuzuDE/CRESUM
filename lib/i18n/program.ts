import type { MessageKey, Translate } from './messages';
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
  return message ? t(message) : fallback;
}
