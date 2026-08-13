import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabase/server";

const decisionSchema = z.object({
  decision: z.string().min(1).max(300),
  alternatives: z.string().max(500).optional().nullable(),
  reasoning: z.string().min(1).max(1000),
  tradeoff: z.string().max(500).optional().nullable(),
});

async function resolveOwnUserId(clerkId: string) {
  const { data } = await supabaseAdmin().from("users").select("id").eq("clerk_id", clerkId).maybeSingle();
  return data?.id ?? null;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: portfolioItemId } = await params;
  const parsed = decisionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const ownUserId = await resolveOwnUserId(userId);
  if (!ownUserId) return NextResponse.json({ error: "User record not found — try refreshing." }, { status: 404 });

  const supabase = supabaseAdmin();
  const { count: itemOwned } = await supabase
    .from("portfolio_items")
    .select("id", { count: "exact", head: true })
    .eq("id", portfolioItemId)
    .eq("user_id", ownUserId);
  if (!itemOwned) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const { count: existingCount } = await supabase
    .from("project_decisions")
    .select("id", { count: "exact", head: true })
    .eq("portfolio_item_id", portfolioItemId);

  const { data, error } = await supabase
    .from("project_decisions")
    .insert({ portfolio_item_id: portfolioItemId, order_index: existingCount ?? 0, ...parsed.data })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ decision: data }, { status: 201 });
}
