import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { supabaseAdmin } from "@/lib/supabase/server";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = supabaseAdmin();
  const { data: user } = await supabase.from("users").select("id").eq("clerk_id", userId).maybeSingle();
  if (!user) return NextResponse.json({ error: "User record not found — try refreshing." }, { status: 404 });

  const { data: decision } = await supabase
    .from("project_decisions")
    .select("id, portfolio_items!inner(user_id)")
    .eq("id", id)
    .maybeSingle();
  const ownerId = (decision as unknown as { portfolio_items: { user_id: string } | null } | null)?.portfolio_items
    ?.user_id;
  if (!decision || ownerId !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { error } = await supabase.from("project_decisions").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
