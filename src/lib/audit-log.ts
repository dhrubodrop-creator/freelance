import "server-only";

import { supabaseAdmin } from "@/lib/supabase/server";

/** Fire-and-forget admin action logging. Never logs passwords, payment
 * secrets, or full request bodies — only identifiers and small metadata. */
export async function logAdminAction(
  actorUserId: string,
  action: string,
  targetType: string,
  targetId: string | null,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  try {
    await supabaseAdmin()
      .from("admin_audit_logs")
      .insert({ actor_user_id: actorUserId, action, target_type: targetType, target_id: targetId, metadata });
  } catch {
    // best-effort only
  }
}
