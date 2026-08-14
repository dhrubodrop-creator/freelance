import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabase/server";
import { evaluateAiCodeDefense } from "@/lib/code-review";

const bodySchema = z.object({
  diff: z.string().min(1).max(20_000),
  portfolioItemId: z.string().uuid().nullable().optional(),
  questions: z.array(z.string()).min(1).max(10),
  answers: z.array(z.string()).min(1).max(10),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const supabase = supabaseAdmin();
  const { data: user } = await supabase.from("users").select("id").eq("clerk_id", userId).maybeSingle();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const result = await evaluateAiCodeDefense({ userId: user.id, ...parsed.data });
  if (!result) return NextResponse.json({ error: "Couldn't evaluate — try again." }, { status: 500 });
  return NextResponse.json({ result });
}
