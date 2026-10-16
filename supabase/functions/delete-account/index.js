/* global Deno */
// Deno npm specifier pins the same SDK version already used by the app.
// eslint-disable-next-line import/no-unresolved -- Resolved by the Edge runtime.
import { createClient } from 'npm:@supabase/supabase-js@2.117.2';
import { createDeleteAccountHandler } from './handler.ts';

const url = Deno.env.get('SUPABASE_URL');
const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const client =
  url && key
    ? createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;
const handler = createDeleteAccountHandler({
  async getUser(token) {
    if (!client) throw new Error('Server not configured');
    const { data, error } = await client.auth.getUser(token);
    if (error) {
      if (error.status === 401 || error.status === 403) return null;
      throw new Error('Authentication unavailable');
    }
    return data.user
      ? { id: data.user.id, isAnonymous: data.user.is_anonymous === true }
      : null;
  },
  async deleteUser(id) {
    if (!client) throw new Error('Server not configured');
    const { error } = await client.auth.admin.deleteUser(id, false);
    if (error) throw new Error('Deletion not confirmed');
  },
});
Deno.serve(handler);
