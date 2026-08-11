import "server-only";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

/**
 * Service-role client for server-side use only (API routes, webhooks,
 * admin actions). Bypasses RLS — never import this into client components.
 *
 * Untyped by design: our hand-written `Database` type (src/types/db.ts) is
 * used to annotate query results at each call site instead of as a
 * createClient<Database> generic, since supabase-js's generic table
 * constraints need a `Relationships` field we don't hand-maintain. Cast
 * `.select(...)` results to the relevant Row type (see src/types/db.ts).
 */
export function supabaseAdmin() {
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
