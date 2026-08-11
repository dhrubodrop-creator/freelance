import "server-only";
import { auth } from "@clerk/nextjs/server";

import { supabaseAdmin } from "@/lib/supabase/server";
import type { UserRow } from "@/types/db";

/** Resolves the signed-in Clerk user's row in public.users, or null if signed out / not yet synced. */
export async function getCurrentUser(): Promise<UserRow | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const { data } = await supabaseAdmin().from("users").select("*").eq("clerk_id", userId).maybeSingle();
  return data;
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
