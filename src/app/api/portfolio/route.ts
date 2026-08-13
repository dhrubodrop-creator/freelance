import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabase/server";
import { logEvent } from "@/lib/analytics";

const portfolioSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(4000).optional().nullable(),
  problem: z.string().max(2000).optional().nullable(),
  solution: z.string().max(2000).optional().nullable(),
  outcome: z.string().max(2000).optional().nullable(),
  course_id: z.string().uuid().optional().nullable(),
  tools_used: z.array(z.string().max(100)).max(30).optional().default([]),
  links: z.array(z.string().max(500)).max(10).optional().default([]),
  skill_ids: z.array(z.string().uuid()).max(20).optional().default([]),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = portfolioSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { data: user } = await supabase.from("users").select("id").eq("clerk_id", userId).maybeSingle();
  if (!user) return NextResponse.json({ error: "User record not found — try refreshing." }, { status: 404 });

  const { skill_ids, ...itemFields } = parsed.data;
  if (itemFields.course_id) {
    const { count } = await supabase
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("course_id", itemFields.course_id)
      .eq("status", "active");
    if (!count) return NextResponse.json({ error: "Choose a course you are actively enrolled in." }, { status: 403 });
  }
  const { data: item, error } = await supabase
    .from("portfolio_items")
    .insert({ ...itemFields, user_id: user.id })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (skill_ids.length > 0) {
    const { error: linkError } = await supabase
      .from("portfolio_item_skills")
      .insert(skill_ids.map((skill_id) => ({ portfolio_item_id: item.id, skill_id })));
    if (linkError) return NextResponse.json({ error: linkError.message }, { status: 500 });
  }

  await logEvent(user.id, "project_created", { portfolioItemId: item.id });

  return NextResponse.json({ ok: true, id: item.id }, { status: 201 });
}
