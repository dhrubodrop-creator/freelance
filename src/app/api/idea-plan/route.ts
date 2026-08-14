import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabase/server";
import { generateIdeaPlan } from "@/lib/build-from-idea";

const bodySchema = z.object({
  courseId: z.string().uuid().nullable().optional(),
  idea: z.string().min(1).max(500),
  targetUser: z.string().min(1).max(300),
  problem: z.string().min(1).max(1000),
  desiredOutcome: z.string().min(1).max(1000),
  optionalFeatures: z.array(z.string().max(200)).max(15).optional(),
});

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = supabaseAdmin();
  const { data: user } = await supabase.from("users").select("id").eq("clerk_id", userId).maybeSingle();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { data: plans } = await supabase
    .from("project_idea_plans")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  return NextResponse.json({ plans: plans ?? [] });
}

/** "Build From My Idea" — generates a PRD/stories/architecture/workspace-template draft. Never auto-applied; the learner must approve it. */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { data: user } = await supabase.from("users").select("id").eq("clerk_id", userId).maybeSingle();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const plan = await generateIdeaPlan({ userId: user.id, ...parsed.data });
  if (!plan) return NextResponse.json({ error: "Couldn't generate a plan. Try again." }, { status: 500 });
  return NextResponse.json({ plan }, { status: 201 });
}
