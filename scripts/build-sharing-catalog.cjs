const fs = require('node:fs');
const ts = require('typescript');
const prettier = require('prettier');
async function main() {
  const code = ts.transpileModule(
    fs.readFileSync('lib/exercise-library.ts', 'utf8'),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  const loaded = { exports: {} };
  new Function('exports', code)(loaded.exports);
  const values = Object.fromEntries(
    loaded.exports.exerciseLibrary
      .filter((e) => !e.measurement || e.measurement === 'repetitions')
      .map((e) => [e.id, e.id]),
  );
  const path = 'supabase/functions/_shared/plan-catalog.ts';
  const payload = await prettier.format(
    'export default ' + JSON.stringify(values) + ' as const;\n',
    { ...(await prettier.resolveConfig(path)), parser: 'typescript' },
  );
  if (process.argv.includes('--check')) {
    if (fs.readFileSync(path, 'utf8') !== payload)
      throw Error('Sharing catalog out of date');
  } else fs.writeFileSync(path, payload);
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
