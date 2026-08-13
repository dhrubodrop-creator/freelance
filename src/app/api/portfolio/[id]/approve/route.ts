import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabase/server";

const bodySchema = z.object({ approved: z.boolean() });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: portfolioItemId } = await params;
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const supabase = supabaseAdmin();
  const { data: user } = await supabase.from("users").select("id").eq("clerk_id", userId).maybeSingle();
  if (!user) return NextResponse.json({ error: "User record not found — try refreshing." }, { status: 404 });

  const { count: owned } = await supabase
    .from("portfolio_items")
    .select("id", { count: "exact", head: true })
    .eq("id", portfolioItemId)
    .eq("user_id", user.id);
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { error, count } = await supabase
    .from("portfolio_case_studies")
    .update({ approved: parsed.data.approved }, { count: "exact" })
    .eq("portfolio_item_id", portfolioItemId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (count === 0) return NextResponse.json({ error: "Nothing generated yet" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
