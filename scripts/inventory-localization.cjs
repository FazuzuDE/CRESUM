/* Inventory candidates without executing domain modules. Review is explicit. */
const ts = require('typescript');
const fs = require('node:fs');
const path = require('node:path');
function files(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((e) =>
      e.isDirectory()
        ? e.name === '__tests__' || e.name === 'i18n'
          ? []
          : files(path.join(dir, e.name))
        : /\.tsx?$/.test(e.name)
          ? [path.join(dir, e.name)]
          : [],
    );
}
function sourceCandidates(file, text) {
  const found = [];
  const source = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  function contextOf(node) {
    const parts = [];
    for (
      let current = node;
      current && parts.length < 5 && !ts.isSourceFile(current);
      current = current.parent
    ) {
      const property =
        ts.isPropertyAssignment(current) || ts.isJsxAttribute(current)
          ? `:${current.name.getText(source)}`
          : '';
      parts.push(ts.SyntaxKind[current.kind] + property);
    }
    return parts.join('/');
  }
  function visit(n) {
    const literal =
      ts.isStringLiteral(n) ||
      ts.isNoSubstitutionTemplateLiteral(n) ||
      ts.isJsxText(n) ||
      ts.isTemplateExpression(n);
    if (literal) {
      const value = (ts.isTemplateExpression(n) ? n.getText(source) : n.text)
        .replace(/\s+/g, ' ')
        .trim();
      if (
        /\p{L}/u.test(value) &&
        (/\s/.test(value) ||
          /^[A-Z]/.test(value) ||
          ts.isJsxText(n) ||
          ts.isJsxExpression(n.parent) ||
          ts.isVariableDeclaration(n.parent) ||
          ts.isArrayLiteralExpression(n.parent) ||
          ts.isConditionalExpression(n.parent) ||
          (ts.isPropertyAssignment(n.parent) &&
            /^(label|name|title|message|placeholder|description|hint)$/.test(
              n.parent.name.getText(source).replace(/['"]/g, ''),
            )) ||
          (ts.isJsxAttribute(n.parent) &&
            /^(title|message|placeholder|accessibilityLabel|accessibilityHint)$/.test(
              n.parent.name.text,
            )))
      )
        found.push({
          file,
          line: source.getLineAndCharacterOfPosition(n.getStart()).line + 1,
          text: value,
          context: contextOf(n),
        });
    }
    ts.forEachChild(n, visit);
  }
  visit(source);
  return found;
}
function inventory() {
  return [...files('app'), ...files('components'), ...files('lib')].flatMap(
    (file) => sourceCandidates(file, fs.readFileSync(file, 'utf8')),
  );
}
module.exports = { inventory, sourceCandidates };
if (require.main === module)
  process.stdout.write(JSON.stringify(inventory(), null, 2) + '\n');
