export type ProgressSectionPosition = { id: string; label: string; y: number };
/** The first tap reaches the current section; the next reaches the page top. */
export function progressScrollTarget(
  y: number,
  sections: readonly ProgressSectionPosition[],
  armed: boolean,
) {
  if (armed) return { y: 0, label: 'page top' };
  const section = [...sections]
    .filter((section) => section.y <= y + 1)
    .sort((a, b) => b.y - a.y)[0];
  return section
    ? { y: section.y, label: section.label }
    : { y: 0, label: 'page top' };
}
