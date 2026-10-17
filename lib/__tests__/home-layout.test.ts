import {
  defaultHomeLayout,
  parseHomeLayout,
  HomeLayoutRepository,
  HOME_LAYOUT_KEY,
} from '../home-layout';
import { resetLocalData } from '../local-data-reset';
import {
  createLocalBackup,
  parseLocalBackup,
  restoreLocalBackup,
} from '../local-backup';

it('keeps device preferences outside workout reset and backup/restore', async () => {
  const layout = defaultHomeLayout();
  layout.widgets.reverse();
  const raw = JSON.stringify(layout);
  const values = new Map([[HOME_LAYOUT_KEY, raw]]);
  const storage = {
    getItem: async (key: string) => values.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: async (key: string) => {
      values.delete(key);
    },
  };
  const backup = await createLocalBackup(storage);
  expect(backup).not.toContain(HOME_LAYOUT_KEY);
  expect(Object.keys(JSON.parse(backup).data)).not.toContain('homeLayout');
  await resetLocalData(storage, async () => {});
  expect(values.get(HOME_LAYOUT_KEY)).toBe(raw);
  await restoreLocalBackup(storage, await parseLocalBackup(backup));
  expect(values.get(HOME_LAYOUT_KEY)).toBe(raw);
});

it('keeps saved order and hidden blocks while repairing missing, duplicate and retired IDs', () => {
  const layout = parseHomeLayout({
    version: 1,
    widgets: [
      { id: 'latest', visible: false },
      { id: 'retired', visible: true },
      { id: 'primary', visible: false },
      { id: 'latest', visible: true },
    ],
  });
  expect(layout.widgets).toEqual([
    { id: 'latest', visible: false },
    { id: 'primary', visible: true },
    { id: 'week', visible: true },
    { id: 'summary', visible: true },
    { id: 'templates', visible: true },
  ]);
});

it.each([
  null,
  {},
  { version: 2, widgets: [] },
  { version: 1, widgets: 'bad' },
  { version: 1, widgets: [{ id: 'week', visible: 'false' }] },
])(
  'rejects invalid or future documents without silently rewriting them: %p',
  (value) => {
    expect(() => parseHomeLayout(value)).toThrow();
  },
);

it('persists only layout preferences and restores them with a fresh repository', async () => {
  const values = new Map<string, string>([['workouts', 'untouched']]);
  const storage = {
    getItem: async (key: string) => values.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      values.set(key, value);
    },
  };
  const repo = new HomeLayoutRepository(storage);
  expect(await repo.load()).toEqual(defaultHomeLayout());
  const layout = defaultHomeLayout();
  layout.widgets.reverse();
  layout.widgets.find((w) => w.id === 'summary')!.visible = false;
  await repo.save(layout);
  expect(await new HomeLayoutRepository(storage).load()).toEqual(layout);
  expect(values.get('workouts')).toBe('untouched');
  expect([...values.keys()]).toEqual(['workouts', HOME_LAYOUT_KEY]);
});

it('reports storage failures and preserves corrupt data until an explicit save', async () => {
  const storage = {
    getItem: jest.fn(async () => '{broken'),
    setItem: jest.fn(async () => {}),
  };
  const repo = new HomeLayoutRepository(storage);
  await expect(repo.load()).rejects.toThrow();
  expect(storage.setItem).not.toHaveBeenCalled();
  storage.getItem.mockRejectedValueOnce(Error('disk'));
  await expect(repo.load()).rejects.toThrow();
  storage.setItem.mockRejectedValueOnce(Error('full'));
  await expect(repo.save(defaultHomeLayout())).rejects.toThrow();
});
