import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabase/server";

const portfolioUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(4000).optional().nullable(),
  problem: z.string().max(2000).optional().nullable(),
  solution: z.string().max(2000).optional().nullable(),
  outcome: z.string().max(2000).optional().nullable(),
  course_id: z.string().uuid().optional().nullable(),
  tools_used: z.array(z.string().max(100)).max(30).optional(),
  links: z.array(z.string().max(500)).max(10).optional(),
  skill_ids: z.array(z.string().uuid()).max(20).optional(),
});

async function resolveOwnUserId(clerkId: string) {
  const { data } = await supabaseAdmin().from("users").select("id").eq("clerk_id", clerkId).maybeSingle();
  return data?.id ?? null;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = portfolioUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const ownUserId = await resolveOwnUserId(userId);
  if (!ownUserId) return NextResponse.json({ error: "User record not found — try refreshing." }, { status: 404 });

  const { skill_ids, ...itemFields } = parsed.data;
  const supabase = supabaseAdmin();

  if (Object.keys(itemFields).length > 0) {
    const { error, count } = await supabase
      .from("portfolio_items")
      .update(itemFields, { count: "exact" })
      .eq("id", id)
      .eq("user_id", ownUserId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  } else {
    const { count } = await supabase
      .from("portfolio_items")
      .select("id", { count: "exact", head: true })
      .eq("id", id)
      .eq("user_id", ownUserId);
    if (!count) return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (skill_ids !== undefined) {
    await supabase.from("portfolio_item_skills").delete().eq("portfolio_item_id", id);
    if (skill_ids.length > 0) {
      const { error: linkError } = await supabase
        .from("portfolio_item_skills")
        .insert(skill_ids.map((skill_id) => ({ portfolio_item_id: id, skill_id })));
      if (linkError) return NextResponse.json({ error: linkError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const ownUserId = await resolveOwnUserId(userId);
  if (!ownUserId) return NextResponse.json({ error: "User record not found — try refreshing." }, { status: 404 });

  const { error, count } = await supabaseAdmin()
    .from("portfolio_items")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("user_id", ownUserId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
