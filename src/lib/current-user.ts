import "server-only";
import { auth, currentUser as getClerkUser } from "@clerk/nextjs/server";

import { supabaseAdmin } from "@/lib/supabase/server";
import { ensureAppProfile, provisionAppUser } from "@/lib/user-provisioning";
import type { UserRow } from "@/types/db";

/**
 * Resolves the signed-in Clerk identity to the application user. A webhook is
 * retained for background synchronization, but authenticated requests recover
 * deterministically when webhook delivery is delayed or missed.
 */
export async function getCurrentUser(): Promise<UserRow | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const { data, error } = await supabaseAdmin()
    .from("users")
    .select("*")
    .eq("clerk_id", userId)
    .maybeSingle();
  if (error) {
    console.error("[auth]", { event: "USER_LOOKUP_FAILURE" });
    throw new Error("Application user lookup failed");
  }

  if (data) {
    await ensureAppProfile((data as UserRow).id, "authenticated_request");
    return data as UserRow;
  }

  const clerkUser = await getClerkUser();
  if (!clerkUser || clerkUser.id !== userId) return null;

  const primaryEmail = clerkUser.emailAddresses.find(
    (email) => email.id === clerkUser.primaryEmailAddressId
  )?.emailAddress;
  const primaryPhone = clerkUser.phoneNumbers.find(
    (phone) => phone.id === clerkUser.primaryPhoneNumberId
  )?.phoneNumber;
  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;

  return provisionAppUser(
    {
      clerkId: clerkUser.id,
      name,
      email: primaryEmail ?? null,
      phone: primaryPhone ?? null,
    },
    "authenticated_request"
  );
}

export async function requireCurrentUser(): Promise<UserRow> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  return user;
}

export async function requireAdminUser(): Promise<UserRow> {
  const user = await requireCurrentUser();
  if (user.role !== "admin") throw new Error("Forbidden");
  return user;
}
