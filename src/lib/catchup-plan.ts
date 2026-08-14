import "server-only";

import { supabaseAdmin } from "@/lib/supabase/server";
import type { CatchupPlanRow, ModuleRow } from "@/types/db";

/**
 * Automatic Catch-Up Plan for an inactive learner. Deterministic math only —
 * no AI call — per the brief's own "never create an unrealistic schedule"
 * instruction: an LLM has no way to know a learner's real capacity, but
 * their own historical pace (modules completed / weeks enrolled) does.
 * Historical pace is clamped to [0.5, 2] modules/week so one unusually fast
 * or unusually slow past week can't produce an absurd projection either
 * direction.
 */

const INACTIVITY_THRESHOLD_DAYS = 7;
const MIN_PACE_MODULES_PER_WEEK = 0.5;
const MAX_PACE_MODULES_PER_WEEK = 2;
const AVG_MODULE_MINUTES = 45;
const MS_PER_DAY = 86_400_000;

function daysBetween(from: Date, to: Date): number {
  return Math.max(0, Math.round((to.getTime() - from.getTime()) / MS_PER_DAY));
}

/** Returns null when the learner isn't actually inactive — no plan to generate. */
export async function computeCatchupPlan(userId: string, courseId: string): Promise<CatchupPlanRow | null> {
  const supabase = supabaseAdmin();

  const [{ data: enrollment }, { data: modulesData }] = await Promise.all([
    supabase.from("enrollments").select("created_at").eq("user_id", userId).eq("course_id", courseId).maybeSingle(),
    supabase.from("modules").select("*").eq("course_id", courseId).order("order_index", { ascending: true }),
  ]);
  if (!enrollment) return null;
  const modules = (modulesData ?? []) as ModuleRow[];
  if (modules.length === 0) return null;

  const [{ data: progressRows }, { data: checkpointRow }] = await Promise.all([
    supabase.from("progress").select("module_id, completed_at").eq("user_id", userId).in(
      "module_id",
      modules.map((m) => m.id)
    ),
    supabase.from("learner_checkpoints").select("updated_at").eq("user_id", userId).eq("course_id", courseId).maybeSingle(),
  ]);

  const completions = (progressRows ?? []).filter((p) => p.completed_at) as { module_id: string; completed_at: string }[];
  const completedModuleIds = new Set(completions.map((c) => c.module_id));
  const remainingModules = modules.length - completedModuleIds.size;
  if (remainingModules === 0) return null;

  const lastActivityAt = [
    ...completions.map((c) => new Date(c.completed_at)),
    checkpointRow?.updated_at ? new Date(checkpointRow.updated_at) : null,
    new Date(enrollment.created_at),
  ]
    .filter((d): d is Date => Boolean(d))
    .sort((a, b) => b.getTime() - a.getTime())[0];

  const now = new Date();
  const daysInactive = daysBetween(lastActivityAt, now);
  if (daysInactive < INACTIVITY_THRESHOLD_DAYS) return null;

  const weeksEnrolled = Math.max(daysBetween(new Date(enrollment.created_at), now) / 7, 1);
  const rawPace = completedModuleIds.size / weeksEnrolled;
  const pace = Math.min(Math.max(rawPace || MIN_PACE_MODULES_PER_WEEK, MIN_PACE_MODULES_PER_WEEK), MAX_PACE_MODULES_PER_WEEK);

  const projectedWeeks = Math.max(Math.ceil(remainingModules / pace), 1);
  const modulesPerWeek = Math.max(Math.ceil(remainingModules / projectedWeeks), 1);

  const remainingTitles = modules.filter((m) => !completedModuleIds.has(m.id)).map((m) => m.title);
  const weeklyPlan: { weekNumber: number; moduleTitles: string[]; note: string }[] = [];
  for (let week = 0; week < projectedWeeks; week++) {
    const titles = remainingTitles.slice(week * modulesPerWeek, (week + 1) * modulesPerWeek);
    if (titles.length === 0) break;
    weeklyPlan.push({
      weekNumber: week + 1,
      moduleTitles: titles,
      note: `About ${titles.length * AVG_MODULE_MINUTES} minutes this week, based on your own past pace, not a guess.`,
    });
  }

  const targetCompletionDate = new Date(now.getTime() + projectedWeeks * 7 * MS_PER_DAY).toISOString().slice(0, 10);

  const { data: inserted, error } = await supabase
    .from("catchup_plans")
    .upsert(
      {
        user_id: userId,
        course_id: courseId,
        days_inactive: daysInactive,
        remaining_modules: remainingModules,
        recommended_weekly_minutes: modulesPerWeek * AVG_MODULE_MINUTES,
        weekly_plan: weeklyPlan,
        target_completion_date: targetCompletionDate,
        generated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,course_id" }
    )
    .select("*")
    .single();

  if (error) return null;
  return inserted as CatchupPlanRow;
}
