import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabase/server";

const educationUpdateSchema = z.object({
  institution: z.string().min(1).max(200).optional(),
  degree: z.string().max(200).optional().nullable(),
  field: z.string().max(200).optional().nullable(),
  start_date: z.string().max(10).optional().nullable(),
  end_date: z.string().max(10).optional().nullable(),
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
  const parsed = educationUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const ownUserId = await resolveOwnUserId(userId);
  if (!ownUserId) return NextResponse.json({ error: "User record not found — try refreshing." }, { status: 404 });

  const { error, count } = await supabaseAdmin()
    .from("education")
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
    .from("education")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("user_id", ownUserId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
