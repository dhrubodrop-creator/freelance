import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabase/server";

const updateSchema = z.object({ done: z.boolean() });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { data: user } = await supabase.from("users").select("id").eq("clerk_id", userId).maybeSingle();
  if (!user) return NextResponse.json({ error: "User record not found — try refreshing." }, { status: 404 });

  // No user_id on monetisation_actions directly — verify ownership through the parent plan.
  const { data: action } = await supabase
    .from("monetisation_actions")
    .select("id, plan_id, monetisation_plans!inner(user_id)")
    .eq("id", id)
    .maybeSingle();

  const ownerId = (action as unknown as { monetisation_plans: { user_id: string } } | null)?.monetisation_plans
    ?.user_id;
  if (!action || ownerId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { error } = await supabase.from("monetisation_actions").update({ done: parsed.data.done }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
