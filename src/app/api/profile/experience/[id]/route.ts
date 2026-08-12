import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabase/server";

const experienceUpdateSchema = z.object({
  company: z.string().min(1).max(200).optional(),
  role: z.string().min(1).max(200).optional(),
  start_date: z.string().max(10).optional().nullable(),
  end_date: z.string().max(10).optional().nullable(),
  description: z.string().max(4000).optional().nullable(),
  achievements: z.array(z.string().max(500)).max(20).optional(),
  skills_used: z.array(z.string().max(100)).max(30).optional(),
});

async function resolveOwnUserId(clerkId: string) {
  const supabase = supabaseAdmin();
  const { data } = await supabase.from("users").select("id").eq("clerk_id", clerkId).maybeSingle();
  return data?.id ?? null;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = experienceUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const ownUserId = await resolveOwnUserId(userId);
  if (!ownUserId) return NextResponse.json({ error: "User record not found — try refreshing." }, { status: 404 });

  // Scoped to the requester's own user_id — the service-role client bypasses RLS,
  // so this ownership check is the only thing preventing editing someone else's record.
  const { error, count } = await supabaseAdmin()
    .from("work_experiences")
    .update(parsed.data, { count: "exact" })
    .eq("id", id)
    .eq("user_id", ownUserId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const ownUserId = await resolveOwnUserId(userId);
  if (!ownUserId) return NextResponse.json({ error: "User record not found — try refreshing." }, { status: 404 });

  const { error, count } = await supabaseAdmin()
    .from("work_experiences")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("user_id", ownUserId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
