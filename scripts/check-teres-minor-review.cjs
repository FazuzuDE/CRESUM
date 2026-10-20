/* Focused review checks and a diagnostic render; no product runtime changes. */
/* global __dirname */
const { Buffer } = require('node:buffer');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const path = require('node:path');

async function main() {
  const fragment = fs.readFileSync(process.argv[2], 'utf8');
  const dom = new JSDOM(fragment, { runScripts: 'dangerously' });
  const doc = dom.window.document;
  const el = (s) => doc.querySelector(s);
  const paths = () => [...el('[data-masks]').children];
  const change = (selector, value, event = 'change') => {
    el(selector).value = value;
    el(selector).dispatchEvent(new dom.window.Event(event));
  };
  assert.equal(paths().length, 1);
  assert.equal(el('[data-side]').value, 'left');
  change('[data-side]', 'both');
  assert.equal(paths().length, 2);
  for (const structure of ['teres-minor']) {
    change('[data-structure]', structure);
    assert.equal(paths().length, 2);
    const right = paths().find((p) => p.dataset.side === 'right');
    const original = right.getAttribute('d');
    change('[data-left]', 1.5, 'input');
    assert.equal(
      paths()
        .find((p) => p.dataset.side === 'right')
        .getAttribute('d'),
      original,
    );
    change('[data-shift-left]', 2, 'input');
    change('[data-shift-y-left]', -1.5, 'input');
    assert.equal(paths()[0].getAttribute('transform'), 'translate(2 -1.5)');
    change('[data-shift-right]', 2.5, 'input');
    change('[data-shift-y-right]', 1, 'input');
    assert.equal(paths()[1].getAttribute('transform'), 'translate(-2.5 1)');
    change('[data-side]', 'left');
    assert.equal(paths().length, 1);
    change('[data-side]', 'both');
    for (const [selector, value] of [
      ['[data-left]', 0],
      ['[data-shift-left]', 0],
      ['[data-shift-y-left]', 0],
      ['[data-shift-right]', 0],
      ['[data-shift-y-right]', 0],
    ])
      change(selector, value, 'input');
  }
  change('[data-structure]', 'teres-minor');
  assert.equal(paths().length, 2);
  el('[data-mode="source"]').click();
  assert.equal(paths().length, 0);
  el('[data-mode="outline"]').click();
  assert(paths().every((p) => p.classList.contains('muscle-outline')));
  el('[data-mode="fill"]').click();
  change('[data-opacity]', 0, 'input');
  assert.equal(el('[data-masks]').getAttribute('opacity'), '0');
  change('[data-opacity]', 0.65, 'input');
  const svg = el('svg');
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('width', '1080');
  svg.setAttribute('height', '284');
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
    .toFile('/workspace/teres-minor-review-check.png');
  console.log(
    'PASS: two regions, one pair, independent inset/XY, side filtering, source/outline/fill, group opacity; diagnostic rendered.',
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
