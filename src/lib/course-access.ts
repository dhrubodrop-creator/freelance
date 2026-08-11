import "server-only";

import { supabaseAdmin } from "@/lib/supabase/server";
import type { CourseRow, ModuleRow, ProgressRow } from "@/types/db";

export async function getActiveEnrollment(userId: string, courseId: string) {
  const supabase = supabaseAdmin();
  const { data } = await supabase
    .from("enrollments")
    .select("id, status")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .eq("status", "active")
    .maybeSingle();
  return Boolean(data);
}

export async function getCourseBySlug(slug: string): Promise<CourseRow | null> {
  const supabase = supabaseAdmin();
  const { data } = await supabase.from("courses").select("*").eq("slug", slug).maybeSingle();
  return data as CourseRow | null;
}

export async function getCourseModules(courseId: string): Promise<ModuleRow[]> {
  const supabase = supabaseAdmin();
  const { data } = await supabase
    .from("modules")
    .select("*")
    .eq("course_id", courseId)
    .order("order_index", { ascending: true });
  return (data ?? []) as ModuleRow[];
}

export async function getUserProgress(userId: string, moduleIds: string[]): Promise<Map<string, ProgressRow>> {
  if (moduleIds.length === 0) return new Map();
  const supabase = supabaseAdmin();
  const { data } = await supabase.from("progress").select("*").eq("user_id", userId).in("module_id", moduleIds);
  const map = new Map<string, ProgressRow>();
  for (const row of (data ?? []) as ProgressRow[]) map.set(row.module_id, row);
  return map;
}

/** A module is unlocked if it's first in the course, or the previous module is complete. */
export function isModuleUnlocked(
  modules: ModuleRow[],
  index: number,
  progress: Map<string, ProgressRow>
): boolean {
  if (index === 0) return true;
  const previous = modules[index - 1];
  return Boolean(progress.get(previous.id)?.completed_at);
}
