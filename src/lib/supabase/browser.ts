"use client";

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

/**
 * Browser client scoped to the signed-in user via Clerk's Supabase JWT
 * template (Clerk configured as a Supabase third-party auth provider — see
 * README). RLS policies enforce row ownership; this client never sees the
 * service-role key. Untyped for the same reason as supabaseAdmin() — see
 * src/lib/supabase/server.ts.
 */
export function supabaseBrowser(getClerkToken: () => Promise<string | null>) {
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    accessToken: async () => (await getClerkToken()) ?? null,
  });
}
