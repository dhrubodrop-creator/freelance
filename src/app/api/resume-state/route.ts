import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabase/server";
import { getResumeState, saveResumeState } from "@/lib/resume-state";

const bodySchema = z.object({
  courseId: z.string().uuid(),
  moduleId: z.string().uuid().nullable().optional(),
  activeTab: z.enum(["overview", "playbook", "practice", "interview"]).nullable().optional(),
  exerciseId: z.string().uuid().nullable().optional(),
  videoPositionSeconds: z.coerce.number().int().min(0).nullable().optional(),
});

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const courseId = new URL(req.url).searchParams.get("courseId");
  if (!courseId) return NextResponse.json({ error: "courseId is required" }, { status: 400 });

  const supabase = supabaseAdmin();
  const { data: user } = await supabase.from("users").select("id").eq("clerk_id", userId).maybeSingle();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const checkpoint = await getResumeState(user.id, courseId);
  return NextResponse.json({ checkpoint });
}

/** Saved from the module page (debounced, on tab/video-position change) so "Continue Learning" can return the learner to the exact spot they stopped. */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid resume state" }, { status: 400 });

  const supabase = supabaseAdmin();
  const { data: user } = await supabase.from("users").select("id").eq("clerk_id", userId).maybeSingle();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const ok = await saveResumeState({ userId: user.id, ...parsed.data });
  if (!ok) return NextResponse.json({ error: "Could not save resume state" }, { status: 400 });
  return NextResponse.json({ success: true });
}
