import type { MessageCatalog } from '../../i18n/messages';

// Test-only: never registered as an app language or imported by application code.
export function pseudoCatalog(catalog: MessageCatalog): MessageCatalog {
  const expand = (text: string) =>
    `⟦${text.replace(/{{[^}]+}}|[^{}]+/g, (part) => (part.startsWith('{{') ? part : part.replace(/[aeiouAEIOU]/g, (letter) => `${letter}ː${letter}`)))}⟧`;
  return Object.fromEntries(
    Object.entries(catalog).map(([key, value]) => [
      key,
      typeof value === 'string'
        ? expand(value)
        : Object.fromEntries(
            Object.entries(value).map(([category, text]) => [
              category,
              expand(text!),
            ]),
          ),
    ]),
  );
}
