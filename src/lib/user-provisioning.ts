import "server-only";

import { supabaseAdmin } from "@/lib/supabase/server";
import type { UserRow } from "@/types/db";

export type AppUserIdentity = {
  clerkId: string;
  name: string | null;
  email: string | null;
  phone: string | null;
};

type ProvisionSource = "authenticated_request" | "clerk_webhook";

function logProvisioning(
  event: "USER_PROVISION_STARTED" | "USER_PROVISION_SUCCESS" | "USER_PROVISION_FAILURE" | "PROFILE_PROVISIONED",
  source: ProvisionSource,
  detail?: string
) {
  const payload = { event, source, ...(detail ? { detail } : {}) };
  if (event === "USER_PROVISION_FAILURE") console.error("[auth]", payload);
  else console.info("[auth]", payload);
}

/**
 * Creates or refreshes the application identity keyed only by Clerk's stable
 * user id. The unique clerk_id constraint and upsert make concurrent webhook
 * and request-time provisioning deterministic and duplicate-safe.
 */
export async function provisionAppUser(
  identity: AppUserIdentity,
  source: ProvisionSource
): Promise<UserRow> {
  logProvisioning("USER_PROVISION_STARTED", source);
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("users")
    .upsert(
      {
        clerk_id: identity.clerkId,
        name: identity.name,
        email: identity.email,
        phone: identity.phone,
      },
      { onConflict: "clerk_id" }
    )
    .select("*")
    .single();

  if (error || !data) {
    logProvisioning("USER_PROVISION_FAILURE", source, "application_user_upsert_failed");
    throw new Error("Application user provisioning failed");
  }

  await ensureAppProfile((data as UserRow).id, source);
  logProvisioning("USER_PROVISION_SUCCESS", source);
  return data as UserRow;
}

/** Creates the empty application-profile shell without overwriting onboarding data. */
export async function ensureAppProfile(userId: string, source: ProvisionSource): Promise<void> {
  const supabase = supabaseAdmin();
  const { data, error: lookupError } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (lookupError) {
    logProvisioning("USER_PROVISION_FAILURE", source, "profile_lookup_failed");
    throw new Error("Application profile lookup failed");
  }
  if (data) return;

  const { error } = await supabase
    .from("profiles")
    .upsert({ user_id: userId }, { onConflict: "user_id", ignoreDuplicates: true });
  if (error) {
    logProvisioning("USER_PROVISION_FAILURE", source, "profile_upsert_failed");
    throw new Error("Application profile provisioning failed");
  }
  logProvisioning("PROFILE_PROVISIONED", source);
}
