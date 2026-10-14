const assert = require('node:assert/strict');
const pkg = require('../package.json');
const { expo } = require('../app.json');

assert.equal(expo.version, pkg.version, 'Expo and package versions must match');
assert.equal(pkg.main, 'expo-router/entry', 'Use the Expo Router entry point');
assert.ok(expo.ios?.bundleIdentifier, 'iOS bundle identifier is required');
assert.ok(expo.android?.package, 'Android application ID is required');
assert.equal(pkg.name, 'cresum', 'Use the CRESUM npm package name');
assert.equal(expo.name, 'CRESUM', 'Use the CRESUM app display name');
assert.equal(expo.slug, 'cresum', 'Use the CRESUM project slug');
assert.deepEqual(
  expo.scheme,
  ['cresum', 'fitflow'],
  'Keep legacy deep links alongside CRESUM',
);
assert.equal(
  expo.ios.bundleIdentifier,
  'com.fitflow.app',
  'Preserve the installed iOS application identity',
);
assert.equal(
  expo.android.package,
  'com.fitflow.app',
  'Preserve the installed Android application identity',
);
console.log(`CRESUM configuration is consistent (${pkg.version}).`);
