import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/current-user";
import { supabaseAdmin } from "@/lib/supabase/server";
import { computeDiagnosticResult } from "@/lib/diagnostic";
import { logEvent } from "@/lib/analytics";
import type { CourseDiagnosticRow, DiagnosticSkillRating, ModuleRow, SkillRow } from "@/types/db";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const courseId = request.nextUrl.searchParams.get("courseId");
  if (!courseId) return NextResponse.json({ error: "courseId is required" }, { status: 400 });

  const { data } = await supabaseAdmin()
    .from("course_diagnostics")
    .select("*")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .maybeSingle();

  return NextResponse.json({ diagnostic: (data as CourseDiagnosticRow | null) ?? null });
}

const bodySchema = z.object({
  courseId: z.string().uuid(),
  experienceLevel: z.enum(["new", "some_exposure", "practiced", "professional"]),
  confidenceRating: z.coerce.number().int().min(1).max(5),
  skillRatings: z.record(z.string().uuid(), z.enum(["unfamiliar", "aware", "practiced", "confident"])),
});

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid diagnostic submission" }, { status: 400 });
  }
  const { courseId, experienceLevel, confidenceRating, skillRatings } = parsed.data;

  const supabase = supabaseAdmin();

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .eq("status", "active")
    .maybeSingle();
  if (!enrollment) return NextResponse.json({ error: "Not enrolled in this course" }, { status: 403 });

  const { data: modulesData } = await supabase
    .from("modules")
    .select("*")
    .eq("course_id", courseId)
    .order("order_index", { ascending: true });
  const modules = (modulesData ?? []) as ModuleRow[];
  if (modules.length === 0) return NextResponse.json({ error: "Course has no modules" }, { status: 404 });

  const { data: moduleSkillRows } = await supabase
    .from("module_skills")
    .select("module_id, skill_id")
    .in("module_id", modules.map((m) => m.id));
  const skillIdsByModule = new Map<string, string[]>();
  for (const row of moduleSkillRows ?? []) {
    const list = skillIdsByModule.get(row.module_id) ?? [];
    list.push(row.skill_id);
    skillIdsByModule.set(row.module_id, list);
  }

  const allSkillIds = Array.from(new Set((moduleSkillRows ?? []).map((r) => r.skill_id)));
  const { data: skillRows } = await supabase.from("skills").select("id, name").in("id", allSkillIds);
  const skillNamesById: Record<string, string> = {};
  for (const s of (skillRows ?? []) as Pick<SkillRow, "id" | "name">[]) skillNamesById[s.id] = s.name;

  // Only accept ratings for skills this course actually teaches — ignore anything else.
  const cleanedRatings: Record<string, DiagnosticSkillRating> = {};
  for (const skillId of allSkillIds) {
    if (skillRatings[skillId]) cleanedRatings[skillId] = skillRatings[skillId];
  }

  const result = computeDiagnosticResult({
    experienceLevel,
    confidenceRating,
    skillRatings: cleanedRatings,
    modules: modules.map((m) => ({
      id: m.id,
      title: m.title,
      orderIndex: m.order_index,
      skillIds: skillIdsByModule.get(m.id) ?? [],
    })),
    skillNamesById,
  });

  const { data: row, error } = await supabase
    .from("course_diagnostics")
    .upsert(
      {
        user_id: user.id,
        course_id: courseId,
        experience_level: experienceLevel,
        confidence_rating: confidenceRating,
        skill_ratings: cleanedRatings,
        module_guidance: result.moduleGuidance,
        starting_point: result.startingPoint,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,course_id" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logEvent(user.id, "diagnostic_completed", { courseId });

  return NextResponse.json({ diagnostic: row as CourseDiagnosticRow });
}
