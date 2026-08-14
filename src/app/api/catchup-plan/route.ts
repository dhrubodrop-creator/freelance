import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { supabaseAdmin } from "@/lib/supabase/server";
import { computeCatchupPlan } from "@/lib/catchup-plan";

/** Computes (or returns null if the learner isn't actually inactive) a realistic recovery plan for the given course. */
export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const courseId = new URL(req.url).searchParams.get("courseId");
  if (!courseId) return NextResponse.json({ error: "courseId is required" }, { status: 400 });

  const supabase = supabaseAdmin();
  const { data: user } = await supabase.from("users").select("id").eq("clerk_id", userId).maybeSingle();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const plan = await computeCatchupPlan(user.id, courseId);
  return NextResponse.json({ plan });
}
