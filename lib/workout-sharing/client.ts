import { validPlanOrigin } from './import';
import { parseSharedPlan, type SharedPlan } from './contract';
import type { PlanOrigin } from '../workout-model';
import { createPlanLink } from './links';
export type ResolvedPlan = { origin: PlanOrigin; plan: SharedPlan };
export type PublishedPlan = { origin: PlanOrigin; url: string };
export type SharingInvoke = (
  method: 'POST' | 'DELETE',
  body: unknown,
) => Promise<unknown>;
export class EquipmentSharingUnavailable extends Error {
  constructor() {
    super(
      'Grouped plan publishing needs backend support. The local plan is unchanged.',
    );
  }
}
export class SharingClient {
  constructor(
    private endpoint: string,
    private key: string,
    readonly host: string,
    private request: typeof fetch = fetch,
    private invoke?: SharingInvoke,
  ) {}
  private async get(query: string): Promise<unknown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await this.request(this.endpoint + query, {
        headers: { apikey: this.key },
        signal: controller.signal,
        redirect: 'error',
      });
      if (!res.ok) throw Error();
      const text = await res.text();
      if (text.length > 2000000) throw Error();
      return JSON.parse(text);
    } catch {
      throw Error('Sharing unavailable');
    } finally {
      clearTimeout(timer);
    }
  }
  private resolved(input: unknown): ResolvedPlan {
    const v = input as Partial<ResolvedPlan> | null;
    if (!v || !validPlanOrigin(v.origin)) throw Error('Sharing unavailable');
    try {
      return { origin: v.origin, plan: parseSharedPlan(v.plan) };
    } catch {
      throw Error('Sharing unavailable');
    }
  }
  async resolve(token: string): Promise<ResolvedPlan> {
    if (!/^[a-f0-9]{64}$/.test(token)) throw Error('Sharing unavailable');
    return this.resolved(await this.get('?token=' + token));
  }
  async resolveLibrary(id: string): Promise<ResolvedPlan> {
    if (!validPlanOrigin({ publicationId: id, version: 1 }))
      throw Error('Sharing unavailable');
    return this.resolved(await this.get('?publicationId=' + id));
  }
  async list(): Promise<unknown> {
    return this.get('?library=1');
  }
  async publish(plan: SharedPlan): Promise<PublishedPlan> {
    try {
      if (!this.invoke) throw Error();
      const validated = parseSharedPlan(plan);
      if (validated.schemaVersion === 2) {
        let capabilities: { sharedPlan?: unknown };
        try {
          capabilities = (await this.get('?capabilities=1')) as {
            sharedPlan?: unknown;
          };
        } catch {
          throw new EquipmentSharingUnavailable();
        }
        if (!capabilities || capabilities.sharedPlan !== 2)
          throw new EquipmentSharingUnavailable();
      }
      const result = (await this.invoke('POST', validated)) as {
        origin: PlanOrigin;
        token: string;
      };
      if (!validPlanOrigin(result.origin)) throw Error();
      return {
        origin: result.origin,
        url: createPlanLink(this.host, result.token),
      };
    } catch (error) {
      if (error instanceof EquipmentSharingUnavailable) throw error;
      throw Error('Sharing unavailable');
    }
  }
  async owned(): Promise<
    { origin: PlanOrigin; title: string; createdAt: number }[]
  > {
    try {
      if (!this.invoke) throw Error();
      const result = await this.invoke('POST', { action: 'list' });
      if (
        !Array.isArray(result) ||
        result.length > 500 ||
        result.some(
          (v) =>
            !v ||
            !validPlanOrigin(v.origin) ||
            typeof v.title !== 'string' ||
            v.title.length > 120 ||
            typeof v.createdAt !== 'number' ||
            !Number.isFinite(v.createdAt) ||
            v.createdAt < 0 ||
            v.createdAt > 8640000000000000,
        )
      )
        throw Error();
      return result;
    } catch {
      throw Error('Sharing unavailable');
    }
  }
  async revoke(publicationId: string): Promise<void> {
    try {
      if (!this.invoke) throw Error();
      await this.invoke('DELETE', { publicationId });
    } catch {
      throw Error('Sharing unavailable');
    }
  }
}
export function sharingConfig() {
  const host = process.env.EXPO_PUBLIC_SHARING_HOST?.trim();
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (
    process.env.EXPO_PUBLIC_SHARING_ENABLED !== 'true' ||
    !host ||
    !url ||
    !key
  )
    return null;
  try {
    createPlanLink(host, 'a'.repeat(64));
    const u = new URL(url);
    if (
      u.protocol !== 'https:' ||
      u.username ||
      u.password ||
      u.pathname !== '/'
    )
      return null;
    return { host, endpoint: url + '/functions/v1/shared-plan', key };
  } catch {
    return null;
  }
}
