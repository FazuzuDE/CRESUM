/* Focused bilateral review checks and saved-state diagnostic. */
/* global __dirname */
const { Buffer } = require('node:buffer');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const path = require('node:path');
const { JSDOM } = require('jsdom');

async function main() {
  const fragment = fs.readFileSync(process.argv[2], 'utf8');
  const dom = new JSDOM(fragment, { runScripts: 'dangerously' });
  const doc = dom.window.document;
  const el = (selector) => doc.querySelector(selector);
  const paths = () => [...el('[data-masks]').children];
  const change = (selector, value, event = 'change') => {
    el(selector).value = value;
    el(selector).dispatchEvent(new dom.window.Event(event));
  };
  assert.equal(paths().length, 2);
  assert.equal(el('select[data-structure]'), null);
  assert(paths().every((p) => p.classList.contains('unassigned-fill')));
  for (const [side, inset, shift] of [
    ['left', 1.5, -0.5],
    ['right', 1.5, 1.5],
  ]) {
    assert.equal(Number(el('[data-' + side + ']').value), inset);
    assert.equal(Number(el('[data-shift-' + side + ']').value), shift);
    assert.equal(Number(el('[data-shift-y-' + side + ']').value), 0);
    assert(!el('[data-' + side + ']').disabled);
    for (const selector of [
      '[data-shift-' + side + ']',
      '[data-shift-y-' + side + ']',
    ]) {
      assert.equal(el(selector).min, '-10');
      assert.equal(el(selector).max, '10');
      assert.equal(el(selector).step, '0.5');
    }
  }
  const originalRight = paths()[1].outerHTML;
  const originalLeft = paths()[0].getAttribute('d');
  change('[data-left]', 2, 'input');
  assert.notEqual(paths()[0].getAttribute('d'), originalLeft);
  assert.equal(paths()[1].outerHTML, originalRight);
  change('[data-shift-left]', 2, 'input');
  change('[data-shift-y-left]', -1.5, 'input');
  assert.equal(paths()[0].getAttribute('transform'), 'translate(-2 -1.5)');
  change('[data-shift-right]', 2.5, 'input');
  change('[data-shift-y-right]', 1, 'input');
  assert.equal(paths()[1].getAttribute('transform'), 'translate(2.5 1)');
  change('[data-side]', 'left');
  assert.equal(paths().length, 1);
  assert.equal(el('svg').getAttribute('viewBox'), '450 800 50 225');
  change('[data-side]', 'right');
  assert.equal(paths()[0].dataset.side, 'right');
  assert.equal(el('svg').getAttribute('viewBox'), '235 800 50 225');
  change('[data-side]', 'both');
  el('[data-mode="source"]').click();
  assert.equal(paths().length, 0);
  el('[data-mode="outline"]').click();
  assert(paths().every((p) => p.classList.contains('muscle-outline')));
  el('[data-mode="fill"]').click();
  change('[data-opacity]', 0, 'input');
  assert.equal(el('[data-masks]').getAttribute('opacity'), '0');
  change('[data-zoom]', 'phone');
  assert.equal(el('svg').getAttribute('viewBox'), '0 0 656 1199');
  const fresh = new JSDOM(fragment, { runScripts: 'dangerously' }).window
    .document;
  const svg = fresh.querySelector('svg');
  assert(
    /^data:image\/(png|webp);base64,/.test(
      svg.querySelector(':scope > image').getAttribute('href'),
    ),
  );
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('width', '1060');
  svg.setAttribute('height', '900');
  const source = fs.readFileSync(
    path.join(__dirname, '../assets/muscle-map/male-anatomy-v1/source.png'),
  );
  svg
    .querySelector(':scope > image')
    .setAttribute('href', 'data:image/png;base64,' + source.toString('base64'));
  for (const p of fresh.querySelector('[data-masks]').children)
    p.setAttribute('fill', '#ff9f0a');
  const sharp = require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
  await sharp(Buffer.from(svg.outerHTML))
    .flatten({ background: '#fff' })
    .png()
    .toFile('/workspace/tibialis-review-check.png');
  console.log(
    'PASS: two unassigned regions, exact restored defaults, independent inset/XY, front signs, side crops, source/outline/fill, opacity and full-height view; saved-state diagnostic rendered.',
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
