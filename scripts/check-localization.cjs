/* Static coverage contracts; no application/storage initialization. */
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { inventory } = require('./inventory-localization.cjs');
const params = (text) =>
  [...text.matchAll(/{{\s*([^}, ]+)[^}]*}}/g)].map((m) => m[1]).sort();
function validateCatalogs(catalogs) {
  const errors = [];
  const en = catalogs.en;
  for (const [locale, catalog] of Object.entries(catalogs)) {
    const categories = new Intl.PluralRules(locale).resolvedOptions()
      .pluralCategories;
    for (const [key, source] of Object.entries(en)) {
      const target = catalog[key];
      if (target === undefined) {
        errors.push(`${locale}: missing ${key}`);
        continue;
      }
      const expected = params(
        typeof source === 'string' ? source : source.other,
      );
      const forms =
        typeof target === 'string' ? [target] : Object.values(target);
      if (typeof source !== typeof target)
        errors.push(`${locale}.${key}: wrong message type`);
      if (typeof source !== 'string' && typeof target !== 'string')
        for (const category of categories)
          if (!target[category])
            errors.push(`${locale}.${key}: missing plural ${category}`);
      for (const text of forms) {
        if (typeof text !== 'string' || !text.trim())
          errors.push(`${locale}.${key}: empty text`);
        else if (JSON.stringify(params(text)) !== JSON.stringify(expected))
          errors.push(`${locale}.${key}: parameters differ`);
      }
    }
    for (const key of Object.keys(catalog))
      if (!(key in en)) errors.push(`${locale}: unknown ${key}`);
  }
  return errors;
}
const identity = (entry) => `${entry.file}\0${entry.text}`;
function compareInventory(current, baseline) {
  const known = new Set(baseline.map(identity));
  return current.filter((entry) => !known.has(identity(entry)));
}
const classificationKinds = new Set([
  'internal',
  'diagnostic',
  'canonical',
  'bibliography',
  'developer',
  'brand',
  'confirmation_token',
]);
function classifyInventory(current, classifications) {
  const site = (entry) => `${identity(entry)}\0${entry.context ?? ''}`;
  const reviewed = new Map(
    classifications
      .flatMap((entry) =>
        entry.entries
          ? entry.entries.map((candidate) => ({ ...entry, ...candidate }))
          : [entry],
      )
      .map((entry) => [site(entry), entry]),
  );
  return current.filter((entry) => {
    const review = reviewed.get(site(entry));
    return (
      !review ||
      !classificationKinds.has(review.kind) ||
      typeof review.reason !== 'string' ||
      !review.reason.trim()
    );
  });
}
function releaseEligibility(
  catalogs,
  registry,
  { sourceCandidates, classifications, acceptance },
) {
  const unclassified = classifyInventory(sourceCandidates, classifications);
  return Object.fromEntries(
    Object.keys(registry).map((locale) => {
      const errors = catalogs[locale]
        ? validateCatalogs({ en: catalogs.en, [locale]: catalogs[locale] })
        : [`${locale}: missing catalog`];
      if (unclassified.length)
        errors.push(`${unclassified.length} unclassified source candidates`);
      if (
        locale !== 'en' &&
        (acceptance[locale]?.web !== true ||
          acceptance[locale]?.native !== true)
      )
        errors.push(`${locale}: web/native acceptance pending`);
      return [locale, { eligible: errors.length === 0, errors }];
    }),
  );
}
function loadTs(filename) {
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const module = { exports: {} };
  const requireRelative = (spec) => {
    if (!spec.startsWith('.'))
      throw Error('Coverage catalog imports must be local');
    return loadTs(path.resolve(path.dirname(filename), spec + '.ts'));
  };
  new Function('module', 'exports', 'require', code)(
    module,
    module.exports,
    requireRelative,
  );
  return module.exports;
}
function run() {
  const catalogs = loadTs(path.resolve('lib/i18n/messages.ts')).catalogs;
  const baselinePath = 'docs/localization-pending.json';
  const current = inventory();
  if (process.argv.includes('--record-pending')) {
    fs.writeFileSync(baselinePath, JSON.stringify(current, null, 2) + '\n');
    return;
  }
  const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  const errors = validateCatalogs(catalogs);
  const untracked = compareInventory(current, baseline);
  errors.push(
    ...untracked.map((x) => `${x.file}:${x.line}: untracked copy: ${x.text}`),
  );
  const registry = loadTs(path.resolve('lib/i18n/registry.ts')).localeRegistry;
  const classifications = JSON.parse(
    fs.readFileSync('docs/localization-classified.json', 'utf8'),
  );
  const acceptance = JSON.parse(
    fs.readFileSync('docs/localization-acceptance.json', 'utf8'),
  );
  const unclassified = classifyInventory(current, classifications);
  const eligibility = releaseEligibility(catalogs, registry, {
    sourceCandidates: current,
    classifications,
    acceptance,
  });
  errors.push(
    ...unclassified.map(
      (entry) =>
        `${entry.file}:${entry.line}: unclassified copy/context: ${entry.text}`,
    ),
  );
  const remaining = current.filter((x) =>
    baseline.some((b) => identity(b) === identity(x)),
  );
  for (const [locale, entry] of Object.entries(registry))
    if (locale !== 'en' && entry.released && !eligibility[locale].eligible)
      errors.push(
        `${locale}: cannot enable locale: ${eligibility[locale].errors.join('; ')}`,
      );
  const byFile = Object.fromEntries(
    [...new Set(remaining.map((x) => x.file))]
      .sort()
      .map((file) => [file, remaining.filter((x) => x.file === file).length]),
  );
  if (process.argv.includes('--report'))
    process.stdout.write(
      JSON.stringify(
        {
          catalogMessages: Object.keys(catalogs.en).length,
          locales: Object.fromEntries(
            Object.entries(catalogs).map(([locale, c]) => [
              locale,
              {
                messages: Object.keys(c).length,
                released: registry[locale].released,
              },
            ]),
          ),
          sourceCandidates: current.length,
          classifiedSourceCandidates: current.length - unclassified.length,
          pendingSourceCandidates: unclassified.length,
          unclassifiedSourceCandidates: unclassified.length,
          releaseEligibility: eligibility,
          sourceCandidatesByFile: byFile,
          pendingByFile: Object.fromEntries(
            [...new Set(unclassified.map((entry) => entry.file))]
              .sort()
              .map((file) => [
                file,
                unclassified.filter((entry) => entry.file === file).length,
              ]),
          ),
          note: 'Source candidates include canonical content, diagnostics and technical strings. Classified sites are exact file/text/syntax-context reviews, not a translation percentage. Web/native acceptance is separate.',
        },
        null,
        2,
      ) + '\n',
    );
  if (errors.length) {
    process.stderr.write(errors.join('\n') + '\n');
    process.exitCode = 1;
  } else if (!process.argv.includes('--report'))
    console.log(
      `Localization contracts pass; ${current.length} source candidates inventoried, ${unclassified.length} unclassified. Target locales require web/native acceptance before release.`,
    );
}
module.exports = {
  validateCatalogs,
  compareInventory,
  classifyInventory,
  releaseEligibility,
};
if (require.main === module) run();
