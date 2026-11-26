/* global __dirname */
// Development-only browser checks. Never imported by the application.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { parse } = require('@babel/parser');

function expandCatalog(catalog) {
  const expandLiteral = (part) => {
    const extended = part.replace(
      /[aeiouyAEIOUYаеёиоуыэюяАЕЁИОУЫЭЮЯієїІЄЇäöüÄÖÜàâæéèêëîïôœùûÿÀÂÆÉÈÊËÎÏÔŒÙÛŸ]/g,
      (letter) => `${letter}ː${letter}`,
    );
    // Repeat words where the vowel expansion does not cover the script.
    return extended === part
      ? part.replace(/\p{L}[\p{L}\p{M}]*/gu, (word) => `${word} ${word}`)
      : extended;
  };
  const expand = (text) =>
    `⟦${text.replace(/{{[^}]+}}|[^{}]+/g, (part) =>
      part.startsWith('{{') ? part : expandLiteral(part),
    )}⟧`;
  return Object.fromEntries(
    Object.entries(catalog).map(([key, value]) => [
      key,
      typeof value === 'string'
        ? expand(value)
        : Object.fromEntries(
            Object.entries(value).map(([form, text]) => [form, expand(text)]),
          ),
    ]),
  );
}

function prepareQaBundle(source, catalogs) {
  if (!catalogs) return source;
  const modules = parse(source).program.body.filter(
    (node) => node.expression?.callee?.name === '__d',
  );
  const find = (name) => {
    const matches = modules.filter((node) =>
      source.slice(node.start, node.end).includes(`"${name}"`),
    );
    assert.equal(matches.length, 1, `Expected one ${name} module`);
    return matches[0];
  };
  const module = find('catalogs');
  const id = module.expression.arguments[1].value;
  const code = `__d(function(g,r,i,a,m,e,d){Object.defineProperty(e,"__esModule",{value:true});e.catalogs=${JSON.stringify(catalogs)}},${id},[]);`;
  return source.slice(0, module.start) + code + source.slice(module.end);
}

function assertQaPlan(raw) {
  const state = JSON.parse(raw);
  const matches = state.templates.filter(
    (template) => template.name === 'QA-localized-plan',
  );
  assert.equal(matches.length, 1, 'Exactly one named QA plan');
  const plan = matches[0];
  assert.deepEqual(
    plan.exerciseIds,
    ['dumbbell-lateral-raise'],
    'Exact exercise identity',
  );
  assert.deepEqual(
    plan.plannedExercises,
    [{ exerciseId: 'dumbbell-lateral-raise', sets: 4, weight: '12.5' }],
    'Exact planned exercise',
  );
  assert.equal(
    state.activeWorkout,
    null,
    'Plan editing never starts a workout',
  );
  assert.deepEqual(state.history, [], 'Plan editing never creates History');
}

function qaModuleLoader(root) {
  const ts = require('typescript');
  const vm = require('node:vm');
  const cache = new Map();
  const load = (file) => {
    if (!file.startsWith(path.join(root, 'lib/i18n') + path.sep))
      throw Error('QA catalog import outside i18n');
    if (cache.has(file)) return cache.get(file);
    const text = fs.readFileSync(file, 'utf8');
    const compiled = ts.transpileModule(text, {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText;
    const exports = {};
    cache.set(file, exports);
    vm.runInNewContext(compiled, {
      exports,
      require: (name) => {
        if (!name.startsWith('.')) throw Error('External QA catalog import');
        return load(path.resolve(path.dirname(file), name + '.ts'));
      },
    });
    return exports;
  };
  return load;
}

function readCatalogs(root, load = qaModuleLoader(root)) {
  const registry = load(path.join(root, 'lib/i18n/registry.ts')).localeRegistry;
  const { catalogs } = load(path.join(root, 'lib/i18n/messages.ts'));
  assert.deepEqual(
    Object.keys(catalogs).sort(),
    Object.keys(registry).sort(),
    'Rendered catalogs must match the locale registry',
  );
  return catalogs;
}

const widths = [320, 390];
const textModes = [false, true];

function qaMatrix(locales) {
  return locales.flatMap((locale) =>
    widths.flatMap((width) =>
      textModes.map((expanded) => ({ locale, width, expanded })),
    ),
  );
}

function assertQaMatrix(expected, results) {
  const key = ({ locale, width, expanded }) =>
    JSON.stringify([locale, width, expanded]);
  const pending = new Set(expected.map(key));
  assert.equal(pending.size, expected.length, 'Duplicate matrix configuration');
  for (const result of results)
    assert.ok(
      pending.delete(key(result)),
      `Unexpected or duplicate scenario: ${key(result)}`,
    );
  assert.deepEqual([...pending], [], 'Missing matrix scenarios');
}

async function main() {
  const http = require('node:http');
  const { execFileSync } = require('node:child_process');
  const root = path.resolve(__dirname, '..');
  const option = (name, fallback) => {
    const index = process.argv.indexOf(name);
    return index < 0 ? fallback : process.argv[index + 1];
  };
  const exportDir = path.resolve(option('--export-dir', 'dist'));
  const outputDir = path.resolve(
    option('--output-dir', '.tools/localization-web-qa/browser'),
  );
  const captureScreenshots = !process.argv.includes('--no-screenshots');
  const entryDir = path.join(exportDir, '_expo/static/js/web');
  const entries = fs
    .readdirSync(entryDir)
    .filter((v) => /^entry-.*\.js$/.test(v));
  assert.equal(entries.length, 1, 'Export exactly one web entry first');
  const entry = path.join(entryDir, entries[0]);
  const scripts = fs
    .readdirSync(entryDir)
    .filter((file) => file.endsWith('.js'));
  const bundles = scripts.map((name) => {
    const file = path.join(entryDir, name);
    return { file, source: fs.readFileSync(file, 'utf8') };
  });
  const findBundle = (name) => {
    const matches = bundles.filter(({ source }) =>
      source.includes(`"${name}"`),
    );
    assert.equal(matches.length, 1, `Expected one exported bundle for ${name}`);
    return matches[0];
  };
  const registryBundle = findBundle('localeRegistry');
  const catalogBundle = findBundle('catalogs');
  const hash = (content) =>
    crypto.createHash('sha256').update(content).digest('hex');
  const originalHash = hash(fs.readFileSync(entry));
  const originalBundleHashes = Object.fromEntries(
    [registryBundle, catalogBundle].map(({ file, source }) => [
      file,
      hash(source),
    ]),
  );
  const load = qaModuleLoader(root);
  const catalogs = readCatalogs(root, load);
  const { localeRegistry } = load(path.join(root, 'lib/i18n/registry.ts'));
  const locales = Object.keys(localeRegistry);
  const matrix = qaMatrix(locales);
  const aliases = load(
    path.join(root, 'lib/i18n/search/aliases.ts'),
  ).searchAliases;
  const { formatEntryNumber, formatNumber } = load(
    path.join(root, 'lib/i18n/format.ts'),
  );
  const expandedCatalogs = Object.fromEntries(
    Object.entries(catalogs).map(([locale, value]) => [
      locale,
      expandCatalog(value),
    ]),
  );
  const expanded = prepareQaBundle(catalogBundle.source, expandedCatalogs);
  fs.mkdirSync(outputDir, { recursive: true });
  const playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
  let expandedMode = false;
  const server = http.createServer((request, response) => {
    try {
      const relative = decodeURIComponent(
        new URL(request.url, 'http://qa').pathname,
      );
      const file = path.resolve(
        exportDir,
        '.' + (relative === '/' ? '/index.html' : relative),
      );
      if (!file.startsWith(exportDir + path.sep)) throw Error('Outside export');
      const types = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.ttf': 'font/ttf',
        '.png': 'image/png',
      };
      response.setHeader(
        'Content-Type',
        types[path.extname(file)] || 'application/octet-stream',
      );
      response.end(
        file === catalogBundle.file && expandedMode
          ? expanded
          : fs.readFileSync(file),
      );
    } catch {
      response.writeHead(404);
      response.end();
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await playwright.chromium
    .launch({
      ...(process.env.CHROMIUM_PATH
        ? { executablePath: process.env.CHROMIUM_PATH }
        : {}),
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    })
    .catch((error) => {
      server.close();
      throw error;
    });
  const report = {
    commit: execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: root,
      encoding: 'utf8',
    }).trim(),
    exportSha256: originalHash,
    localizationBundleHashes: Object.fromEntries(
      Object.entries(originalBundleHashes).map(([file, digest]) => [
        path.basename(file),
        digest,
      ]),
    ),
    browser: browser.version(),
    qaOnlyRegistryOverride: false,
    qaMutatedProductionFiles: false,
    matrix,
    results: [],
  };
  try {
    for (const expand of textModes) {
      expandedMode = expand;
      const scenarios = matrix.filter(({ expanded }) => expanded === expand);
      const runScenario = async ({ locale, width }) => {
        const context = await browser.newContext({
          viewport: { width, height: 850 },
          locale,
        });
        const result = {
          locale,
          width,
          expanded: expand,
          screens: [],
          errors: [],
          network: [],
        };
        const synonym = aliases[locale].exercise['dumbbell-lateral-raise'][0];
        result.searchSynonym = synonym;
        const numberLocale = (value) => formatNumber(locale, value);
        const page = await context.newPage();
        page.setDefaultTimeout(12000);
        page.on('pageerror', (error) => result.errors.push(error.message));
        await context.route('**/*', (route) => {
          const url = route.request().url();
          if (url.startsWith(origin + '/') || url.startsWith('data:'))
            return route.continue();
          result.network.push(url);
          return route.abort();
        });
        await context.addInitScript(
          (value) => {
            if (!localStorage.getItem('cresum_language_preference_v1'))
              localStorage.setItem(
                'cresum_language_preference_v1',
                JSON.stringify({ version: 1, preference: value }),
              );
          },
          locale === 'th' && !expand ? 'en' : locale,
        );
        const catalog = expand
          ? expandCatalog(catalogs[locale])
          : catalogs[locale];
        const text = (key, params = {}) => {
          assert.equal(typeof catalog[key], 'string', key);
          return catalog[key].replace(
            /{{(\w+)(,\s*number)?}}/g,
            (token, name, numeric) =>
              params[name] === undefined
                ? token
                : numeric
                  ? numberLocale(params[name])
                  : params[name],
          );
        };
        const contains = (value) =>
          new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        const button = (key, exact = true) =>
          page.getByRole('button', {
            name: exact ? text(key) : contains(text(key)),
            exact,
          });
        const capture = async (screen) => {
          const overflow = await page.evaluate(() => {
            const failures = [];
            if (document.body.scrollWidth > innerWidth + 1)
              failures.push('page overflow');
            for (const element of document.querySelectorAll(
              '[role="button"]',
            )) {
              const box = element.getBoundingClientRect();
              if (
                !box.width ||
                box.bottom < 0 ||
                box.top > innerHeight ||
                element.closest('[aria-hidden="true"]')
              )
                continue;
              let horizontal = false;
              for (
                let parent = element.parentElement;
                parent;
                parent = parent.parentElement
              ) {
                if (
                  ['auto', 'scroll'].includes(
                    getComputedStyle(parent).overflowX,
                  )
                )
                  horizontal = true;
              }
              if (
                !horizontal &&
                (box.left < -1 ||
                  box.right > innerWidth + 1 ||
                  element.scrollWidth > element.clientWidth + 2)
              )
                failures.push(element.innerText);
            }
            return failures;
          });
          assert.deepEqual(overflow, [], screen + ' horizontal clipping');
          if (captureScreenshots)
            await page.screenshot({
              path: path.join(
                outputDir,
                `${locale}-${width}-${expand ? 'expanded' : 'normal'}-${screen}.png`,
              ),
            });
          result.screens.push(screen);
        };
        try {
          await page.goto(origin);
          if (locale === 'th' && !expand) {
            await page
              .getByRole('button', {
                name: catalogs.en['language.title'],
                exact: true,
              })
              .click();
            await page
              .getByRole('slider', { name: catalogs.en['language.title'] })
              .getByText(/🇹🇭.*ไทย/)
              .first()
              .click();
            await page
              .getByRole('button', {
                name: catalogs.en['common.done'],
                exact: true,
              })
              .click();
            await page.waitForFunction(
              () =>
                JSON.parse(
                  localStorage.getItem('cresum_language_preference_v1'),
                ).preference === 'th',
            );
            result.manualLanguageSelected = true;
          }
          const nameInput = page.getByRole('textbox', {
            name: text('onboarding.name'),
            exact: true,
          });
          await nameInput.waitFor();
          assert.equal(await button('onboarding.continue').isDisabled(), true);
          const tagline = await page.getByTestId('brand-tagline').boundingBox();
          const languageControl = await button('language.title').boundingBox();
          assert.ok(
            tagline && languageControl,
            'Onboarding header and language control',
          );
          assert.ok(
            tagline.x + tagline.width <= languageControl.x + 1 ||
              languageControl.x + languageControl.width <= tagline.x + 1,
            'Onboarding tagline clears the language control',
          );
          result.onboardingHeaderClear = true;
          await capture('onboarding-welcome');
          await nameInput.fill('QA Athlete');
          await button('onboarding.continue').click();
          await button('character.male').click();
          await capture('onboarding-character');
          await button('onboarding.continue').click();
          await button('onboarding.height').waitFor();
          await capture('onboarding-body');
          await button('onboarding.skipForNow').click();
          await button('onboarding.findProgram', false).click();
          await capture('onboarding-goal');
          await button('onboarding.muscle', false).click();
          await button('onboarding.configureSchedule').waitFor();
          await capture('onboarding-program');
          await button('onboarding.configureSchedule').click();
          const done = button('common.done');
          assert.equal(await done.isDisabled(), true);
          await capture('onboarding-schedule');
          const weekday = (new Date().getDay() + 6) % 7;
          const selectedDays = [0, 2, 4].map(
            (offset) => (weekday + offset) % 7,
          );
          for (const day of selectedDays)
            await page.getByTestId(`program-weekday-${day}`).click();
          assert.equal(await done.isEnabled(), true);
          await done.click();
          await button('onboarding.welcomeOk').click();
          await page
            .getByRole('tab', { name: contains(text('nav.profile')) })
            .waitFor();
          const accepted = await page.evaluate(() => ({
            onboarding: JSON.parse(
              localStorage.getItem('cresum_onboarding_v1'),
            ),
            program: JSON.parse(
              localStorage.getItem('cresum_training_program_v1'),
            ),
            core: JSON.parse(localStorage.getItem('fitflow_state_v1')),
          }));
          assert.equal(accepted.onboarding.status, 'completed');
          assert.equal(accepted.onboarding.answers.displayName, 'QA Athlete');
          assert.equal(accepted.onboarding.answers.artworkModel, 'male');
          assert.equal(accepted.onboarding.answers.goal, 'build_muscle');
          assert.equal(accepted.onboarding.answers.experience, 'beginner');
          assert.deepEqual(
            accepted.onboarding.answers.scheduleWeekdays,
            selectedDays,
          );
          assert.equal(accepted.program.pending, null);
          const assignment = accepted.program.assignment;
          assert.equal(assignment.program.id, 'starter-build-muscle');
          assert.equal(assignment.reducedFirstSession, false);
          assert.ok(assignment.templates.length > 0);
          for (const template of assignment.templates) {
            assert.deepEqual(
              accepted.core.templates.find((item) => item.id === template.id),
              template,
              'Accepted program templates match persisted Core',
            );
          }
          assert.equal(accepted.core.activeWorkout, null);
          assert.deepEqual(accepted.core.history, []);
          await page.reload();
          await page
            .getByRole('tab', { name: contains(text('nav.profile')) })
            .waitFor();
          const restored = await page.evaluate(() => ({
            onboarding: JSON.parse(
              localStorage.getItem('cresum_onboarding_v1'),
            ),
            program: JSON.parse(
              localStorage.getItem('cresum_training_program_v1'),
            ),
            core: JSON.parse(localStorage.getItem('fitflow_state_v1')),
          }));
          assert.deepEqual(
            restored,
            accepted,
            'Reload retains onboarding, assignment identity and templates',
          );
          result.onboarding = {
            goal: 'build_muscle',
            experience: 'beginner',
            reducedFirstSession: false,
            acceptedWithoutStartingWorkout: true,
            reloadUnchanged: true,
          };
          await capture('onboarding-reloaded');
          const planStart = (slot = 0) =>
            page.getByRole('button', {
              name: text('plan.start', {
                key: assignment.program.days[slot].key,
              }),
              exact: true,
            });
          const readProgramState = () =>
            page.evaluate(() => ({
              onboarding: JSON.parse(
                localStorage.getItem('cresum_onboarding_v1'),
              ),
              program: JSON.parse(
                localStorage.getItem('cresum_training_program_v1'),
              ),
              core: JSON.parse(localStorage.getItem('fitflow_state_v1')),
            }));
          const assertProgramSession = (snapshot, slotIndex, reduced) => {
            const session = snapshot.core.activeWorkout;
            const template = assignment.templates[slotIndex];
            assert.equal(session.templateId, template.id);
            assert.equal(session.name, template.name);
            assert.equal(session.programSlot.assignmentId, assignment.id);
            assert.equal(session.programSlot.weekIndex, 0);
            assert.equal(session.programSlot.slotIndex, slotIndex);
            assert.deepEqual(
              session.exercises.map((item) => item.libraryId),
              template.exerciseIds,
            );
            session.exercises.forEach((exercise, index) => {
              const planned = template.plannedExercises[index];
              assert.equal(exercise.sets.length, reduced ? 1 : planned.sets);
              assert.deepEqual(
                exercise.target,
                planned.target,
                'Program targets retain exact authored values',
              );
              for (const set of exercise.sets) {
                assert.equal(set.weight, '', 'No working weight invented');
                assert.equal(
                  set.reps,
                  '',
                  'Targets are not logged repetitions',
                );
                assert.equal(set.completedAt, undefined);
              }
            });
            assert.deepEqual(
              snapshot.program,
              accepted.program,
              'Starting never mutates the assignment',
            );
            assert.deepEqual(snapshot.onboarding, accepted.onboarding);
            assert.deepEqual(
              snapshot.core.templates,
              accepted.core.templates,
              'Reduction never rewrites saved templates',
            );
            assert.deepEqual(snapshot.core.history, []);
            return session;
          };
          const discardProgramSession = async () => {
            await button('workout.discard').click();
            await button('workout.keepTraining').waitFor();
            await page
              .getByRole('dialog')
              .getByRole('button', {
                name: text('workout.discard'),
                exact: true,
              })
              .click();
            await button('workout.keepTraining').waitFor({ state: 'hidden' });
            assert.deepEqual(
              await readProgramState(),
              accepted,
              'Discard restores unchanged program/Core baseline',
            );
            await page
              .getByRole('tab', { name: contains(text('nav.home')) })
              .click();
          };
          await page.getByRole('radio').nth(0).click();
          await planStart().click();
          await page
            .getByRole('button', {
              name: text('workout.editWeight', { index: 1 }),
              exact: true,
            })
            .waitFor();
          const firstSnapshot = await readProgramState();
          const firstSession = assertProgramSession(firstSnapshot, 0, false);
          assert.equal(firstSession.programSlot.date, assignment.startDate);
          await capture('program-first-session');
          await page.reload();
          const programResume = page.getByRole('button', {
            name: text('home.resume', { name: firstSession.name }),
            exact: true,
          });
          await programResume.waitFor();
          assert.deepEqual(
            await readProgramState(),
            firstSnapshot,
            'Reload retains first session identity and targets',
          );
          await programResume.click();
          await button('workout.addSet').waitFor();
          await capture('program-first-resumed');
          await discardProgramSession();
          await page.getByRole('radio').nth(1).click();
          await planStart(1).click();
          await button('workout.addSet').waitFor();
          const regularSnapshot = await readProgramState();
          const regularSession = assertProgramSession(
            regularSnapshot,
            1,
            false,
          );
          assert.notEqual(regularSession.id, firstSession.id);
          assert.ok(
            regularSession.exercises.some(
              (exercise) => exercise.sets.length > 1,
            ),
            'The next slot keeps its authored sets',
          );
          const secondDate = new Date(`${assignment.startDate}T12:00:00`);
          secondDate.setDate(secondDate.getDate() + 2);
          assert.equal(
            regularSession.programSlot.date,
            `${secondDate.getFullYear()}-${String(secondDate.getMonth() + 1).padStart(2, '0')}-${String(secondDate.getDate()).padStart(2, '0')}`,
          );
          await capture('program-next-session');
          await discardProgramSession();
          await capture('program-after-discard');
          result.programStart = {
            firstSlotSetsPerExercise: 1,
            laterSlotUsesAuthoredSets: true,
            targetsUnchanged: true,
            reloadIdentityRetained: true,
            noInventedWeightsOrHistory: true,
          };
          await capture('home');
          await page
            .getByRole('tab', { name: contains(text('nav.profile')) })
            .click();
          await button('profile.myWorkouts', false).waitFor();
          await capture('profile');
          await button('profile.myWorkouts', false).click();
          await button('templates.create').waitFor();
          await capture('plans');
          await button('templates.create').click();
          await page
            .getByRole('textbox', { name: text('editor.name'), exact: true })
            .fill('QA-localized-plan');
          await button('editor.next').click();
          await page
            .getByRole('textbox', {
              name: text('library.searchLabel'),
              exact: true,
            })
            .fill(synonym);
          if (['nl', 'sv', 'th'].includes(locale)) {
            const all = text('library.all');
            const dumbbell = text('catalog.equipment.dumbbell');
            const equipmentFilter = (label) =>
              page.getByRole('button', {
                name: text('library.filterEquipment', { label }),
                exact: true,
              });
            await equipmentFilter(all).click();
            await page
              .getByRole('slider', {
                name: text('library.equipment'),
                exact: true,
              })
              .getByText(dumbbell, { exact: true })
              .first()
              .click();
            await button('common.done').click();
            await equipmentFilter(dumbbell).waitFor();
            result.searchEquipment = 'dumbbell';
          }
          await page
            .getByRole('button', {
              name: text('library.addName', {
                name: text('catalog.exercise.dumbbell-lateral-raise'),
              }),
              exact: true,
            })
            .scrollIntoViewIfNeeded();
          await capture('library');
          const coreBeforeGuide = await page.evaluate(() =>
            localStorage.getItem('fitflow_state_v1'),
          );
          await page
            .getByRole('button', {
              name: text('library.techniqueFor', {
                name: text('catalog.exercise.dumbbell-lateral-raise'),
              }),
              exact: true,
            })
            .click();
          await button('technique.close').waitFor();
          await capture('technique');
          for (const field of ['setup', 'movement', 'checks']) {
            const keys = Object.keys(catalog).filter((key) =>
              key.startsWith(`guide.dumbbell-lateral-raise.${field}.`),
            );
            assert.ok(
              keys.length > 0,
              'Technique section has authored guidance',
            );
            for (const key of keys) {
              await page
                .getByText(contains(text(key)))
                .scrollIntoViewIfNeeded();
            }
            await capture(`technique-${field}`);
          }
          await button('technique.mistakes').click();
          assert.equal(
            await button('technique.mistakes').getAttribute('aria-expanded'),
            'true',
          );
          const mistakeKeys = Object.keys(catalog).filter((key) =>
            key.startsWith('guide.dumbbell-lateral-raise.mistakes.'),
          );
          assert.ok(mistakeKeys.length > 0);
          for (const key of mistakeKeys)
            await page.getByText(contains(text(key))).scrollIntoViewIfNeeded();
          await capture('technique-mistakes');
          await button('technique.sources').click();
          assert.equal(
            await button('technique.sources').getAttribute('aria-expanded'),
            'true',
          );
          await capture('technique-sources');
          await button('technique.showFinish').click();
          assert.equal(
            await button('technique.showFinish').getAttribute('aria-pressed'),
            'true',
          );
          await page
            .getByRole('button', {
              name: text('technique.expand'),
              exact: true,
            })
            .last()
            .click();
          await button('technique.closeViewer').waitFor();
          const viewer = page
            .getByRole('dialog')
            .filter({ has: button('technique.closeViewer') });
          assert.equal(
            await viewer
              .getByRole('button', {
                name: text('technique.showFinish'),
                exact: true,
              })
              .getAttribute('aria-pressed'),
            'true',
          );
          await capture('technique-viewer-finish');
          await viewer
            .getByRole('button', {
              name: text('technique.showStart'),
              exact: true,
            })
            .click();
          assert.equal(
            await viewer
              .getByRole('button', {
                name: text('technique.showStart'),
                exact: true,
              })
              .getAttribute('aria-pressed'),
            'true',
          );
          await capture('technique-viewer-start');
          await button('technique.closeViewer').click();
          await button('technique.closeViewer').waitFor({ state: 'hidden' });
          assert.equal(
            await button('technique.showStart').getAttribute('aria-pressed'),
            'true',
          );
          assert.equal(
            await button('technique.mistakes').getAttribute('aria-expanded'),
            'true',
          );
          assert.equal(
            await button('technique.sources').getAttribute('aria-expanded'),
            'true',
          );
          await button('technique.close').click();
          await button('technique.close').waitFor({ state: 'hidden' });
          assert.equal(
            await page
              .getByRole('textbox', {
                name: text('library.searchLabel'),
                exact: true,
              })
              .inputValue(),
            synonym,
          );
          assert.equal(
            await page.evaluate(() => localStorage.getItem('fitflow_state_v1')),
            coreBeforeGuide,
            'Guide/viewer never write Core',
          );
          result.technique = {
            guideId: 'dumbbell-lateral-raise',
            mistakes: mistakeKeys.length,
            phaseRetained: true,
            searchRetained: true,
            coreUnchanged: true,
          };
          await page
            .getByRole('button', {
              name: text('library.addName', {
                name: text('catalog.exercise.dumbbell-lateral-raise'),
              }),
              exact: true,
            })
            .click();
          await page
            .getByRole('textbox', { name: text('editor.sets'), exact: true })
            .fill('4');
          await page
            .getByRole('textbox', {
              name: text('editor.weightLabel'),
              exact: true,
            })
            .fill(numberLocale(12.5));
          await capture('exercise');
          await button('editor.addExercise').click();
          await button('editor.cancel').click();
          await button('editor.keep').waitFor();
          await capture('discard');
          await button('editor.keep').click();
          await button('editor.save').click();
          await page.getByText('QA-localized-plan', { exact: true }).waitFor();
          await capture('saved');
          const raw = await page.evaluate(() =>
            localStorage.getItem('fitflow_state_v1'),
          );
          assertQaPlan(raw);
          const state = () =>
            page.evaluate(() =>
              JSON.parse(localStorage.getItem('fitflow_state_v1')),
            );
          // Fault only the real browser persistence boundary, never app logic.
          const failNextWrite = () =>
            page.evaluate(() => {
              const original = Storage.prototype.setItem;
              window.__cresumQaFaultConsumed = false;
              Storage.prototype.setItem = function (key, value) {
                if (this === localStorage && key === 'fitflow_state_v1') {
                  Storage.prototype.setItem = original;
                  window.__cresumQaFaultConsumed = true;
                  throw Error('QA_STORAGE_FAILURE');
                }
                return original.call(this, key, value);
              };
            });
          const assertFailureConsumed = async () => {
            assert.equal(
              await page.evaluate(() => window.__cresumQaFaultConsumed),
              true,
              'The real Core write must consume the injected failure',
            );
            assert.equal(
              await page
                .getByText('QA_STORAGE_FAILURE', { exact: false })
                .count(),
              0,
              'Internal diagnostics stay out of visible UI',
            );
          };
          const namedButton = (key, params) =>
            page.getByRole('button', {
              name: text(key, params),
              exact: true,
            });
          const editFirst = namedButton('workout.editWeight', { index: 1 });
          const exactWeight = page.getByRole('textbox', {
            name: text('entry.exactWeight'),
            exact: true,
          });
          const exactReps = page.getByRole('textbox', {
            name: text('entry.exactReps'),
            exact: true,
          });
          await page
            .getByRole('button', { name: 'QA-localized-plan', exact: true })
            .click();
          await button('sharing.start').click();
          await editFirst.waitFor();
          const started = await state();
          const session = started.activeWorkout;
          assert.equal(session.name, 'QA-localized-plan');
          assert.equal(session.exercises.length, 1);
          assert.equal(
            session.exercises[0].libraryId,
            'dumbbell-lateral-raise',
          );
          assert.equal(session.exercises[0].name, 'Dumbbell Lateral Raise');
          assert.equal(session.exercises[0].sets.length, 4);
          await capture('workout');

          // Cancel discards only the draft, never the persisted session values.
          await editFirst.click();
          await button('entry.useKeypad').click();
          await exactWeight.fill('99,5');
          await exactReps.fill(numberLocale(7));
          await capture('set-draft');
          await button('entry.cancelLabel').click();
          await exactWeight.waitFor({ state: 'hidden' });
          assert.deepEqual(await state(), started, 'Cancel preserves Core');

          await editFirst.click();
          await button('entry.useKeypad').click();
          const manualWeight = ['nl', 'sv', 'th'].includes(locale)
            ? 62.5
            : 12.5;
          const manualReps = 8;
          const manualVolumeKg = manualWeight * manualReps;
          const entryLocale = locale === 'th' ? 'th-TH-u-nu-thai' : locale;
          await exactWeight.fill(formatNumber(entryLocale, manualWeight));
          await exactReps.fill(formatNumber(entryLocale, manualReps));
          await failNextWrite();
          await button('entry.saveValues').click();
          await exactWeight.waitFor({ state: 'hidden' });
          await button('workout.retrySaveLoad').waitFor();
          await assertFailureConsumed();
          await page
            .getByText(text('error.workoutUnsaved'), { exact: true })
            .waitFor();
          assert.deepEqual(
            await state(),
            started,
            'Failed set write preserves durable Core',
          );
          await capture('set-save-error');
          await button('workout.retrySaveLoad').click();
          await button('workout.retrySaveLoad').waitFor({ state: 'hidden' });
          const entered = await state();
          assert.deepEqual(entered.activeWorkout.exercises[0].sets[0], {
            id: session.exercises[0].sets[0].id,
            weight: String(manualWeight),
            reps: String(manualReps),
            entered: true,
          });
          await page
            .getByRole('checkbox', {
              name: text('workout.completeNamed', { index: 1 }),
              exact: true,
            })
            .click();
          await button('workout.skipRest').waitFor();
          const resting = await state();
          const first = resting.activeWorkout.exercises[0].sets[0];
          assert.equal(first.weight, String(manualWeight));
          assert.equal(first.reps, String(manualReps));
          assert.equal(typeof first.completedAt, 'number');
          assert.equal(typeof resting.activeWorkout.restEndsAt, 'number');
          assert.equal(resting.activeWorkout.id, session.id);
          assert.deepEqual(resting.history, []);
          await capture('rest');

          await button('workout.discard').click();
          await button('workout.keepTraining').waitFor();
          await capture('workout-discard-cancel');
          await button('workout.keepTraining').click();
          await editFirst.waitFor();
          assert.deepEqual(
            await state(),
            resting,
            'Discard cancel preserves Core',
          );

          await page.reload();
          const resume = namedButton('home.resume', {
            name: 'QA-localized-plan',
          });
          await resume.waitFor();
          assert.deepEqual(
            await state(),
            resting,
            'Reload preserves session and rest deadline',
          );
          await capture('resume');
          await resume.click();
          await button('workout.skipRest').waitFor();
          await capture('recovered-rest');
          assert.deepEqual(await state(), resting, 'Resume preserves Core');
          await button('workout.finish').click();
          await button('workout.keepTraining').waitFor();
          await capture('finish-cancel');
          await button('workout.keepTraining').click();
          await button('workout.finish').waitFor();
          assert.deepEqual(
            await state(),
            resting,
            'Finish cancel preserves Core',
          );
          await button('workout.finish').click();
          await failNextWrite();
          await button('workout.finishSave').click();
          await page
            .getByText(text('error.workoutSave'), { exact: false })
            .first()
            .waitFor();
          await assertFailureConsumed();
          assert.deepEqual(
            await state(),
            resting,
            'Failed Finish preserves active workout',
          );
          await capture('finish-save-error');
          await button('workout.finishSave').click();
          await button('common.done').waitFor();
          const finished = await state();
          assert.equal(finished.activeWorkout, null);
          assert.equal(
            finished.history.length,
            1,
            'Finish creates exactly one record',
          );
          const savedWorkout = finished.history[0];
          assert.equal(savedWorkout.id, session.id);
          assert.equal(typeof savedWorkout.finishedAt, 'number');
          assert.ok(savedWorkout.finishedAt >= session.startedAt);
          const { finishedAt, ...savedSession } = savedWorkout;
          // Finish clears rest state; every exercise/set snapshot stays exact.
          const { restEndsAt, ...expectedSession } = resting.activeWorkout;
          assert.deepEqual(
            savedSession,
            expectedSession,
            'Exact saved workout',
          );
          assert.deepEqual(
            finished.templates,
            started.templates,
            'Plans unchanged',
          );
          await capture('finished');
          await button('common.done').click();
          const openHistory = namedButton('history.open', {
            name: 'QA-localized-plan',
          });
          await openHistory.click();
          await button('history.back').waitFor();
          const expectedSet = text('history.set', {
            index: 1,
            weight: formatEntryNumber(locale, String(manualWeight)),
            reps: String(manualReps),
            entered: true,
          });
          await page.getByText(expectedSet, { exact: true }).waitFor();
          await capture('history-detail');
          await page.reload();
          await page
            .getByRole('tab', { name: contains(text('nav.progress')) })
            .click();
          await openHistory.click();
          await button('history.back').waitFor();
          await page.getByText(expectedSet, { exact: true }).waitFor();
          assert.deepEqual(
            await state(),
            finished,
            'Reload never duplicates History',
          );
          await capture('history-reloaded');
          // Delete a second active workout, preserving the completed first one.
          await page
            .getByRole('tab', { name: contains(text('nav.profile')) })
            .click();
          await button('profile.myWorkouts', false).click();
          await page
            .getByRole('button', { name: 'QA-localized-plan', exact: true })
            .click();
          await button('sharing.start').click();
          await editFirst.waitFor();
          const second = await state();
          assert.notEqual(second.activeWorkout.id, session.id);
          assert.deepEqual(second.history, finished.history);
          await button('workout.discard').click();
          await button('workout.keepTraining').waitFor();
          await failNextWrite();
          const confirmDiscard = page.getByRole('dialog').getByRole('button', {
            name: text('workout.discard'),
            exact: true,
          });
          await confirmDiscard.click();
          await page
            .getByText(text('error.workoutDiscard'), { exact: false })
            .first()
            .waitFor();
          await assertFailureConsumed();
          assert.deepEqual(
            await state(),
            second,
            'Failed discard preserves active workout',
          );
          await capture('discard-error');
          await confirmDiscard.click();
          await button('workout.keepTraining').waitFor({ state: 'hidden' });
          const discarded = await state();
          assert.equal(discarded.activeWorkout, null);
          assert.deepEqual(
            discarded.history,
            finished.history,
            'Discard preserves History',
          );
          assert.deepEqual(
            discarded.templates,
            finished.templates,
            'Discard preserves plans',
          );
          await capture('discarded');
          await page.reload();
          await page
            .getByRole('tab', { name: contains(text('nav.progress')) })
            .click();
          await openHistory.click();
          await button('history.back').waitFor();
          assert.deepEqual(
            await state(),
            discarded,
            'Discard survives reload without History duplication',
          );
          await capture('discard-reloaded-history');
          result.workout = {
            completedSets: 1,
            plannedSets: 4,
            weight: first.weight,
            reps: first.reps,
            reloadPreservedRestDeadline: true,
            historyRecords: finished.history.length,
            setWriteRetry: true,
            finishWriteRetry: true,
            discardWriteRetry: true,
            discardedSessionAbsentAfterReload: true,
          };
          await button('history.back').click();
          await page
            .getByRole('tab', { name: contains(text('nav.progress')) })
            .click();
          await button('progress.muscles').waitFor();
          await page
            .getByRole('heading', {
              name: text('progress.estimated'),
              exact: true,
            })
            .locator('..')
            .getByText(text('catalog.exercise.dumbbell-lateral-raise'), {
              exact: true,
            })
            .waitFor();
          result.localizedProgressRecord = true;
          await capture('progress');
          await button('progress.muscles').click();
          await capture('muscles');
          await page
            .getByRole('tab', { name: contains(text('nav.home')) })
            .click();
          await page.getByRole('radio').nth(0).click();
          await planStart().click();
          await button('workout.addSet').waitFor();
          const plannedStartState = await state();
          const plannedSession = plannedStartState.activeWorkout;
          assert.equal(plannedSession.programSlot.slotIndex, 0);
          assert.equal(plannedSession.programSlot.assignmentId, assignment.id);
          assert.deepEqual(
            plannedSession.exercises.map(({ libraryId }) => libraryId),
            assignment.templates[0].exerciseIds,
          );
          const expectedLogged = structuredClone(plannedSession.exercises);
          let completedSets = 0;
          let workoutVolumeKg = 0;
          const plannedSetCount = expectedLogged.reduce(
            (count, exercise) => count + exercise.sets.length,
            0,
          );
          const enteredReps = numberLocale(10);
          for (const [index, exercise] of expectedLogged.entries()) {
            const weight =
              exercise.libraryId === 'bodyweight-step-up' ? 0 : 12.5;
            for (const [setIndex, set] of exercise.sets.entries()) {
              const bilateral = set.otherSideReps !== undefined;
              await namedButton('workout.editWeight', {
                index: setIndex + 1,
              }).click();
              await button('entry.useKeypad').click();
              await exactWeight.fill(numberLocale(weight));
              await page
                .getByRole('textbox', {
                  name: text(bilateral ? 'entry.exactLeft' : 'entry.exactReps'),
                  exact: true,
                })
                .fill(enteredReps);
              if (bilateral)
                await page
                  .getByRole('textbox', {
                    name: text('entry.exactRight'),
                    exact: true,
                  })
                  .fill(enteredReps);
              await button('entry.saveValues').click();
              await exactWeight.waitFor({ state: 'hidden' });
              await page
                .getByRole('checkbox', {
                  name: text('workout.completeNamed', { index: setIndex + 1 }),
                  exact: true,
                })
                .click();
              completedSets += 1;
              workoutVolumeKg += weight * (bilateral ? 20 : 10);
              await button(
                completedSets < plannedSetCount
                  ? 'workout.skipRest'
                  : 'workout.finishSave',
              ).waitFor();
              const active = (await state()).activeWorkout;
              const logged = active.exercises[index].sets[setIndex];
              assert.equal(typeof logged.completedAt, 'number');
              Object.assign(set, {
                weight: String(weight),
                reps: '10',
                entered: true,
                completedAt: logged.completedAt,
                ...(bilateral ? { otherSideReps: '10' } : {}),
              });
              assert.deepEqual(
                active.exercises[index],
                exercise,
                'Logging retains exercise identity and targets',
              );
              if (completedSets < plannedSetCount) {
                await button('workout.skipRest').click();
                await button('workout.skipRest').waitFor({ state: 'hidden' });
              }
            }
            await capture(`program-recorded-${index + 1}`);
          }
          assert.equal(completedSets, plannedSetCount);
          const allRecorded = await state();
          assert.deepEqual(allRecorded.activeWorkout.exercises, expectedLogged);
          assert.deepEqual(
            allRecorded.history,
            discarded.history,
            'Recording never creates premature History',
          );
          await button('workout.finishSave').click();
          await button('workout.keepTraining').waitFor();
          await page
            .getByRole('dialog')
            .getByText(text('workout.finishFull'), { exact: true })
            .waitFor();
          await capture('program-finish-confirmation');
          await page
            .getByRole('dialog')
            .getByRole('button', {
              name: text('workout.finishSave'),
              exact: true,
            })
            .click();
          await button('common.done').waitFor();
          const plannedFinished = await state();
          assert.equal(plannedFinished.activeWorkout, null);
          assert.equal(plannedFinished.history.length, 2);
          const completedProgram = plannedFinished.history[0];
          assert.equal(completedProgram.id, plannedSession.id);
          assert.deepEqual(completedProgram.exercises, expectedLogged);
          assert.deepEqual(
            completedProgram.programSlot,
            plannedSession.programSlot,
          );
          assert.ok(completedProgram.finishedAt >= plannedSession.startedAt);
          assert.deepEqual(
            plannedFinished.history.slice(1),
            discarded.history,
            'Earlier manual History remains exact',
          );
          assert.deepEqual(plannedFinished.templates, discarded.templates);
          await button('common.done').click();
          const formatInteger = (value) =>
            numberLocale(value).replace(/\s/g, ' ');
          await page
            .getByText(
              `${formatInteger(workoutVolumeKg + manualVolumeKg)} ${text('progress.kg')}`,
              {
                exact: false,
              },
            )
            .first()
            .waitFor();
          await capture('program-progress-total');
          await page
            .getByText(
              text('volume.viewAll', { period: text('progress.period.1M') }),
              { exact: true },
            )
            .click();
          await button('volume.close').waitFor();
          await page
            .getByText(
              text('progress.valueKg', {
                value: formatInteger(workoutVolumeKg),
              }),
              { exact: true },
            )
            .waitFor();
          await capture('program-workout-volume');
          await button('volume.close').click();
          const plannedHistory = namedButton('history.open', {
            name: plannedSession.name,
          });
          await plannedHistory.click();
          await button('history.back').waitFor();
          await page
            .getByText(
              text('history.set', {
                index: 1,
                weight: formatEntryNumber(locale, '12.5'),
                reps: '10',
              }),
              { exact: true },
            )
            .first()
            .waitFor();
          if (
            expectedLogged.some(({ sets }) =>
              sets.some(({ otherSideReps }) => otherSideReps !== undefined),
            )
          )
            await page
              .getByText(
                text('history.bilateralSet', {
                  index: 1,
                  weight: formatEntryNumber(locale, '12.5'),
                  reps: '10',
                  other: '10',
                }),
                { exact: true },
              )
              .waitFor();
          await capture('program-completed-history');
          await page
            .getByRole('tab', { name: contains(text('nav.home')) })
            .click();
          const firstSlot = page.getByRole('radio').nth(0);
          await firstSlot.waitFor();
          assert.ok(
            (await firstSlot.innerText()).includes('✓'),
            'Finished program slot is marked completed',
          );
          await firstSlot.click();
          assert.equal(
            await planStart().count(),
            0,
            'Completed slot cannot be started again from the plan action',
          );
          await capture('program-completed-slot');
          await page.getByRole('radio').nth(1).click();
          await planStart(1).click();
          await button('workout.addSet').waitFor();
          const afterCompletionStart = (await state()).activeWorkout;
          assert.equal(afterCompletionStart.programSlot.slotIndex, 1);
          assert.deepEqual(
            afterCompletionStart.programSlot,
            regularSession.programSlot,
          );
          assert.deepEqual(
            afterCompletionStart.exercises.map(
              (exercise) => exercise.libraryId,
            ),
            assignment.templates[1].exerciseIds,
            'Following slot retains every authored exercise in order',
          );
          afterCompletionStart.exercises.forEach((exercise, index) =>
            assert.equal(
              exercise.sets.length,
              assignment.templates[1].plannedExercises[index].sets,
            ),
          );
          await capture('program-following-slot');
          await button('workout.discard').click();
          await button('workout.keepTraining').waitFor();
          await page
            .getByRole('dialog')
            .getByRole('button', {
              name: text('workout.discard'),
              exact: true,
            })
            .click();
          await button('workout.keepTraining').waitFor({ state: 'hidden' });
          assert.deepEqual(
            await state(),
            plannedFinished,
            'Discarding following slot retains completed program History',
          );
          await page.reload();
          await page
            .getByRole('tab', { name: contains(text('nav.profile')) })
            .waitFor();
          assert.deepEqual(
            await state(),
            plannedFinished,
            'Reload retains exactly two History records',
          );
          assert.ok(
            (await page.getByRole('radio').nth(0).innerText()).includes('✓'),
          );
          assert.deepEqual(
            (await readProgramState()).program,
            accepted.program,
            'Completion never rewrites authored program',
          );
          await capture('program-completion-reloaded');
          result.programCompletion = {
            completedExercises: expectedLogged.length,
            completedSets,
            workoutVolumeKg,
            combinedVolumeKg: workoutVolumeKg + manualVolumeKg,
            historyRecords: 2,
            completedSlotRetained: true,
            nextSlotUsesAuthoredSets: true,
          };
          assert.deepEqual(result.errors, [], 'Browser runtime errors');
          assert.deepEqual(result.network, [], 'Unexpected external requests');
          result.pass = true;
        } catch (error) {
          result.pass = false;
          result.failure = error.message;
          await page
            .screenshot({
              path: path.join(
                outputDir,
                `${locale}-${width}-${expand ? 'expanded' : 'normal'}-failure.png`,
              ),
            })
            .catch((captureError) => {
              result.failureScreenshot = captureError.message;
            });
        } finally {
          report.results.push(result);
          console.log(
            locale,
            width,
            expand ? 'expanded' : 'normal',
            result.pass ? 'PASS' : result.failure,
          );
          await context.close();
        }
      };
      const workers = Math.min(4, scenarios.length);
      let next = 0;
      await Promise.allSettled(
        Array.from({ length: workers }, async () => {
          while (next < scenarios.length) await runScenario(scenarios[next++]);
        }),
      ).then((outcomes) => {
        for (const outcome of outcomes)
          if (outcome.status === 'rejected') throw outcome.reason;
      });
    }
  } finally {
    await browser.close();
    server.close();
    assert.equal(hash(fs.readFileSync(entry)), originalHash);
    for (const [file, digest] of Object.entries(originalBundleHashes))
      assert.equal(hash(fs.readFileSync(file)), digest);
    report.byLocale = Object.fromEntries(
      locales.map((locale) => {
        const runs = report.results.filter(
          (result) => result.locale === locale,
        );
        return [
          locale,
          {
            passed: runs.filter((run) => run.pass).length,
            expected: widths.length * textModes.length,
          },
        ];
      }),
    );
    fs.writeFileSync(
      path.join(outputDir, 'report.json'),
      JSON.stringify(report, null, 2) + '\n',
    );
  }
  assertQaMatrix(matrix, report.results);
  assert.ok(
    report.results.every((result) => result.pass),
    'Localization browser smoke failed; inspect report.json',
  );
}

module.exports = {
  prepareQaBundle,
  expandCatalog,
  assertQaPlan,
  readCatalogs,
  qaMatrix,
  assertQaMatrix,
};
if (require.main === module)
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
