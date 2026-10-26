import {
  validateSharedPlan,
  type SharedPlan,
} from '../_shared/plan-contract.ts';
export type SharedPlanService = {
  getUser(token: string): Promise<{ id: string; isAnonymous: boolean } | null>;
  resolveExercise(id: string): string | null;
  resolveFamily?(id: string): string | null;
  capabilities?(): Promise<{ historyGroups?: number; sharedPlan?: number }>;
  limit(): Promise<boolean>;
  publish(owner: string, plan: SharedPlan): Promise<unknown>;
  read(token: string): Promise<unknown | null>;
  revoke(owner: string, id: string): Promise<void>;
  library(): Promise<unknown>;
  owned?(owner: string): Promise<unknown>;
  readLibrary?(id: string): Promise<unknown | null>;
};
const response = (status: number, value: unknown) =>
  new Response(status === 204 ? null : JSON.stringify(value), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers':
        'authorization, apikey, content-type, x-client-info',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    },
  });
async function body(request: Request): Promise<unknown> {
  if (!request.body) throw Error('body');
  const reader = request.body.getReader();
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    for (;;) {
      const next = await reader.read();
      if (next.done) break;
      size += next.value.length;
      if (size > 65536) throw Error('size');
      chunks.push(next.value);
    }
  } finally {
    await reader.cancel();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const c of chunks) {
    bytes.set(c, offset);
    offset += c.length;
  }
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
}
export function createSharedPlanHandler(service: SharedPlanService) {
  return async (request: Request): Promise<Response> => {
    if (request.method === 'OPTIONS') return response(204, null);
    try {
      if (!(await service.limit())) return response(429, { code: 'rate' });
      const url = new URL(request.url);
      if (request.method === 'GET') {
        if (url.searchParams.get('capabilities') === '1')
          return response(200, (await service.capabilities?.()) ?? {});
        if (url.searchParams.get('library') === '1')
          return response(200, await service.library());
        const publicationId = url.searchParams.get('publicationId');
        if (
          publicationId &&
          /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(publicationId)
        ) {
          const value = await service.readLibrary?.(publicationId);
          return value
            ? response(200, value)
            : response(404, { code: 'unavailable' });
        }
        const token = url.searchParams.get('token');
        if (!token || !/^[a-f0-9]{64}$/.test(token))
          return response(404, { code: 'unavailable' });
        const result = await service.read(token);
        return result
          ? response(200, result)
          : response(404, { code: 'unavailable' });
      }
      if (!['POST', 'DELETE'].includes(request.method))
        return response(405, { code: 'method' });
      const token = request.headers
        .get('authorization')
        ?.match(/^Bearer (.+)$/i)?.[1];
      const user = token ? await service.getUser(token) : null;
      if (!user || user.isAnonymous) return response(401, { code: 'auth' });
      let value: unknown;
      try {
        value = await body(request);
      } catch {
        return response(400, { code: 'invalid' });
      }
      if (request.method === 'POST') {
        if (
          typeof value === 'object' &&
          value !== null &&
          (value as { action?: unknown }).action === 'list'
        )
          return response(200, (await service.owned?.(user.id)) ?? []);
        let plan: SharedPlan;
        try {
          plan = validateSharedPlan(
            value,
            service.resolveExercise,
            service.resolveFamily,
          );
        } catch {
          return response(400, { code: 'invalid' });
        }
        if (
          plan.schemaVersion === 2 &&
          (await service.capabilities?.())?.sharedPlan !== 2
        )
          return response(409, { code: 'equipment_support_required' });
        return response(200, await service.publish(user.id, plan));
      }
      const id = (value as { publicationId?: unknown })?.publicationId;
      if (
        typeof id !== 'string' ||
        !/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(id)
      )
        return response(400, { code: 'invalid' });
      await service.revoke(user.id, id);
      return response(200, { revoked: true });
    } catch {
      return response(503, { code: 'retry' });
    }
  };
}
