/* Focused posterior review checks and source diagnostic; no runtime changes. */
/* global __dirname */
const { Buffer } = require('node:buffer');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const path = require('node:path');

async function main() {
  const dom = new JSDOM(fs.readFileSync(process.argv[2], 'utf8'), {
    runScripts: 'dangerously',
  });
  const doc = dom.window.document;
  const el = (s) => doc.querySelector(s);
  const paths = () => [...el('[data-masks]').children];
  const change = (s, value, event = 'change') => {
    el(s).value = value;
    el(s).dispatchEvent(new dom.window.Event(event));
  };
  assert.equal(paths().length, 4);
  assert.equal(el('[data-side]').value, 'both');
  assert(el('[data-left]').disabled);
  for (const part of ['soleus-lateral-visible', 'soleus-medial-visible']) {
    change('[data-structure]', part);
    assert.equal(paths().length, 2);
    const originalRight = paths()[1].getAttribute('d');
    change('[data-left]', 1.5, 'input');
    assert.equal(paths()[1].getAttribute('d'), originalRight);
    change('[data-shift-left]', 2, 'input');
    change('[data-shift-y-left]', -1.5, 'input');
    change('[data-shift-right]', 2.5, 'input');
    change('[data-shift-y-right]', 1, 'input');
    assert.equal(paths()[0].getAttribute('transform'), 'translate(2 -1.5)');
    assert.equal(paths()[1].getAttribute('transform'), 'translate(-2.5 1)');
    change('[data-side]', 'left');
    assert.equal(paths().length, 1);
    assert.equal(el('svg').getAttribute('viewBox'), '795 900 90 135');
    change('[data-side]', 'right');
    assert.equal(paths()[0].dataset.side, 'right');
    change('[data-side]', 'both');
    for (const s of [
      '[data-left]',
      '[data-right]',
      '[data-shift-left]',
      '[data-shift-right]',
      '[data-shift-y-left]',
      '[data-shift-y-right]',
    ]) {
      assert.equal(el(s).step, '0.5');
      change(s, 0, 'input');
    }
    for (const s of ['[data-shift-left]', '[data-shift-right]']) {
      assert.equal(el(s).min, '-10');
      assert.equal(el(s).max, '10');
    }
  }
  change('[data-structure]', 'all');
  assert.equal(paths().length, 4);
  el('[data-mode="source"]').click();
  assert.equal(paths().length, 0);
  el('[data-mode="outline"]').click();
  assert(paths().every((p) => p.classList.contains('muscle-outline')));
  el('[data-mode="fill"]').click();
  change('[data-opacity]', 0, 'input');
  assert.equal(el('[data-masks]').getAttribute('opacity'), '0');
  change('[data-opacity]', 0.65, 'input');
  change('[data-zoom]', 'phone');
  assert.equal(el('svg').getAttribute('viewBox'), '656 0 656 1199');
  change('[data-zoom]', 'detail');
  const svg = el('svg');
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('width', '1200');
  svg.setAttribute('height', '540');
  const source = fs.readFileSync(
    path.join(__dirname, '../assets/muscle-map/male-anatomy-v1/source.png'),
  );
  svg
    .querySelector(':scope > image')
    .setAttribute('href', 'data:image/png;base64,' + source.toString('base64'));
  assert(paths().every((p) => p.classList.contains('unassigned-fill')));
  for (const p of paths()) p.setAttribute('fill', '#ff9f0a');
  const sharp = require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
  await sharp(Buffer.from(svg.outerHTML))
    .flatten({ background: '#fff' })
    .png()
    .toFile('/workspace/soleus-review-check.png');
  console.log(
    'PASS: four patches, independent side/part controls, posterior signs, source/outline/fill, opacity, detail/full-height crops; diagnostic rendered.',
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
