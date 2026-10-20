/* Combined study UI and exact-path/clip checks, with saved-state diagnostics. */
/* global __dirname */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { Buffer } = require('node:buffer');
const { JSDOM } = require('jsdom');

async function main() {
  const fragment = fs.readFileSync(process.argv[2], 'utf8');
  const dom = new JSDOM(fragment, { runScripts: 'dangerously' });
  const d = dom.window.document;
  const el = (s) => d.querySelector(s);
  const paths = () => [...el('[data-layer]').querySelectorAll('path')];
  const payload = JSON.parse(el('[data-geometry]').textContent);
  assert.equal(payload.regions.length, 92);
  assert.equal(paths().length, 92);
  assert.equal(new Set(payload.regions.map((r) => r.id)).size, 92);
  assert.equal(
    payload.regions.filter((r) => r.muscleGroupId === null).length,
    36,
  );
  assert.equal(
    payload.regions.filter(
      (r) => r.visualStatus === 'selected-reference-boundary-review',
    ).length,
    2,
  );
  assert(
    payload.regions.every(
      (r) =>
        !r.id.includes('medial-posterior-surface') &&
        !r.id.includes('unassigned-lower-region'),
    ),
  );
  assert(!fragment.includes('fetch('));
  assert(!fragment.includes('<html'));
  const base = path.join(__dirname, '../assets/muscle-map/male-anatomy-v1');
  for (const region of payload.regions) {
    const p = paths().find((p) => p.dataset.region === region.id);
    assert.equal(p.getAttribute('d'), region.path);
    assert.equal(p.getAttribute('transform'), region.transform);
    const original = JSON.parse(
      fs.readFileSync(path.join(base, region.sourceGeometry)),
    ).regions.find((r) => r.id === region.id);
    assert.equal(region.path, original.path);
    assert.equal(region.transform, original.transform || '');
    assert.equal(region.muscleGroupId, original.muscleGroupId || null);
    if (region.clipId) {
      assert.equal(
        p.parentElement.getAttribute('mask'),
        'url(#' + region.clipId + ')',
      );
      assert(el('#' + region.clipId));
    }
  }
  const change = (selector, value, event = 'change') => {
    el(selector).value = value;
    el(selector).dispatchEvent(new dom.window.Event(event));
  };
  el('[data-projection]').checked = false;
  el('[data-projection]').dispatchEvent(new dom.window.Event('change'));
  assert.equal(paths().length, 90);
  el('[data-mode="overlap"]').click();
  assert.equal(
    paths()[0].getAttribute('d'),
    payload.overlapPathWithoutProjections,
  );
  el('[data-projection]').checked = true;
  el('[data-projection]').dispatchEvent(new dom.window.Event('change'));
  assert.equal(paths()[0].getAttribute('d'), payload.overlapPath);
  el('[data-mode="fill"]').click();
  change('[data-view]', 'front');
  assert.equal(paths().length, 52);
  assert.equal(el('svg').getAttribute('viewBox'), '0 0 656 1199');
  change('[data-view]', 'back');
  assert.equal(paths().length, 40);
  change('[data-crop]', 'upper');
  assert.equal(el('svg').getAttribute('viewBox'), '656 120 656 500');
  change('[data-crop]', 'lower');
  assert.equal(el('svg').getAttribute('viewBox'), '656 580 656 560');
  el('[data-mode="outline"]').click();
  assert(paths().every((p) => p.classList.contains('outline')));
  el('[data-mode="source"]').click();
  assert.equal(paths().length, 0);
  el('[data-mode="overlap"]').click();
  assert.equal(paths().length, 1);
  assert.equal(paths()[0].getAttribute('d'), payload.overlapPath);
  assert(payload.overlapPath.length > 0);
  el('[data-mode="fill"]').click();
  change('[data-opacity]', 0, 'input');
  assert.equal(el('[data-layer]').getAttribute('opacity'), '0');
  assert(paths().every((p) => !p.hasAttribute('opacity')));
  const fresh = new JSDOM(fragment, { runScripts: 'dangerously' }).window
    .document;
  const svg = fresh.querySelector('svg');
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('width', '1312');
  svg.setAttribute('height', '1199');
  const source = fs.readFileSync(path.join(base, 'source.png'));
  svg
    .querySelector(':scope > image')
    .setAttribute('href', 'data:image/png;base64,' + source.toString('base64'));
  for (const p of fresh
    .querySelector('[data-layer]')
    .querySelectorAll('path')) {
    p.setAttribute(
      'fill',
      p.classList.contains('unassigned') ? '#ff9f0a' : '#ff3b30',
    );
  }
  const sharp = require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
  await sharp(Buffer.from(svg.outerHTML))
    .flatten({ background: '#fff' })
    .png()
    .toFile('/workspace/combined-muscle-review-check.png');
  console.log(
    'PASS: 92 exact paths/transforms/groups and referenced clips, 52/40 view filtering and lumbar projection toggle, crops, source/outline/overlap/fill, group opacity and saved-state diagnostic.',
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
