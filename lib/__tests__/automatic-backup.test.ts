import {
  AutomaticBackupRepository,
  type ArchiveSlot,
} from '../automatic-backup';
import { createLocalBackup } from '../local-backup';
import { emptyWorkoutState, STATE_KEY } from '../workout-repository';
async function setup() {
  const values = new Map<ArchiveSlot, string>();
  const text = await createLocalBackup(
    {
      getItem: async (k) =>
        k === STATE_KEY ? JSON.stringify(emptyWorkoutState()) : null,
      setItem: async () => {},
      removeItem: async () => {},
    },
    1000,
  );
  const files = {
    read: async (s: ArchiveSlot) => values.get(s) ?? null,
    write: async (s: ArchiveSlot, t: string) => {
      values.set(s, t);
    },
  };
  return {
    values,
    text,
    files,
    repository: new AutomaticBackupRepository(files),
  };
}
it('writes and verifies alternating files and chooses by sequence even if the device clock rolls back', async () => {
  const s = await setup();
  expect(await s.repository.load()).toBeUndefined();
  const first = await s.repository.save(s.text);
  const second = await s.repository.save(
    JSON.stringify({ ...JSON.parse(s.text), createdAt: 900 }),
  );
  expect(first.slot).toBe('a');
  expect(second.slot).toBe('b');
  expect((await s.repository.load())?.createdAt).toBe(900);
  expect((await s.repository.save(s.text)).slot).toBe('a');
  expect(s.values.size).toBe(2);
});
it('keeps the last verified copy when the next slot write fails or is silently truncated', async () => {
  const s = await setup();
  await s.repository.save(s.text);
  s.files.write = async (slot) => {
    s.values.set(slot, 'partial');
    throw Error('disk full');
  };
  await expect(s.repository.save(s.text)).rejects.toThrow('disk full');
  expect((await s.repository.load())?.sequence).toBe(1);
  s.files.write = async (slot) => {
    s.values.set(slot, 'truncated');
  };
  await expect(s.repository.save(s.text)).rejects.toThrow('verified');
  expect((await s.repository.load())?.sequence).toBe(1);
});
it('serializes simultaneous automatic copies instead of overwriting the same slot', async () => {
  const s = await setup();
  const result = await Promise.all([
    s.repository.save(s.text),
    s.repository.save(s.text),
  ]);
  expect(result.map((c) => c.sequence)).toEqual([1, 2]);
});

it('loads the healthy alternate when one slot cannot be read, without overwriting the unreadable slot', async () => {
  const s = await setup();
  await s.repository.save(s.text);
  const healthy = s.values.get('a');
  const original = s.files.read;
  s.files.read = async (slot) => {
    if (slot === 'b') throw Error('file unavailable');
    return original(slot);
  };
  expect((await s.repository.load())?.sequence).toBe(1);
  await expect(s.repository.save(s.text)).rejects.toThrow('file unavailable');
  expect(s.values.get('a')).toBe(healthy);
  expect(s.values.has('b')).toBe(false);
});
