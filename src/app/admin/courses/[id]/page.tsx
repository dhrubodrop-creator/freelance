import { notFound } from "next/navigation";

import { supabaseAdmin } from "@/lib/supabase/server";
import { ModulesTable } from "@/components/admin/modules-table";
import type { CourseRow, ModuleRow } from "@/types/db";

export default async function AdminCourseModulesPage({ params }: { params: { id: string } }) {
  const supabase = supabaseAdmin();

  const [{ data: course }, { data: modules }] = await Promise.all([
    supabase.from("courses").select("*").eq("id", params.id).maybeSingle(),
    supabase.from("modules").select("*").eq("course_id", params.id).order("order_index", { ascending: true }),
  ]);

  if (!course) notFound();

  const courseRow = course as CourseRow;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-muted-foreground">Course</p>
        <h2 className="font-heading text-h3 font-semibold">{courseRow.title}</h2>
      </div>
      <ModulesTable courseId={params.id} modules={(modules ?? []) as ModuleRow[]} />
    </div>
  );
}
