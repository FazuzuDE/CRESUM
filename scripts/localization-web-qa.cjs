/* global __dirname */
// Development-only browser checks. Never imported by the application.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { parse } = require('@babel/parser');

function expandCatalog(catalog) {
  const expand = (text) =>
    `⟦${text.replace(/{{[^}]+}}|[^{}]+/g, (part) =>
      part.startsWith('{{')
        ? part
        : part.replace(
            /[aeiouyAEIOUYаеёиоуыэюяАЕЁИОУЫЭЮЯäöüÄÖÜàâæéèêëîïôœùûÿÀÂÆÉÈÊËÎÏÔŒÙÛŸ]/g,
            (letter) => `${letter}ː${letter}`,
          ),
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
  const registry = find('localeRegistry');
  const original = source.slice(registry.start, registry.end);
  let changed = 0;
  const code = original.replace(/released:(?:!1|false)/g, () => {
    changed++;
    return 'released:!0';
  });
  assert.equal(changed, 3, 'Expected exactly three unreleased QA locales');
  const replacements = [{ ...registry, code }];
  if (catalogs) {
    const module = find('catalogs');
    const id = module.expression.arguments[1].value;
    replacements.push({
      ...module,
      code: `__d(function(g,r,i,a,m,e,d){Object.defineProperty(e,"__esModule",{value:true});e.catalogs=${JSON.stringify(catalogs)}},${id},[]);`,
    });
  }
  for (const edit of replacements.sort((a, b) => b.start - a.start)) {
    source = source.slice(0, edit.start) + edit.code + source.slice(edit.end);
  }
  return source;
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

function readCatalogs(root) {
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
  return Object.fromEntries(
    ['en', 'ru', 'de', 'fr'].map((locale) => {
      const folder = path.join(root, 'lib/i18n/locales', locale);
      const catalog = {};
      for (const file of fs
        .readdirSync(folder)
        .filter((v) => v.endsWith('.ts'))) {
        Object.assign(catalog, load(path.join(folder, file)).default);
      }
      return [locale, catalog];
    }),
  );
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
  const entryDir = path.join(exportDir, '_expo/static/js/web');
  const entries = fs
    .readdirSync(entryDir)
    .filter((v) => /^entry-.*\.js$/.test(v));
  assert.equal(entries.length, 1, 'Export exactly one web entry first');
  const entry = path.join(entryDir, entries[0]);
  const source = fs.readFileSync(entry, 'utf8');
  const originalHash = crypto.createHash('sha256').update(source).digest('hex');
  const catalogs = readCatalogs(root);
  const normal = prepareQaBundle(source);
  const expanded = prepareQaBundle(
    source,
    Object.fromEntries(
      Object.entries(catalogs).map(([locale, value]) => [
        locale,
        expandCatalog(value),
      ]),
    ),
  );
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
        file === entry
          ? expandedMode
            ? expanded
            : normal
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
    browser: browser.version(),
    qaOnlyRegistryOverride: true,
    qaMutatedProductionFiles: false,
    results: [],
  };
  try {
    for (const expand of [false, true])
      for (const locale of ['en', 'ru', 'de', 'fr'])
        for (const width of [320, 390]) {
          expandedMode = expand;
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
          await context.addInitScript((value) => {
            localStorage.setItem(
              'cresum_language_preference_v1',
              JSON.stringify({ version: 1, preference: value }),
            );
            localStorage.setItem(
              'cresum_onboarding_v1',
              JSON.stringify({
                version: 1,
                status: 'completed',
                step: 'complete',
                answers: {},
              }),
            );
          }, locale);
          const catalog = expand
            ? expandCatalog(catalogs[locale])
            : catalogs[locale];
          const text = (key, params = {}) => {
            assert.equal(typeof catalog[key], 'string', key);
            return catalog[key].replace(
              /{{(\w+)(?:,\s*number)?}}/g,
              (_, name) => params[name] ?? `{{${name}}}`,
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
            await page
              .getByRole('tab', { name: contains(text('nav.profile')) })
              .waitFor();
            await capture('home');
            await page
              .getByRole('tab', { name: contains(text('nav.profile')) })
              .click();
            await button('profile.workouts', false).waitFor();
            await capture('profile');
            await button('profile.workouts', false).click();
            await button('editor.create').waitFor();
            await capture('plans');
            await button('editor.create').click();
            await page
              .getByRole('textbox', { name: text('editor.name'), exact: true })
              .fill('QA-localized-plan');
            await button('editor.next').click();
            await page
              .getByRole('textbox', {
                name: text('library.searchLabel'),
                exact: true,
              })
              .fill('lateral');
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
              await page
                .getByText(contains(text(key)))
                .scrollIntoViewIfNeeded();
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
              'lateral',
            );
            assert.equal(
              await page.evaluate(() =>
                localStorage.getItem('fitflow_state_v1'),
              ),
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
              .getByRole('textbox', {
                name: text('library.searchLabel'),
                exact: true,
              })
              .waitFor({ state: 'hidden' });
            await page
              .getByRole('textbox', { name: text('editor.sets'), exact: true })
              .fill('4');
            await page
              .getByRole('textbox', {
                name: text('editor.weightLabel'),
                exact: true,
              })
              .fill('12,5');
            await capture('exercise');
            await button('editor.addExercise').click();
            await button('editor.cancel').click();
            await button('editor.keep').waitFor();
            await capture('discard');
            await button('editor.keep').click();
            await button('editor.save').click();
            await page
              .getByText('QA-localized-plan', { exact: true })
              .waitFor();
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
            await exactReps.fill('7');
            await capture('set-draft');
            await button('entry.cancelLabel').click();
            await exactWeight.waitFor({ state: 'hidden' });
            assert.deepEqual(await state(), started, 'Cancel preserves Core');

            await editFirst.click();
            await button('entry.useKeypad').click();
            await exactWeight.fill('12,5');
            await exactReps.fill('8');
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
              weight: '12.5',
              reps: '8',
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
            assert.equal(first.weight, '12.5');
            assert.equal(first.reps, '8');
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
              weight: locale === 'en' ? '12.5' : '12,5',
              reps: '8',
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
            await button('profile.workouts', false).click();
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
            const confirmDiscard = page
              .getByRole('dialog')
              .getByRole('button', {
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
            await capture('progress');
            await button('progress.muscles').click();
            await capture('muscles');
            assert.deepEqual(result.errors, [], 'Browser runtime errors');
            assert.deepEqual(
              result.network,
              [],
              'Unexpected external requests',
            );
            result.pass = true;
          } catch (error) {
            result.pass = false;
            result.failure = error.message;
            await page.screenshot({
              path: path.join(
                outputDir,
                `${locale}-${width}-${expand ? 'expanded' : 'normal'}-failure.png`,
              ),
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
        }
  } finally {
    await browser.close();
    server.close();
    assert.equal(
      crypto.createHash('sha256').update(fs.readFileSync(entry)).digest('hex'),
      originalHash,
    );
    fs.writeFileSync(
      path.join(outputDir, 'report.json'),
      JSON.stringify(report, null, 2) + '\n',
    );
  }
  assert.ok(
    report.results.length === 16 &&
      report.results.every((result) => result.pass),
    'Localization browser smoke failed; inspect report.json',
  );
}

module.exports = { prepareQaBundle, expandCatalog, assertQaPlan };
if (require.main === module)
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
