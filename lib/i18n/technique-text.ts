export type TechniqueText = {
  scope: string;
  setup: readonly string[];
  movement: readonly string[];
  checks: readonly string[];
  mistakes: readonly string[];
  adaptation?: string;
};
export function flattenTechniqueText(
  guides: Readonly<Record<string, TechniqueText>>,
): Record<string, string> {
  const messages: Record<string, string> = {};
  for (const [id, guide] of Object.entries(guides))
    for (const [field, value] of Object.entries(guide)) {
      if (typeof value === 'string') messages[`guide.${id}.${field}`] = value;
      else
        value.forEach((text: string, index: number) => {
          messages[`guide.${id}.${field}.${index}`] = text;
        });
    }
  return messages;
}
