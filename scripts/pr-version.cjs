const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

function versionForPullRequest(value) {
  const text = typeof value === 'string' ? value.trim() : String(value);
  if (!/^[1-9]\d*$/.test(text))
    throw Error('PR number must be a positive integer');
  const pullRequest = Number(text);
  if (!Number.isSafeInteger(pullRequest)) throw Error('PR number is too large');
  const major = Math.floor(pullRequest / 10000);
  const minor = Math.floor(pullRequest / 100) % 100;
  const patch = pullRequest % 100;
  return {
    pullRequest,
    version: `${major}.${minor}.${patch}`,
    displayVersion: `${major}.${minor}.${String(patch).padStart(2, '0')}`,
  };
}

function pullRequestFromVersion(version) {
  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d?)\.(0|[1-9]\d?)$/.exec(version);
  if (!match) throw Error('Invalid PR-based package version');
  return Number(match[1]) * 10000 + Number(match[2]) * 100 + Number(match[3]);
}

function syncProjectVersion(root, pullRequest, checkOnly = false) {
  const result = versionForPullRequest(pullRequest);
  const read = (name) =>
    JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
  const pkg = read('package.json');
  const lock = read('package-lock.json');
  const app = read('app.json');
  if (!lock.packages?.[''] || !app.expo)
    throw Error('Missing root version metadata');
  const values = [
    pkg.version,
    lock.version,
    lock.packages[''].version,
    app.expo.version,
  ];
  if (checkOnly) {
    if (values.some((value) => value !== result.version))
      throw Error(
        `PR version metadata out of sync; run npm run version:pr -- ${result.pullRequest}`,
      );
  } else {
    pkg.version =
      lock.version =
      lock.packages[''].version =
      app.expo.version =
        result.version;
    for (const [name, data] of [
      ['package.json', pkg],
      ['package-lock.json', lock],
      ['app.json', app],
    ])
      fs.writeFileSync(
        path.join(root, name),
        JSON.stringify(data, null, 2) + '\n',
      );
    const prettierCli = path.join(
      path.dirname(require.resolve('prettier/package.json')),
      'bin/prettier.cjs',
    );
    execFileSync(
      process.execPath,
      [prettierCli, '--write', 'package.json', 'package-lock.json', 'app.json'],
      { cwd: root, stdio: 'pipe' },
    );
  }
  return result;
}

function run() {
  const args = process.argv.slice(2);
  const check = args.includes('--check');
  const numbers = args.filter((arg) => arg !== '--check');
  if (numbers.length > 1 || (!check && numbers.length === 0))
    throw Error(
      'Usage: npm run version:pr -- <PR-number>, or npm run version:check',
    );
  let pr = numbers[0];
  if (check && process.env.GITHUB_EVENT_NAME === 'pull_request') {
    if (!process.env.GITHUB_EVENT_PATH)
      throw Error('Missing GitHub PR event metadata');
    const event = JSON.parse(
      fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'),
    );
    pr = event?.pull_request?.number;
    if (typeof pr !== 'number' || !Number.isSafeInteger(pr) || pr <= 0)
      throw Error('GitHub PR number must be a positive safe integer number');
  } else if (pr === undefined) {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    pr = pullRequestFromVersion(pkg.version);
  }
  const result = syncProjectVersion(process.cwd(), pr, check);
  console.log(
    `CRESUM ${result.displayVersion} (PR #${result.pullRequest}; native/package ${result.version}).`,
  );
}

module.exports = { versionForPullRequest, syncProjectVersion };
if (require.main === module) {
  try {
    run();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
