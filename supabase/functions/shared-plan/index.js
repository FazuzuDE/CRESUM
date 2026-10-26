/* global Deno */
// eslint-disable-next-line import/no-unresolved -- Resolved by the Edge runtime.
import { createClient } from 'npm:@supabase/supabase-js@2.117.2';
import { createSharedPlanHandler } from './handler.ts';
import catalog, { planFamilyByVariant } from '../_shared/plan-catalog.ts';
const url = Deno.env.get('SUPABASE_URL');
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const encryptionSecret = Deno.env.get('SHARING_ENCRYPTION_SECRET');
const client =
  url && serviceKey
    ? createClient(url, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;
const hex = (bytes) =>
  Array.from(new Uint8Array(bytes), (n) =>
    n.toString(16).padStart(2, '0'),
  ).join('');
const unhex = (text) =>
  Uint8Array.from(text.match(/../g) ?? [], (v) => parseInt(v, 16));
const digest = async (text) =>
  hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
async function cipherKey() {
  if (!encryptionSecret || encryptionSecret.length < 32)
    throw Error('Sharing not configured');
  return crypto.subtle.importKey(
    'raw',
    await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(encryptionSecret),
    ),
    'AES-GCM',
    false,
    ['encrypt', 'decrypt'],
  );
}
async function encrypt(text) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const bytes = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    await cipherKey(),
    new TextEncoder().encode(text),
  );
  return hex(iv) + ':' + hex(bytes);
}
async function decrypt(text) {
  const [iv, bytes] = text.split(':');
  return new TextDecoder().decode(
    await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: unhex(iv) },
      await cipherKey(),
      unhex(bytes),
    ),
  );
}
async function rpc(name, args = {}) {
  if (!client) throw Error('Not configured');
  const { data, error } = await client.rpc(name, args);
  if (error) throw Error('Sharing service unavailable');
  return data;
}
Deno.serve(async (request) => {
  const handler = createSharedPlanHandler({
    async getUser(token) {
      if (!client) throw Error('Not configured');
      const { data, error } = await client.auth.getUser(token);
      if (error) return null;
      return data.user
        ? { id: data.user.id, isAnonymous: data.user.is_anonymous === true }
        : null;
    },
    resolveExercise: (id) => (Object.hasOwn(catalog, id) ? catalog[id] : null),
    resolveFamily: (id) =>
      Object.hasOwn(planFamilyByVariant, id) ? planFamilyByVariant[id] : null,
    async capabilities() {
      try {
        return await rpc('get_equipment_group_capabilities');
      } catch {
        return {};
      }
    },
    // A conservative global ceiling prevents forwarded-IP spoofing bypasses.
    async limit() {
      return rpc('sharing_limit', {
        p_bucket: 'public-global',
        p_limit: 120,
        p_seconds: 60,
      });
    },
    async publish(owner, plan) {
      const token = hex(crypto.getRandomValues(new Uint8Array(32)));
      const result = await rpc('publish_shared_plan', {
        p_owner: owner,
        p_hash: await digest(JSON.stringify(plan)),
        p_payload: plan,
        p_token_hash: await digest(token),
        p_cipher: await encrypt(token),
      });
      return { origin: result.origin, token: await decrypt(result.cipher) };
    },
    async read(token) {
      return rpc('read_shared_plan', { p_hash: await digest(token) });
    },
    async revoke(owner, id) {
      await rpc('revoke_shared_plan', { p_owner: owner, p_id: id });
    },
    async readLibrary(id) {
      return rpc('read_library_plan', { p_id: id });
    },
    async owned(owner) {
      return rpc('list_owned_shared_plans', { p_owner: owner });
    },
    async library() {
      return rpc('list_shared_plan_library');
    },
  });
  return handler(request);
});
