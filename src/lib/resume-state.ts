import "server-only";

import { supabaseAdmin } from "@/lib/supabase/server";
import type { LearnerCheckpointRow } from "@/types/db";

/**
 * Exact resume state per (learner, course) — module, tab, exercise, video
 * position. Separate from `progress` (completion only) so "Continue
 * Learning" can return the learner to where they actually stopped, not just
 * the course root. No AI/mentor conversation content is stored here, per
 * the brief's "don't store sensitive AI/system data unnecessarily" rule.
 */
export async function saveResumeState(input: {
  userId: string;
  courseId: string;
  moduleId?: string | null;
  activeTab?: "overview" | "playbook" | "practice" | "interview" | null;
  exerciseId?: string | null;
  videoPositionSeconds?: number | null;
}): Promise<boolean> {
  const supabase = supabaseAdmin();
  const { error } = await supabase.from("learner_checkpoints").upsert(
    {
      user_id: input.userId,
      course_id: input.courseId,
      module_id: input.moduleId ?? null,
      active_tab: input.activeTab ?? null,
      exercise_id: input.exerciseId ?? null,
      video_position_seconds: input.videoPositionSeconds ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,course_id" }
  );
  return !error;
}

export async function getResumeState(userId: string, courseId: string): Promise<LearnerCheckpointRow | null> {
  const supabase = supabaseAdmin();
  const { data } = await supabase
    .from("learner_checkpoints")
    .select("*")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .maybeSingle();
  return (data as LearnerCheckpointRow | null) ?? null;
}

export async function getAllResumeStates(userId: string): Promise<Map<string, LearnerCheckpointRow>> {
  const supabase = supabaseAdmin();
  const { data } = await supabase.from("learner_checkpoints").select("*").eq("user_id", userId);
  const map = new Map<string, LearnerCheckpointRow>();
  for (const row of (data ?? []) as LearnerCheckpointRow[]) map.set(row.course_id, row);
  return map;
}
