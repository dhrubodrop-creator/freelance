import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabase/server";

const updateSchema = z.object({
  selfLevel: z.enum(["beginner", "intermediate", "advanced", "expert"]),
});

async function resolveOwnUserId(clerkId: string) {
  const { data } = await supabaseAdmin().from("users").select("id").eq("clerk_id", clerkId).maybeSingle();
  return data?.id ?? null;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ skillId: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { skillId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const ownUserId = await resolveOwnUserId(userId);
  if (!ownUserId) return NextResponse.json({ error: "User record not found — try refreshing." }, { status: 404 });

  const { error, count } = await supabaseAdmin()
    .from("user_skills")
    .update({ self_level: parsed.data.selfLevel }, { count: "exact" })
    .eq("skill_id", skillId)
    .eq("user_id", ownUserId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ skillId: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { skillId } = await params;
  const ownUserId = await resolveOwnUserId(userId);
  if (!ownUserId) return NextResponse.json({ error: "User record not found — try refreshing." }, { status: 404 });

  const { error, count } = await supabaseAdmin()
    .from("user_skills")
    .delete({ count: "exact" })
    .eq("skill_id", skillId)
    .eq("user_id", ownUserId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
