import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabase/server";
import { answerMentorQuestion, isRateLimited } from "@/lib/mentor";

const bodySchema = z.object({
  message: z.string().min(1).max(2000),
  courseId: z.string().uuid().nullable().optional(),
  mode: z
    .enum(["explain", "hint", "socratic", "debug", "review", "challenge", "interview", "career", "next_step"])
    .optional(),
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
    message: parsed.data.message,
    mode: parsed.data.mode,
    careerGoal: profile?.career_goal ?? null,
  });

  await supabase.from("mentor_messages").insert({
    user_id: user.id,
    course_id: courseId,
    role: "assistant",
    content: reply,
  });

  return NextResponse.json({ reply });
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
