import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabase/server";

const bodySchema = z.object({ note: z.string().min(1).max(3000) });

/** Sets the Architecture Guardian's learner-owned baseline for a project that didn't come from an approved idea plan. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const supabase = supabaseAdmin();
  const { data: user } = await supabase.from("users").select("id").eq("clerk_id", userId).maybeSingle();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { error } = await supabase
    .from("portfolio_items")
    .update({ architecture_note: parsed.data.note })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return NextResponse.json({ error: "Couldn't save" }, { status: 400 });
  return NextResponse.json({ success: true });
}
