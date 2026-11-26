/* Static coverage contracts; no application/storage initialization. */
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
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

const comparableCopy = (text) =>
  text.normalize('NFKC').trim().replace(/\s+/gu, ' ').toLowerCase();

const strictCopyLocales = ['nl', 'sv', 'th', 'ur', 'te', 'ta', 'zh-Hant', 'nb'];

function validateNbSource(current, reviewed) {
  return Object.keys({ ...current, ...reviewed })
    .filter((file) => current[file] !== reviewed[file])
    .map(
      (file) => `nb: review translation after English source change in ${file}`,
    );
}

function nbSourceSnapshot(cameraPermission) {
  const directory = 'lib/i18n/locales/en';
  const files = fs
    .readdirSync(directory)
    .filter((file) => file.endsWith('.ts'))
    .map((file) => `${directory}/${file}`)
    .concat('lib/i18n/search/en.ts');
  const sources = files.map((file) => [
    file,
    loadTs(path.resolve(file)).default,
  ]);
  sources.push(['app.json', cameraPermission]);
  return Object.fromEntries(
    sources.map(([file, value]) => [
      file,
      createHash('sha256').update(JSON.stringify(value)).digest('hex'),
    ]),
  );
}

// These common catalog/UI glyphs have distinct Taiwan Traditional forms.
const simplifiedChineseGlyphs = /[备锻练组设训录历杠铃哑卧阔绳辑输确简档视]/u;
const hasTaiwanChinese = (value) =>
  /\p{Script=Han}/u.test(value) && !simplifiedChineseGlyphs.test(value);

function validateLocalizedCopy(catalogs, locale, exceptions) {
  const errors = [];
  const usedExceptions = new Set();
  for (const [key, source] of Object.entries(catalogs.en)) {
    const translation = catalogs[locale]?.[key];
    if (translation == null) continue; // Catalog parity reports missing keys.
    const originals = (
      typeof source === 'string' ? [source] : Object.values(source)
    ).map(comparableCopy);
    const translations =
      typeof translation === 'string'
        ? [['', translation]]
        : Object.entries(translation);
    for (const [form, value] of translations) {
      if (typeof value !== 'string') continue;
      const text = comparableCopy(value);
      const literal = text.replace(/{{[^}]+}}/g, '');
      const id = form ? key + '.' + form : key;
      const unchanged = /\p{L}/u.test(literal) && originals.includes(text);
      const needsTamil =
        locale === 'ta' &&
        originals.some((original) =>
          /\p{L}/u.test(original.replace(/{{[^}]+}}/g, '')),
        ) &&
        !/\p{Script=Tamil}/u.test(literal.replace(/[^\p{L}]/gu, ''));
      const needsTraditional =
        locale === 'zh-Hant' &&
        originals.some((original) =>
          /\p{L}/u.test(original.replace(/{{[^}]+}}/g, '')),
        ) &&
        !hasTaiwanChinese(literal);
      if (!unchanged && !needsTamil && !needsTraditional) continue;
      const exception = exceptions[id];
      if (
        exception?.text !== value ||
        typeof exception.reason !== 'string' ||
        !exception.reason.trim()
      )
        errors.push(
          locale +
            (unchanged
              ? ': unchanged English copy '
              : needsTraditional
                ? ': missing Taiwan Traditional Chinese copy '
                : ': missing Tamil copy ') +
            id,
        );
      else usedExceptions.add(id);
    }
  }
  for (const id of Object.keys(exceptions))
    if (!usedExceptions.has(id))
      errors.push(locale + ': stale English-copy exception ' + id);
  return errors;
}

function validateTechniqueLinks(catalogs, locale, exercises, techniqueCatalog) {
  const errors = [];
  for (const { id } of exercises) {
    const guide = techniqueCatalog[id];
    if (!guide) {
      errors.push(locale + ': missing linked technique guide ' + id);
      continue;
    }
    const required = [
      'scope',
      ...['setup', 'movement', 'checks', 'mistakes'].flatMap((field) =>
        guide[field]?.length
          ? guide[field].map((_, index) => field + '.' + index)
          : [field + '.0'],
      ),
      ...(guide.adaptation ? ['adaptation'] : []),
    ];
    for (const field of required) {
      const key = 'guide.' + id + '.' + field;
      const value = catalogs[locale]?.[key];
      if (typeof value !== 'string' || !value.trim())
        errors.push(locale + ': missing technique translation ' + key);
    }
  }
  return errors;
}

function validateProgramLocalization(
  catalogs,
  programs,
  keys,
  resolveExercise,
) {
  const errors = new Set();
  const hasText = (catalog, key) =>
    typeof catalog[key] === 'string' && Boolean(catalog[key].trim());
  for (const program of programs) {
    const title = keys.programTitleKey(program);
    for (const [locale, catalog] of Object.entries(catalogs)) {
      if (!hasText(catalog, title))
        errors.add(
          locale + ': missing program title ' + program.id + ' (' + title + ')',
        );
      for (const day of program.days) {
        const label = keys.programDayKey(day.key);
        if (!label || !hasText(catalog, label))
          errors.add(
            locale +
              ': missing program day ' +
              program.id +
              '/' +
              day.key +
              ' (' +
              (label ?? 'no message key') +
              ')',
          );
        for (const id of [
          ...day.movements.map((movement) => movement.exerciseId),
          ...(day.hold ? [day.hold.exerciseId] : []),
        ]) {
          const exercise = resolveExercise(id);
          if (!exercise || !hasText(catalog, 'catalog.exercise.' + exercise))
            errors.add(
              locale +
                ': missing program exercise ' +
                id +
                ' in ' +
                program.id +
                '/' +
                day.key,
            );
        }
      }
      for (const activity of program.cardio) {
        if (!activity.activity) continue;
        const exercise = resolveExercise(activity.activity);
        if (!exercise || !hasText(catalog, 'catalog.exercise.' + exercise))
          errors.add(
            locale +
              ': missing program cardio exercise ' +
              activity.activity +
              ' in ' +
              program.id,
          );
      }
    }
  }
  return [...errors];
}
// All selectable locales count, including locales awaiting device acceptance.
function validateSearchAliases(aliases, registry, catalogs, records) {
  const errors = [];
  for (const locale of Object.keys(registry)) {
    if (!catalogs[locale]) errors.push(`${locale}: missing message catalog`);
    for (const [kind, entries] of Object.entries(records)) {
      const expected = new Set(entries.map((record) => record.id));
      const section = aliases[locale]?.[kind];
      for (const record of entries) {
        const values = section?.[record.id];
        if (
          !Array.isArray(values) ||
          !values.length ||
          values.some((value) => typeof value !== 'string' || !value.trim())
        )
          errors.push(
            `${locale}: missing/empty search aliases ${kind}.${record.id}`,
          );
        else if (
          new Set(values.map((value) => value.trim().toLowerCase())).size !==
          values.length
        )
          errors.push(
            `${locale}: duplicate search aliases ${kind}.${record.id}`,
          );
        else if (
          locale === 'th' &&
          !values.some((value) => /\p{Script=Thai}/u.test(value))
        )
          errors.push(
            `${locale}: missing Thai search alias ${kind}.${record.id}`,
          );
        else if (
          locale === 'ur' &&
          !values.some((value) =>
            /\p{Script=Arabic}/u.test(value.replace(/[^\p{L}]/gu, '')),
          )
        )
          errors.push(
            `${locale}: missing Urdu search alias ${kind}.${record.id}`,
          );
        else if (
          locale === 'te' &&
          !values.some((value) =>
            /\p{Script=Telugu}/u.test(value.replace(/[^\p{L}]/gu, '')),
          )
        )
          errors.push(
            `${locale}: missing Telugu search alias ${kind}.${record.id}`,
          );
        else if (
          locale === 'ta' &&
          !values.some((value) =>
            /\p{Script=Tamil}/u.test(value.replace(/[^\p{L}]/gu, '')),
          )
        )
          errors.push(
            `${locale}: missing Tamil search alias ${kind}.${record.id}`,
          );
        else if (locale === 'zh-Hant' && !values.some(hasTaiwanChinese))
          errors.push(
            `${locale}: missing Taiwan search alias ${kind}.${record.id}`,
          );
        else if (locale === 'nb') {
          const key = record.messageKey ?? `catalog.${kind}.${record.id}`;
          const english = [
            catalogs.en?.[key],
            ...(aliases.en?.[kind]?.[record.id] ?? []),
          ]
            .filter((value) => typeof value === 'string')
            .map(comparableCopy);
          if (!values.some((value) => !english.includes(comparableCopy(value))))
            errors.push(`nb: missing Bokmål search alias ${kind}.${record.id}`);
        }
        const key = record.messageKey ?? `catalog.${kind}.${record.id}`;
        const text = catalogs[locale]?.[key];
        if (typeof text !== 'string' || !text.trim())
          errors.push(`${locale}: missing catalog translation ${key}`);
      }
      for (const id of Object.keys(section ?? {}))
        if (!expected.has(id))
          errors.push(`${locale}: unknown search alias ${kind}.${id}`);
    }
  }
  for (const locale of Object.keys(aliases))
    if (!(locale in registry))
      errors.push(`${locale}: unregistered search locale`);
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
      if (
        strictCopyLocales.includes(locale) &&
        acceptance[locale]?.linguistic !== true
      )
        errors.push(locale + ': independent linguistic acceptance pending');
      return [locale, { eligible: errors.length === 0, errors }];
    }),
  );
}
const tsModules = new Map();
function loadTs(filename) {
  if (tsModules.has(filename)) return tsModules.get(filename).exports;
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const module = { exports: {} };
  tsModules.set(filename, module);
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
  const additions = JSON.parse(
    fs.readFileSync('docs/localization-additions.json', 'utf8'),
  );
  const baseline = [
    ...JSON.parse(fs.readFileSync(baselinePath, 'utf8')),
    ...additions,
  ];
  const errors = validateCatalogs(catalogs);
  const nbSourcePath = 'docs/localization-nb-source.json';
  const { expo } = JSON.parse(fs.readFileSync('app.json', 'utf8'));
  const cameraPermission = expo.plugins.find(
    (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-camera',
  )?.[1].cameraPermission;
  const nativeNb = expo.locales?.nb;
  const localizedCameraPermission = nativeNb
    ? JSON.parse(fs.readFileSync(nativeNb, 'utf8')).ios
        ?.NSCameraUsageDescription
    : undefined;
  if (
    typeof localizedCameraPermission !== 'string' ||
    !localizedCameraPermission.trim() ||
    localizedCameraPermission === cameraPermission
  )
    errors.push('nb: missing localized iOS camera permission');
  const nbSource = nbSourceSnapshot(cameraPermission ?? null);
  const reviewedNbSource = JSON.parse(fs.readFileSync(nbSourcePath, 'utf8'));
  const recordNb = process.argv.indexOf('--record-nb-source');
  if (recordNb === -1) {
    errors.push(...validateNbSource(nbSource, reviewedNbSource));
  } else {
    const files = process.argv.slice(recordNb + 1);
    for (const file of files.length ? files : Object.keys(nbSource)) {
      if (Object.hasOwn(nbSource, file))
        reviewedNbSource[file] = nbSource[file];
      else if (Object.hasOwn(reviewedNbSource, file))
        delete reviewedNbSource[file];
      else errors.push(`nb: unknown English source ${file}`);
    }
    errors.push(...validateNbSource(nbSource, reviewedNbSource));
  }
  for (const locale of strictCopyLocales)
    if (catalogs[locale])
      errors.push(
        ...validateLocalizedCopy(
          catalogs,
          locale,
          JSON.parse(
            fs.readFileSync(
              `docs/localization-${locale}-copy-exceptions.json`,
              'utf8',
            ),
          ),
        ),
      );
  const untracked = compareInventory(current, baseline);
  errors.push(
    ...untracked.map((x) => `${x.file}:${x.line}: untracked copy: ${x.text}`),
  );
  const registry = loadTs(path.resolve('lib/i18n/registry.ts')).localeRegistry;
  const aliases = loadTs(
    path.resolve('lib/i18n/search/aliases.ts'),
  ).searchAliases;
  const { exerciseLibrary, canonicalExerciseId, cardioExerciseIds } = loadTs(
    path.resolve('lib/exercise-library.ts'),
  );
  const { exerciseEquipmentCatalog } = loadTs(
    path.resolve('lib/exercise-equipment-catalog.ts'),
  );
  const { muscleTaxonomy } = loadTs(path.resolve('lib/exercise-taxonomy.ts'));
  const aliasErrors = validateSearchAliases(aliases, registry, catalogs, {
    exercise: exerciseLibrary,
    equipment: exerciseEquipmentCatalog,
    muscle: muscleTaxonomy,
  });
  errors.push(...aliasErrors);
  const { techniqueCatalog } = loadTs(
    path.resolve('lib/exercise-technique/catalog.ts'),
  );
  for (const locale of strictCopyLocales)
    if (catalogs[locale])
      errors.push(
        ...validateTechniqueLinks(
          catalogs,
          locale,
          exerciseLibrary,
          techniqueCatalog,
        ),
      );
  // Program localization imports the offline search index, which expects complete aliases.
  if (aliasErrors.length) {
    process.stderr.write(errors.join('\n') + '\n');
    process.exitCode = 1;
    return;
  }
  const { trainingPrograms } = loadTs(
    path.resolve('lib/training-programs/catalog.ts'),
  );
  const { starterProgram, starterProgramGoals } = loadTs(
    path.resolve('lib/training-programs/starter-programs.ts'),
  );
  const programs = [
    ...trainingPrograms,
    ...starterProgramGoals.map((goal) => starterProgram(goal, 'beginner')),
  ];
  errors.push(
    ...validateProgramLocalization(
      catalogs,
      programs,
      loadTs(path.resolve('lib/i18n/program.ts')),
      (id) => cardioExerciseIds[id] ?? canonicalExerciseId(id),
    ),
  );
  const classifications = [
    ...JSON.parse(fs.readFileSync('docs/localization-classified.json', 'utf8')),
    ...additions,
  ];
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
          content: {
            exercises: exerciseLibrary.length,
            equipment: exerciseEquipmentCatalog.length,
            muscles: muscleTaxonomy.length,
            techniqueGuides: Object.keys(techniqueCatalog).length,
            techniqueMessages: Object.keys(catalogs.en).filter((key) =>
              key.startsWith('guide.'),
            ).length,
            builtInPrograms: programs.length,
            builtInTemplates: Object.keys(catalogs.en).filter((key) =>
              key.startsWith('catalog.template.'),
            ).length,
          },
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
  } else {
    if (recordNb !== -1)
      fs.writeFileSync(
        nbSourcePath,
        JSON.stringify(
          Object.fromEntries(Object.entries(reviewedNbSource).sort()),
          null,
          2,
        ) + '\n',
      );
    if (!process.argv.includes('--report'))
      console.log(
        `Localization contracts pass; ${current.length} source candidates inventoried, ${unclassified.length} unclassified. Target locales require web/native acceptance before release.`,
      );
  }
}
module.exports = {
  validateCatalogs,
  validateNbSource,
  validateLocalizedCopy,
  validateTechniqueLinks,
  validateProgramLocalization,
  validateSearchAliases,
  compareInventory,
  classifyInventory,
  releaseEligibility,
};
if (require.main === module) run();
