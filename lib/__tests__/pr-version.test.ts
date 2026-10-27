import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
const { versionForPullRequest, syncProjectVersion } = jest.requireActual(
  '../../scripts/pr-version.cjs',
);

it.each([
  [98, '0.0.98', '0.0.98'],
  [99, '0.0.99', '0.0.99'],
  [100, '0.1.00', '0.1.0'],
  [105, '0.1.05', '0.1.5'],
  [199, '0.1.99', '0.1.99'],
  [200, '0.2.00', '0.2.0'],
  [9999, '0.99.99', '0.99.99'],
  [10000, '1.0.00', '1.0.0'],
])(
  'maps PR %s to display %s and a valid native/package version',
  (pr, displayVersion, version) => {
    expect(versionForPullRequest(pr)).toEqual({
      pullRequest: pr,
      displayVersion,
      version,
    });
  },
);

it.each([
  0,
  -1,
  1.5,
  NaN,
  Infinity,
  Number.MAX_SAFE_INTEGER + 1,
  '',
  '105x',
  '1e2',
])('rejects an invalid PR number %s', (pr) => {
  expect(() => versionForPullRequest(pr)).toThrow();
});

it('synchronizes metadata and rejects stale versions in a PR check without writing', () => {
  const root = mkdtempSync(join(tmpdir(), 'cresum-pr-version-'));
  const json = (name: string) =>
    JSON.parse(readFileSync(join(root, name), 'utf8'));
  const write = (name: string, data: object) =>
    writeFileSync(join(root, name), JSON.stringify(data, null, 2) + '\n');
  try {
    write('package.json', { name: 'cresum', version: '0.0.98' });
    write('package-lock.json', {
      version: '0.0.98',
      packages: {
        '': { name: 'cresum', version: '0.0.98' },
        'node_modules/example': { version: '2.3.4' },
      },
    });
    write('app.json', {
      expo: {
        version: '0.0.98',
        scheme: ['cresum', 'fitflow'],
        ios: { bundleIdentifier: 'com.fitflow.app' },
        android: { package: 'com.fitflow.app' },
      },
    });
    const before = ['package.json', 'package-lock.json', 'app.json'].map((f) =>
      readFileSync(join(root, f), 'utf8'),
    );
    expect(() => syncProjectVersion(root, 105, true)).toThrow(/out of sync/i);
    expect(
      ['package.json', 'package-lock.json', 'app.json'].map((f) =>
        readFileSync(join(root, f), 'utf8'),
      ),
    ).toEqual(before);
    syncProjectVersion(root, 105);
    expect(json('package.json').version).toBe('0.1.5');
    expect(json('package-lock.json').version).toBe('0.1.5');
    expect(json('package-lock.json').packages[''].version).toBe('0.1.5');
    expect(
      json('package-lock.json').packages['node_modules/example'].version,
    ).toBe('2.3.4');
    expect(json('app.json').expo).toEqual({
      version: '0.1.5',
      scheme: ['cresum', 'fitflow'],
      ios: { bundleIdentifier: 'com.fitflow.app' },
      android: { package: 'com.fitflow.app' },
    });
    expect(() => syncProjectVersion(root, 105, true)).not.toThrow();
    const event = join(root, 'event.json');
    write('event.json', { pull_request: { number: 106 } });
    const options = {
      cwd: root,
      env: {
        ...process.env,
        GITHUB_EVENT_NAME: 'pull_request',
        GITHUB_EVENT_PATH: event,
      },
      stdio: 'pipe' as const,
    };
    const script = resolve(__dirname, '../../scripts/pr-version.cjs');
    execFileSync(process.execPath, [script, '105'], {
      cwd: root,
      stdio: 'pipe',
    });
    execFileSync(
      process.execPath,
      [
        resolve(__dirname, '../../node_modules/prettier/bin/prettier.cjs'),
        '--check',
        'package.json',
        'package-lock.json',
        'app.json',
      ],
      { cwd: root, stdio: 'pipe' },
    );
    expect(() =>
      execFileSync(process.execPath, [script, '--check'], options),
    ).toThrow();
    syncProjectVersion(root, 106);
    expect(
      execFileSync(process.execPath, [script, '--check'], options).toString(),
    ).toContain('0.1.06');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

it('rejects malformed PR event metadata without changing version files', () => {
  const root = mkdtempSync(join(tmpdir(), 'cresum-invalid-pr-event-'));
  const files = ['package.json', 'package-lock.json', 'app.json'];
  const metadata = [
    { name: 'cresum', version: '0.0.99' },
    { version: '0.0.99', packages: { '': { version: '0.0.99' } } },
    { expo: { version: '0.0.99' } },
  ];
  try {
    files.forEach((name, index) =>
      writeFileSync(join(root, name), JSON.stringify(metadata[index]) + '\n'),
    );
    const before = files.map((name) => readFileSync(join(root, name), 'utf8'));
    const event = join(root, 'event.json');
    const script = resolve(__dirname, '../../scripts/pr-version.cjs');
    const invalidEvents = [
      '{malformed',
      'null',
      '{}',
      '{"pull_request":{}}',
      '{"pull_request":{"number":null}}',
      '{"pull_request":{"number":"99"}}',
      '{"pull_request":{"number":[99]}}',
      '{"pull_request":{"number":{}}}',
      '{"pull_request":{"number":0}}',
      '{"pull_request":{"number":-99}}',
      '{"pull_request":{"number":99.5}}',
      '{"pull_request":{"number":9007199254740992}}',
      undefined,
    ];
    for (const eventJson of invalidEvents) {
      if (eventJson !== undefined) writeFileSync(event, eventJson);
      const result = spawnSync(process.execPath, [script, '--check', '99'], {
        cwd: root,
        env: {
          ...process.env,
          GITHUB_EVENT_NAME: 'pull_request',
          GITHUB_EVENT_PATH: eventJson === undefined ? undefined : event,
        },
        encoding: 'utf8',
      });
      expect({ eventJson, status: result.status }).toEqual({
        eventJson,
        status: 1,
      });
      expect(
        files.map((name) => readFileSync(join(root, name), 'utf8')),
      ).toEqual(before);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
