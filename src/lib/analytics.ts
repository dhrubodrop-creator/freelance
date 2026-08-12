import "server-only";

import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * Fire-and-forget event logging — never throws, never blocks or fails the
 * calling request. An analytics write failing must not break a real user
 * action (enrollment, progress, etc).
 */
export async function logEvent(
  userId: string | null,
  eventName: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  try {
    await supabaseAdmin().from("analytics_events").insert({ user_id: userId, event_name: eventName, metadata });
  } catch {
    // best-effort only
  }
}
