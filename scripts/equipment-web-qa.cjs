// Development-only smoke of the actual Expo web export; no production locale activation.
const fs = require('node:fs'),
  path = require('node:path'),
  http = require('node:http'),
  assert = require('node:assert/strict'),
  vm = require('node:vm');
const root = process.cwd(),
  exportDir = path.join(root, '.tools/equipment-web-export'),
  out = path.join(root, '.tools/equipment-qa');
fs.mkdirSync(out, { recursive: true });
const ts = require('typescript'),
  cache = new Map();
function load(file) {
  if (cache.has(file)) return cache.get(file);
  const exports = {};
  cache.set(file, exports);
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText,
    {
      exports,
      require: (name) => load(path.resolve(path.dirname(file), name + '.ts')),
    },
  );
  return exports;
}
const catalogs = load(path.join(root, 'lib/i18n/messages.ts')).catalogs;
const { prepareQaBundle } = require(
  path.join(root, 'scripts/localization-web-qa.cjs'),
);
const entry = fs
  .readdirSync(path.join(exportDir, '_expo/static/js/web'))
  .find((v) => /^entry-.*\.js$/.test(v));
const source = prepareQaBundle(
  fs.readFileSync(path.join(exportDir, '_expo/static/js/web', entry), 'utf8'),
);
const server = http.createServer((req, res) => {
  const relative = new URL(req.url, 'http://qa').pathname;
  const file = path.join(exportDir, relative === '/' ? 'index.html' : relative);
  try {
    res.setHeader(
      'Content-Type',
      {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.ttf': 'font/ttf',
        '.webp': 'image/webp',
        '.png': 'image/png',
      }[path.extname(file)] ?? 'application/octet-stream',
    );
    res.end(file.endsWith(entry) ? source : fs.readFileSync(file));
  } catch {
    res.writeHead(404);
    res.end();
  }
});
const ids = [
  'lat-pulldown-close-neutral-ergonomic-handle',
  'lat-pulldown-close-neutral-v-handle',
  'lat-pulldown-wide-pronated-bar',
];
const planned = ids.map((exerciseId, i) => ({
  exerciseId,
  sets: 2,
  exerciseGroup: {
    id: 'qa-station',
    familyId: 'lat-pulldown',
    name: 'Lat Pulldown',
  },
  plannedSets: [0, 1].map((n) => ({
    id: `preset-${i}-${n}`,
    weight: String(45 - i * 5),
    reps: '10',
  })),
}));
const template = {
  id: 'qa-plan',
  name: 'QA Pulldown',
  exerciseIds: ids,
  plannedExercises: planned,
};
const now = Date.now();
const active = {
  id: 'qa-active',
  templateId: template.id,
  name: 'QA Pulldown',
  startedAt: now - 120000,
  currentExerciseIndex: 0,
  restDurationSeconds: 90,
  exercises: ids.map((libraryId, i) => ({
    id: `exercise-${i}`,
    libraryId,
    name: 'QA ' + i,
    muscle: 'Back',
    exerciseGroup: { ...planned[i].exerciseGroup },
    sets: [0, 1].map((n) => ({
      id: `set-${i}-${n}`,
      weight: String(45 - i * 5),
      reps: '10',
    })),
  })),
};
const history = {
  ...structuredClone(active),
  id: 'qa-history',
  finishedAt: now - 1000,
  startedAt: now - 3600000,
};
history.exercises.forEach((e) =>
  e.sets.forEach((s) => (s.completedAt = now - 2000)),
);
(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
  const browser = await chromium.launch({
    ...(process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH }
      : {}),
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const results = [];
  try {
    for (const locale of process.env.QA_LOCALE
      ? [process.env.QA_LOCALE]
      : ['en', 'ru', 'de', 'fr'])
      for (const width of process.env.QA_LOCALE ? [390] : [320, 390]) {
        const result = { locale, width, screens: [], errors: [] };
        const context = await browser.newContext({
          viewport: { width, height: 850 },
        });
        const page = await context.newPage();
        page.setDefaultTimeout(12000);
        page.on('pageerror', (e) => result.errors.push(e.message));
        await context.route('**/*', (route) =>
          route
            .request()
            .url()
            .startsWith(origin + '/') ||
          route.request().url().startsWith('data:')
            ? route.continue()
            : route.abort(),
        );
        await context.addInitScript(
          ({ locale, state }) => {
            if (!localStorage.getItem('qa-seeded')) {
              localStorage.setItem('qa-seeded', '1');
              localStorage.setItem(
                'cresum_language_preference_v1',
                JSON.stringify({ version: 1, preference: locale }),
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
              localStorage.setItem('fitflow_state_v1', JSON.stringify(state));
            }
          },
          {
            locale,
            state: {
              schemaVersion: 1,
              activeWorkout: active,
              history: [history],
              templates: [template],
            },
          },
        );
        const t = (key, params = {}) => {
          const v = catalogs[locale][key];
          assert.equal(typeof v, 'string', key);
          return v.replace(
            /{{(\w+)(?:,\s*number)?}}/g,
            (_, n) => params[n] ?? `{{${n}}}`,
          );
        };
        const btn = (key, params) =>
          page.getByRole('button', { name: t(key, params), exact: true });
        const tab = (key) =>
          page.getByRole('tab', { name: new RegExp(t(key)) });
        async function capture(name) {
          await page.waitForTimeout(400);
          if (name === 'configure') {
            const picture = await page.locator('img').first().boundingBox();
            assert.ok(
              picture && picture.height <= picture.width * 1.1,
              'Technique art must fit the phone square',
            );
          }
          const overflow = await page.evaluate(() => ({
            page: document.body.scrollWidth > innerWidth + 1,
            items: [...document.querySelectorAll('[role="button"],input')]
              .filter((e) => {
                const b = e.getBoundingClientRect();
                for (
                  let parent = e.parentElement;
                  parent;
                  parent = parent.parentElement
                ) {
                  if (
                    ['auto', 'scroll'].includes(
                      getComputedStyle(parent).overflowX,
                    )
                  )
                    return false;
                }
                return (
                  b.width &&
                  b.top < innerHeight &&
                  b.bottom > 0 &&
                  !e.closest('[aria-hidden="true"]') &&
                  (b.left < -1 || b.right > innerWidth + 1)
                );
              })
              .map((e) => e.getAttribute('aria-label') || e.textContent),
          }));
          assert.equal(overflow.page, false, name);
          assert.deepEqual(overflow.items, [], name);
          await page.screenshot({
            path: path.join(out, `${locale}-${width}-${name}.png`),
          });
          result.screens.push(name);
        }
        try {
          await page.goto(origin);
          await tab('nav.workout').click();
          await page.getByRole('checkbox').first().waitFor();
          assert.equal(await page.getByRole('checkbox').count(), 6);
          await capture('workout');
          await btn('workout.editWeight', { index: 3 }).click();
          await capture('set-entry');
          await btn('entry.cancelLabel').click();
          await tab('nav.profile').click();
          await page
            .getByRole('button', { name: new RegExp(t('profile.workouts')) })
            .click();
          await btn('sharing.manage').click();
          await btn('templates.more', { name: template.name }).click();
          await btn('templates.edit').click();
          const label = catalogs[locale]['catalog.exercise.' + ids[0]];
          await btn('editor.editNamed', { name: label }).click();
          await btn('equipment.change', {
            name: t('equipment.compact'),
          }).waitFor();
          await capture('configure');
          await btn('equipment.change', {
            name: t('equipment.compact'),
          }).click();
          assert.equal(await page.getByRole('radio').count(), 3);
          await capture('picker');
          await page
            .getByRole('radio', { name: t('equipment.vHandle'), exact: true })
            .click();
          assert.equal(await page.getByRole('radio').count(), 0);
          await btn('equipment.change', {
            name: t('equipment.vHandle'),
          }).click();
          await btn('equipment.close').last().click();
          await page.waitForTimeout(400);
          assert.equal(
            await page.evaluate(() =>
              document.activeElement?.getAttribute('aria-label'),
            ),
            t('equipment.change', { name: t('equipment.vHandle') }),
          );
          await btn('equipment.change', {
            name: t('equipment.vHandle'),
          }).click();
          await page
            .getByRole('radio', { name: t('equipment.compact'), exact: true })
            .click();
          await page
            .getByRole('textbox', {
              name: t('equipment.rowWeight', { index: 1 }),
              exact: true,
            })
            .fill('46');
          await btn('equipment.addGroup').click();
          await btn('editor.save').click();
          await btn('templates.more', { name: template.name }).waitFor();
          const saved = await page.evaluate(() =>
            JSON.parse(localStorage.getItem('fitflow_state_v1')),
          );
          assert.equal(
            saved.templates.find((p) => p.id === 'qa-plan').plannedExercises[0]
              .plannedSets[0].weight,
            '46',
          );
          assert.equal(saved.activeWorkout.exercises[0].sets[0].weight, '45');
          await tab('nav.progress').click();
          await btn('history.open', { name: template.name }).click();
          await capture('history');
          assert.ok(
            await page
              .getByText(t('equipment.compact'), { exact: true })
              .count(),
          );
          await page.reload();
          await tab('nav.workout').click();
          assert.equal(await page.getByRole('checkbox').count(), 6);
          await page.evaluate(async () => {
            const images = [...document.images];
            await Promise.all(images.map((i) => i.decode()));
            if (images.some((i) => !i.naturalWidth))
              throw Error('Undecoded image');
          });
          await tab('nav.profile').click();
          await page
            .getByRole('button', { name: new RegExp(t('profile.library')) })
            .click();
          for (const exerciseId of [
            'bodyweight-step-up',
            'barbell-bench-press',
          ]) {
            const name = catalogs[locale]['catalog.exercise.' + exerciseId];
            await page
              .getByRole('textbox', {
                name: t('library.searchLabel'),
                exact: true,
              })
              .fill(name);
            await btn('library.view', { name }).click();
            if (exerciseId === 'bodyweight-step-up')
              await page
                .getByText(t('equipment.notRequired'), { exact: true })
                .waitFor();
            assert.equal(
              await page
                .getByRole('button', {
                  name: new RegExp(t('equipment.change', { name: '' })),
                })
                .count(),
              0,
            );
            await capture(
              exerciseId === 'bodyweight-step-up'
                ? 'not-applicable'
                : 'unmapped-policy',
            );
            await btn('technique.closeDetails').click();
          }
          result.pass = true;
        } catch (e) {
          result.pass = false;
          result.failure = e.message;
          await page.screenshot({
            path: path.join(out, `${locale}-${width}-failure.png`),
          });
          fs.writeFileSync(
            path.join(out, `${locale}-${width}-failure.txt`),
            await page.locator('body').innerText(),
          );
        } finally {
          results.push(result);
          await context.close();
          console.log(locale, width, result.pass, result.failure ?? '');
        }
      }
  } finally {
    fs.writeFileSync(
      path.join(out, 'report.json'),
      JSON.stringify(
        { qaOnlyLocaleOverride: true, externalNetworkBlocked: true, results },
        null,
        2,
      ),
    );
    await browser.close();
    server.close();
  }
  assert.ok(
    results.every((r) => r.pass),
    'Inspect browser report',
  );
})().catch((e) => {
  console.error(e);
  server.close();
  process.exitCode = 1;
});
