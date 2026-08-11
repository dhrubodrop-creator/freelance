import { supabaseAdmin } from "@/lib/supabase/server";
import { CoursesTable } from "@/components/admin/courses-table";
import type { CourseRow } from "@/types/db";

export default async function AdminCoursesPage() {
  const { data } = await supabaseAdmin().from("courses").select("*").order("created_at", { ascending: false });
  const courses = (data ?? []) as CourseRow[];

  return <CoursesTable courses={courses} />;
}
