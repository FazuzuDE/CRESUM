import { normalizeDecimalInput } from './i18n/format';
export const BODY_WEIGHT_KEY = 'cresum_body_weight_v1';
export type BodyWeightEntry = { id: string; recordedAt: number; kg: number };
type Storage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<unknown>;
};
export function parseBodyWeight(value: string): number {
  const normalized = normalizeDecimalInput(value) ?? '';
  const kg = Number(normalized);
  if (
    !/^\d+(?:\.\d+)?$/.test(normalized) ||
    !Number.isFinite(kg) ||
    kg <= 0 ||
    kg > 1000
  )
    throw Error('Enter a valid body weight between 0 and 1,000 kg.');
  return kg;
}
export class BodyWeightRepository {
  private pending: Promise<unknown> = Promise.resolve();
  constructor(private readonly storage: Storage) {}
  load(): Promise<BodyWeightEntry[]> {
    const work = this.pending.catch(() => undefined).then(() => this.read());
    this.pending = work;
    return work;
  }
  private async read(): Promise<BodyWeightEntry[]> {
    const raw = await this.storage.getItem(BODY_WEIGHT_KEY);
    if (raw === null) return [];
    try {
      const data = JSON.parse(raw);
      if (
        data.version !== 1 ||
        !Array.isArray(data.entries) ||
        data.entries.some(
          (p: BodyWeightEntry) =>
            !p ||
            typeof p.id !== 'string' ||
            !p.id ||
            !Number.isFinite(p.recordedAt) ||
            !Number.isFinite(new Date(p.recordedAt).getTime()) ||
            p.recordedAt < 0 ||
            !Number.isFinite(p.kg) ||
            p.kg <= 0 ||
            p.kg > 1000,
        ) ||
        new Set(data.entries.map((p: BodyWeightEntry) => p.id)).size !==
          data.entries.length
      )
        throw Error();
      return [...data.entries].sort((a, b) => a.recordedAt - b.recordedAt);
    } catch {
      throw Error(
        'Saved body weight is unavailable. Your measurements have not been changed.',
      );
    }
  }
  record(
    value: string,
    recordedAt = Date.now(),
    initialOnly = false,
  ): Promise<BodyWeightEntry[]> {
    const work = this.pending
      .catch(() => undefined)
      .then(async () => {
        const kg = parseBodyWeight(value);
        if (
          !Number.isFinite(recordedAt) ||
          recordedAt < 0 ||
          recordedAt > Date.now()
        )
          throw Error('Enter a valid measurement date.');
        const entries = await this.read();
        if (initialOnly && entries.length) return entries;
        const next = [
          ...entries,
          {
            id: `weight-${recordedAt}-${Math.random().toString(36).slice(2, 10)}`,
            recordedAt,
            kg,
          },
        ].sort((a, b) => a.recordedAt - b.recordedAt);
        await this.storage.setItem(
          BODY_WEIGHT_KEY,
          JSON.stringify({ version: 1, entries: next }),
        );
        return next;
      });
    this.pending = work;
    return work;
  }
  async waitForPendingWrites() {
    await this.pending.catch(() => undefined);
  }
}
