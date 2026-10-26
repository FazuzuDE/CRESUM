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
  const pathModule = require('node:path');
  const cache = new Map([['lib/exercise-library.ts', loaded.exports]]);
  function load(file) {
    if (cache.has(file)) return cache.get(file);
    const exports = {};
    cache.set(file, exports);
    const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText;
    new Function('exports', 'require', compiled)(exports, (spec) => {
      if (!spec.startsWith('.')) throw Error('Unexpected catalog dependency');
      return load(
        pathModule.posix.normalize(
          pathModule.posix.join(pathModule.posix.dirname(file), spec),
        ) + '.ts',
      );
    });
    return exports;
  }
  const families = Object.fromEntries(
    load('lib/exercise-catalog-adapter.ts')
      .catalogVariants.filter((v) => v.configuration === 'specific')
      .map((v) => [v.id, v.familyId]),
  );
  const values = Object.fromEntries(
    loaded.exports.exerciseLibrary
      .filter((e) => !e.measurement || e.measurement === 'repetitions')
      .map((e) => [e.id, e.id]),
  );
  const path = 'supabase/functions/_shared/plan-catalog.ts';
  const payload = await prettier.format(
    'export const planFamilyByVariant = ' +
      JSON.stringify(families) +
      ' as const;\nexport default ' +
      JSON.stringify(values) +
      ' as const;\n',
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
