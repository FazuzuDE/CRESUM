import { BodyWeightRepository, BODY_WEIGHT_KEY } from '../body-weight';
const storage = () => {
  const values = new Map<string, string>();
  return {
    values,
    getItem: async (k: string) => values.get(k) ?? null,
    setItem: async (k: string, v: string) => {
      values.set(k, v);
    },
  };
};
it('seeds once, serializes concurrent additions and survives reopening', async () => {
  const s = storage(),
    r = new BodyWeightRepository(s);
  await r.record('80,5', 1000, true);
  await r.record('80,5', 2000, true);
  await Promise.all([r.record('80', 3000), r.record('79.8', 4000)]);
  expect((await new BodyWeightRepository(s).load()).map((p) => p.kg)).toEqual([
    80.5, 80, 79.8,
  ]);
  expect([...s.values.keys()]).toEqual([BODY_WEIGHT_KEY]);
});
it('retains corrupt measurements and reports failures instead of overwriting them', async () => {
  const s = storage();
  s.values.set(BODY_WEIGHT_KEY, '{broken');
  const r = new BodyWeightRepository(s);
  await expect(r.record('80', 1000)).rejects.toThrow('unavailable');
  expect(s.values.get(BODY_WEIGHT_KEY)).toBe('{broken');
});
it.each(['-1', '0', 'NaN', '1e2', '1001', ''])(
  'rejects invalid body weight %s',
  async (value) => {
    const s = storage();
    await expect(
      new BodyWeightRepository(s).record(value, 1000),
    ).rejects.toThrow('valid body weight');
    expect(s.values.size).toBe(0);
  },
);
it('orders a delayed startup read before a new measurement', async () => {
  const s = storage();
  let release!: (value: string | null) => void;
  const originalRead = s.getItem;
  const read = jest
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise<string | null>((resolve) => {
          release = resolve;
        }),
    )
    .mockImplementation(originalRead);
  const r = new BodyWeightRepository({ ...s, getItem: read });
  const startup = r.load();
  await Promise.resolve();
  await Promise.resolve();
  const addition = r.record('82', 1000);
  release(null);
  expect(await startup).toEqual([]);
  expect((await addition).map((p) => p.kg)).toEqual([82]);
  expect((await r.load()).map((p) => p.kg)).toEqual([82]);
});
it('retries a failed initial seed before accepting later measurements', async () => {
  const s = storage();
  const write = jest
    .fn()
    .mockRejectedValueOnce(Error('temporary'))
    .mockImplementation(s.setItem);
  const r = new BodyWeightRepository({ ...s, setItem: write });
  await expect(r.record('85', 1000, true)).rejects.toThrow('temporary');
  await r.record('85', 1000, true);
  await r.record('84', 2000);
  expect((await r.load()).map((p) => p.kg)).toEqual([85, 84]);
});
it('rejects out-of-calendar timestamps without replacing saved bytes', async () => {
  const s = storage(),
    raw = JSON.stringify({
      version: 1,
      entries: [{ id: 'invalid', recordedAt: 1e308, kg: 80 }],
    });
  s.values.set(BODY_WEIGHT_KEY, raw);
  await expect(new BodyWeightRepository(s).load()).rejects.toThrow(
    'unavailable',
  );
  expect(s.values.get(BODY_WEIGHT_KEY)).toBe(raw);
});
