import "server-only";

import { supabaseAdmin } from "@/lib/supabase/server";

/** Fire-and-forget in-app notification creation. Separate from the existing
 * Resend email triggers — this is what the notification bell reads from. */
export async function createNotification(
  userId: string,
  type: string,
  title: string,
  body?: string,
  link?: string
): Promise<void> {
  try {
    await supabaseAdmin().from("notifications").insert({ user_id: userId, type, title, body: body ?? null, link: link ?? null });
  } catch {
    // best-effort only
  }
}
