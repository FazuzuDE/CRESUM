/* global __dirname */
// Isolated development QA of the actual exported app, never a production dependency.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { readCatalogs } = require('./localization-web-qa.cjs');
async function main() {
  const root = path.resolve(__dirname, '..');
  const option = (name, fallback) =>
    process.argv.includes(name)
      ? process.argv[process.argv.indexOf(name) + 1]
      : fallback;
  const exportDir = path.resolve(option('--export-dir', 'dist'));
  const outputDir = path.resolve(
    option('--output-dir', '.tools/arabic-rtl-qa'),
  );
  fs.mkdirSync(outputDir, { recursive: true });
  const entryDir = path.join(exportDir, '_expo/static/js/web');
  const names = fs
    .readdirSync(entryDir)
    .filter((n) => /^entry-.*\.js$/.test(n));
  assert.equal(names.length, 1);
  const raw = fs.readFileSync(path.join(entryDir, names[0]), 'utf8');
  const served = raw;
  const catalogs = readCatalogs(root);
  const server = http.createServer((req, res) => {
    const pathname = new URL(req.url, 'http://qa').pathname;
    const file = path.resolve(
      exportDir,
      '.' + (pathname === '/' ? '/index.html' : decodeURIComponent(pathname)),
    );
    if (!file.startsWith(exportDir + path.sep) || !fs.existsSync(file)) {
      res.writeHead(404);
      res.end();
      return;
    }
    const ext = path.extname(file);
    const type =
      {
        '.js': 'application/javascript',
        '.html': 'text/html',
        '.css': 'text/css',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.ttf': 'font/ttf',
        '.woff2': 'font/woff2',
      }[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    res.end(path.basename(file) === names[0] ? served : fs.readFileSync(file));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const report = {
    exportSha256: crypto.createHash('sha256').update(raw).digest('hex'),
    browser: browser.version(),
    nativeAcceptance: false,
    results: [],
  };
  try {
    for (const width of [320, 390]) {
      const context = await browser.newContext({
        viewport: { width, height: 850 },
        locale: 'ar-SA',
      });
      const page = await context.newPage();
      page.setDefaultTimeout(12000);
      const result = {
        width,
        checkpoints: [],
        errors: [],
        network: [],
        pass: false,
      };
      report.results.push(result);
      page.on('pageerror', (e) => result.errors.push(e.message));
      await context.route('**/*', (route) => {
        const url = route.request().url();
        if (url.startsWith(origin + '/') || url.startsWith('data:'))
          return route.continue();
        result.network.push(url);
        return route.abort();
      });
      await context.addInitScript(() => {
        if (!localStorage.getItem('cresum_language_preference_v1'))
          localStorage.setItem(
            'cresum_language_preference_v1',
            JSON.stringify({ version: 1, preference: 'ar' }),
          );
        if (!localStorage.getItem('cresum_onboarding_v1'))
          localStorage.setItem(
            'cresum_onboarding_v1',
            JSON.stringify({
              version: 1,
              status: 'completed',
              step: 'complete',
              answers: { displayName: 'QA Athlete' },
            }),
          );
      });
      const t = (key, params = {}) =>
        catalogs.ar[key].replace(
          /{{(\w+)(?:,\s*number)?}}/g,
          (_, n) => params[n] ?? `{{${n}}}`,
        );
      const button = (key) =>
        page.getByRole('button', { name: t(key), exact: true });
      const capture = async (name) => {
        await page.screenshot({
          path: path.join(outputDir, `${width}-${name}.png`),
          fullPage: false,
        });
        assert.ok(
          await page.evaluate(
            () => document.body.scrollWidth <= innerWidth + 1,
          ),
          `${name}: horizontal overflow`,
        );
        result.checkpoints.push(name);
      };
      try {
        await page.goto(origin);
        const home = page.getByRole('tab', {
          name: t('nav.home'),
          exact: true,
        });
        const profile = page.getByRole('tab', {
          name: t('nav.profile'),
          exact: true,
        });
        await profile.waitFor();
        assert.ok(
          (await home.boundingBox()).x > (await profile.boundingBox()).x,
          'RTL dock tab order',
        );
        await capture('home');
        await profile.click();
        await button('profile.library').click();
        const search = page.getByRole('textbox', {
          name: t('library.searchLabel'),
          exact: true,
        });
        await search.fill('فراشة');
        await page
          .getByText(catalogs.ar['catalog.exercise.pec-deck-fly'], {
            exact: true,
          })
          .waitFor();
        assert.equal(
          await search.evaluate((el) => getComputedStyle(el).textAlign),
          'right',
        );
        await capture('library-search');
        const core = await page.evaluate(() =>
          localStorage.getItem('fitflow_state_v1'),
        );
        const technique = page.getByRole('button', {
          name: t('library.techniqueFor', {
            name: catalogs.ar['catalog.exercise.pec-deck-fly'],
          }),
          exact: true,
        });
        await technique.click();
        await page.getByText(t('technique.setup'), { exact: true }).waitFor();
        await capture('technique');
        await button('technique.closeDetails').click();
        assert.equal(await search.inputValue(), 'فراشة');
        assert.equal(
          await page.evaluate(() => localStorage.getItem('fitflow_state_v1')),
          core,
        );
        await button('library.backProfile').click();
        await button('language.title').click();
        await capture('language-wheel');
        await button('common.cancel').click();
        assert.equal(
          await page.evaluate(
            () =>
              JSON.parse(localStorage.getItem('cresum_language_preference_v1'))
                .preference,
          ),
          'ar',
        );
        await page.reload();
        await page
          .getByRole('tab', { name: t('nav.profile'), exact: true })
          .waitFor();
        assert.equal(
          await page.evaluate(
            () =>
              JSON.parse(localStorage.getItem('cresum_language_preference_v1'))
                .preference,
          ),
          'ar',
        );
        assert.deepEqual(result.errors, []);
        assert.deepEqual(result.network, []);
        result.pass = true;
      } catch (error) {
        result.failure = error.message;
        await page.screenshot({
          path: path.join(outputDir, `${width}-failure.png`),
        });
      }
      await context.close();
    }
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
    fs.writeFileSync(
      path.join(outputDir, 'report.json'),
      JSON.stringify(report, null, 2) + '\n',
    );
  }
  assert.ok(
    report.results.length === 2 && report.results.every((r) => r.pass),
    'Arabic RTL web smoke failed; inspect report.json',
  );
  console.log(JSON.stringify(report, null, 2));
}
if (require.main === module)
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
