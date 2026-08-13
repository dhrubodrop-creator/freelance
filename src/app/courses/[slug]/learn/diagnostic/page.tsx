import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/current-user";
import { getActiveEnrollment, getCourseBySlug, getCourseModules } from "@/lib/course-access";
import { supabaseAdmin } from "@/lib/supabase/server";
import { DiagnosticForm } from "@/components/course/diagnostic-form";
import type { SkillRow } from "@/types/db";

export default async function DiagnosticPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  const enrolled = await getActiveEnrollment(user.id, course.id);
  if (!enrolled) redirect(`/checkout/${slug}`);

  const modules = await getCourseModules(course.id);
  if (modules.length === 0) redirect("/dashboard");

  const supabase = supabaseAdmin();
  const { data: moduleSkillRows } = await supabase
    .from("module_skills")
    .select("skill_id")
    .in("module_id", modules.map((m) => m.id));
  const skillIds = Array.from(new Set((moduleSkillRows ?? []).map((r) => r.skill_id)));

  let skills: Pick<SkillRow, "id" | "name">[] = [];
  if (skillIds.length > 0) {
    const { data } = await supabase.from("skills").select("id, name").in("id", skillIds).order("name");
    skills = (data ?? []) as Pick<SkillRow, "id" | "name">[];
  }

  return (
    <DiagnosticForm courseSlug={slug} courseId={course.id} courseTitle={course.title} skills={skills} />
  );
}
