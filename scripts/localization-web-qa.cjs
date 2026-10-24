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
              /{{(\w+)}}/g,
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
            await button('sharing.close').click();
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
