import { createWorkoutSnapshotId } from '../workout-snapshot-id.web';
import * as crypto from 'expo-crypto';
jest.mock('expo-crypto', () => ({
  __esModule: true,
  getRandomValues: (array: Uint8Array) =>
    jest.requireActual('node:crypto').webcrypto.getRandomValues(array),
}));

it('creates distinct RFC4122 v4 IDs without browser randomUUID', () => {
  const first = createWorkoutSnapshotId();
  const second = createWorkoutSnapshotId();
  expect(first).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
  );
  expect(second).not.toBe(first);
});

it('propagates secure random-source failure instead of using weak randomness', () => {
  const spy = jest.spyOn(crypto, 'getRandomValues').mockImplementation(() => {
    throw Error('Secure randomness unavailable');
  });
  try {
    expect(createWorkoutSnapshotId).toThrow('Secure randomness unavailable');
  } finally {
    spy.mockRestore();
  }
});
