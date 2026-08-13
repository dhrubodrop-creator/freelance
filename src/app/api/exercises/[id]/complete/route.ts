import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { supabaseAdmin } from "@/lib/supabase/server";
import { logEvent } from "@/lib/analytics";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: exerciseId } = await params;
  const supabase = supabaseAdmin();
  const { data: user } = await supabase.from("users").select("id").eq("clerk_id", userId).maybeSingle();
  if (!user) return NextResponse.json({ error: "User record not found — try refreshing." }, { status: 404 });

  const { data: exercise } = await supabase
    .from("exercises")
    .select("id, module_id, modules(course_id)")
    .eq("id", exerciseId)
    .maybeSingle();
  if (!exercise) return NextResponse.json({ error: "Exercise not found" }, { status: 404 });

  const courseId = (exercise as unknown as { modules: { course_id: string } | null }).modules?.course_id;
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .eq("status", "active")
    .maybeSingle();
  if (!enrollment) return NextResponse.json({ error: "Not enrolled in this course" }, { status: 403 });

  const { error } = await supabase
    .from("exercise_completions")
    .upsert({ user_id: user.id, exercise_id: exerciseId }, { onConflict: "user_id,exercise_id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logEvent(user.id, "exercise_completed", { exerciseId, courseId });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: exerciseId } = await params;
  const supabase = supabaseAdmin();
  const { data: user } = await supabase.from("users").select("id").eq("clerk_id", userId).maybeSingle();
  if (!user) return NextResponse.json({ error: "User record not found — try refreshing." }, { status: 404 });

  const { error } = await supabase
    .from("exercise_completions")
    .delete()
    .eq("user_id", user.id)
    .eq("exercise_id", exerciseId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
