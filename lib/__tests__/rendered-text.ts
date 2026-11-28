type RenderedNode = string | { children: RenderedNode[] | null };

// Native wrappers can carry React elements in their props. Only walk rendered
// children when an assertion is about visible text.
export function renderedText(
  node: RenderedNode | RenderedNode[] | null,
): string {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(renderedText).join('');
  return renderedText(node.children);
}
