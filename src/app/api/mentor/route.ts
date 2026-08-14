import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabase/server";
import { answerMentorQuestion, isRateLimited } from "@/lib/mentor";

const bodySchema = z.object({
  message: z.string().min(1).max(2000),
  courseId: z.string().uuid().nullable().optional(),
  moduleId: z.string().uuid().nullable().optional(),
  mode: z
    .enum(["explain", "hint", "socratic", "debug", "review", "challenge", "interview", "career", "next_step"])
    .optional(),
  level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).optional(),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const supabase = supabaseAdmin();
  const { data: user } = await supabase.from("users").select("id").eq("clerk_id", userId).maybeSingle();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (await isRateLimited(user.id)) {
    return NextResponse.json(
      { error: "You're sending messages faster than I can answer — give it a minute." },
      { status: 429 }
    );
  }

  const courseId = parsed.data.courseId ?? null;
  const moduleId = parsed.data.moduleId ?? null;

  if (moduleId && !courseId) {
    return NextResponse.json({ error: "A module must be requested within its course." }, { status: 400 });
  }
  if (courseId) {
    const { count: enrollmentCount } = await supabase
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .eq("status", "active");
    if (!enrollmentCount) return NextResponse.json({ error: "Active enrollment required." }, { status: 403 });

    if (moduleId) {
      const { count: moduleCount } = await supabase
        .from("modules")
        .select("id", { count: "exact", head: true })
        .eq("id", moduleId)
        .eq("course_id", courseId);
      if (!moduleCount) return NextResponse.json({ error: "Module does not belong to this course." }, { status: 400 });
    }
  }

  await supabase.from("mentor_messages").insert({
    user_id: user.id,
    course_id: courseId,
    role: "user",
    content: parsed.data.message,
  });

  const { data: profile } = await supabase.from("profiles").select("career_goal").eq("user_id", user.id).maybeSingle();

  const reply = await answerMentorQuestion({
    userId: user.id,
    courseId,
    moduleId,
    message: parsed.data.message,
    mode: parsed.data.mode,
    level: parsed.data.level,
    careerGoal: profile?.career_goal ?? null,
  });

  // Graceful degradation — a "temporarily busy" notice is never persisted as a real
  // chat message; the learner's own message above is already saved either way, so
  // nothing is lost, and retrying doesn't leave duplicate system notices in history.
  if (reply.ok) {
    await supabase.from("mentor_messages").insert({
      user_id: user.id,
      course_id: courseId,
      role: "assistant",
      content: reply.content,
    });
  }

  return NextResponse.json({ reply: reply.content, degraded: !reply.ok });
}

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = supabaseAdmin();
  const { data: user } = await supabase.from("users").select("id").eq("clerk_id", userId).maybeSingle();
  if (!user) return NextResponse.json({ messages: [] });

  const url = new URL(req.url);
  const courseId = url.searchParams.get("courseId");

  let query = supabase.from("mentor_messages").select("*").eq("user_id", user.id).order("created_at", { ascending: true }).limit(50);
  if (courseId) query = query.eq("course_id", courseId);

  const { data } = await query;
  return NextResponse.json({ messages: data ?? [] });
}
