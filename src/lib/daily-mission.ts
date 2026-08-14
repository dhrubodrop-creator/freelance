import "server-only";

import { callAI } from "@/lib/ai/router";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { DailyMissionReason, DailyMissionRow, EnrollmentRow, ExerciseRow, ModuleRow } from "@/types/db";

/**
 * What task the learner should do today, and why. Selection (which module,
 * which exercise) is plain deterministic code reading real progress/
 * exercise-completion signals — same "code computes, AI explains" split as
 * skill-gap.ts and monetisation.ts's readiness score. Only the `whyItMatters`
 * sentence goes through the AI router, with a deterministic fallback, so a
 * Cerebras hiccup never blocks the learner from seeing their mission.
 */

const MINUTES_BY_REASON: Record<DailyMissionReason, number> = {
  unfinished_exercise: 20,
  next_incomplete_module: 30,
  skill_gap_practice: 20,
  capstone_progress: 60,
  catchup: 30,
};

interface MissionTarget {
  courseId: string;
  moduleId: string | null;
  exerciseId: string | null;
  objective: string;
  reason: DailyMissionReason;
  acceptanceCriteria: string[];
  courseTitle: string;
  moduleTitle: string | null;
}

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Picks the course to build today's mission around: the one the learner most recently touched, else their first active enrollment. */
async function pickActiveCourse(userId: string): Promise<EnrollmentRow & { course: { id: string; title: string } } | null> {
  const supabase = supabaseAdmin();
  const { data: lastCheckpoint } = await supabase
    .from("learner_checkpoints")
    .select("course_id")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: enrollments } = (await supabase
    .from("enrollments")
    .select("*, course:courses(id, title)")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: true })) as unknown as {
    data: (EnrollmentRow & { course: { id: string; title: string } | null })[] | null;
  };

  if (!enrollments || enrollments.length === 0) return null;

  const preferred = lastCheckpoint
    ? enrollments.find((e) => e.course_id === lastCheckpoint.course_id)
    : null;
  const chosen = (preferred ?? enrollments[0]) as EnrollmentRow & { course: { id: string; title: string } | null };
  if (!chosen.course) return null;
  return chosen as EnrollmentRow & { course: { id: string; title: string } };
}

async function findMissionTarget(userId: string): Promise<MissionTarget | null> {
  const enrollment = await pickActiveCourse(userId);
  if (!enrollment) return null;

  const supabase = supabaseAdmin();
  const { data: modulesData } = await supabase
    .from("modules")
    .select("*")
    .eq("course_id", enrollment.course_id)
    .order("order_index", { ascending: true });
  const modules = (modulesData ?? []) as ModuleRow[];
  if (modules.length === 0) return null;

  const { data: progressRows } = await supabase
    .from("progress")
    .select("module_id, completed_at")
    .eq("user_id", userId)
    .in("module_id", modules.map((m) => m.id));
  const completedModuleIds = new Set(
    (progressRows ?? []).filter((p) => p.completed_at).map((p) => p.module_id as string)
  );

  const currentModule = modules.find((m) => !completedModuleIds.has(m.id));

  if (currentModule) {
    const { data: exercisesData } = await supabase
      .from("exercises")
      .select("*")
      .eq("module_id", currentModule.id)
      .order("order_index", { ascending: true });
    const exercises = (exercisesData ?? []) as ExerciseRow[];

    if (exercises.length > 0) {
      const { data: completions } = await supabase
        .from("exercise_completions")
        .select("exercise_id")
        .eq("user_id", userId)
        .in("exercise_id", exercises.map((e) => e.id));
      const completedExerciseIds = new Set((completions ?? []).map((c) => c.exercise_id as string));
      const nextExercise = exercises.find((e) => !completedExerciseIds.has(e.id));
      if (nextExercise) {
        return {
          courseId: enrollment.course_id,
          moduleId: currentModule.id,
          exerciseId: nextExercise.id,
          objective: `Complete "${nextExercise.title}" in ${currentModule.title}`,
          reason: "unfinished_exercise",
          acceptanceCriteria: [
            `Work through "${nextExercise.title}" using the problem statement and hints, not the solution notes first.`,
            "Mark it complete in the Practice tab once you can explain your approach out loud.",
          ],
          courseTitle: enrollment.course.title,
          moduleTitle: currentModule.title,
        };
      }
    }

    return {
      courseId: enrollment.course_id,
      moduleId: currentModule.id,
      exerciseId: null,
      objective: `Finish "${currentModule.title}"`,
      reason: "next_incomplete_module",
      acceptanceCriteria: currentModule.build_deliverable
        ? [currentModule.build_deliverable, "Mark the module complete."]
        : ["Watch the lesson and read the module content.", "Mark the module complete."],
      courseTitle: enrollment.course.title,
      moduleTitle: currentModule.title,
    };
  }

  // Every module is complete — check for an unsubmitted capstone.
  const { data: capstone } = await supabase
    .from("course_capstones")
    .select("id")
    .eq("course_id", enrollment.course_id)
    .maybeSingle();
  if (capstone) {
    const { data: submission } = await supabase
      .from("capstone_submissions")
      .select("status")
      .eq("user_id", userId)
      .eq("capstone_id", capstone.id)
      .maybeSingle();
    if (!submission || submission.status !== "reviewed") {
      return {
        courseId: enrollment.course_id,
        moduleId: null,
        exerciseId: null,
        objective: `Advance your capstone for ${enrollment.course.title}`,
        reason: "capstone_progress",
        acceptanceCriteria: [
          "Move your capstone submission to its next status (in progress -> defence answers -> submitted for review).",
        ],
        courseTitle: enrollment.course.title,
        moduleTitle: null,
      };
    }
  }

  return null;
}

const FRAMING_SYSTEM_PROMPT = `You write one short, honest "why this matters today" sentence for a learner's daily mission on
Ropes, a platform that teaches practical AI/automation skills toward real freelance/employment income. You will be given
the course, the specific objective, and why it was selected (unfinished exercise / incomplete module / capstone).
Write 1 sentence, second person, concrete, no hype, no fabricated stats or outcomes. Respond with plain text only, no
quotes, no markdown.`;

async function frameWhyItMatters(target: MissionTarget, userId: string): Promise<string> {
  const fallback =
    target.reason === "unfinished_exercise"
      ? `Finishing this exercise is what turns "watched the lesson" into a skill you can actually demonstrate.`
      : target.reason === "capstone_progress"
        ? `Your capstone is the proof-of-work a client or employer will actually look at — this is the step that moves it forward.`
        : `This module is the next unlock on your path through ${target.courseTitle} — finishing it keeps your progress real, not just started.`;

  const result = await callAI({
    task: "daily_mission_framing",
    userId,
    messages: [
      { role: "system", content: FRAMING_SYSTEM_PROMPT },
      {
        role: "user",
        content: JSON.stringify({
          course: target.courseTitle,
          module: target.moduleTitle,
          objective: target.objective,
          reason: target.reason,
        }),
      },
    ],
  });
  const text = result?.content.trim();
  return text && text.length > 0 && text.length < 400 ? text : fallback;
}

async function buildAndInsertMission(userId: string, missionDate: string): Promise<DailyMissionRow | null> {
  const target = await findMissionTarget(userId);
  if (!target) return null;

  const whyItMatters = await frameWhyItMatters(target, userId);

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("daily_missions")
    .upsert(
      {
        user_id: userId,
        mission_date: missionDate,
        course_id: target.courseId,
        module_id: target.moduleId,
        exercise_id: target.exerciseId,
        objective: target.objective,
        why_it_matters: whyItMatters,
        estimated_minutes: MINUTES_BY_REASON[target.reason],
        acceptance_criteria: target.acceptanceCriteria,
        status: "pending",
        reason: target.reason,
        generated_via: "ai",
      },
      { onConflict: "user_id,mission_date" }
    )
    .select("*")
    .single();

  if (error) return null;
  return data as DailyMissionRow;
}

/** Returns today's mission, generating it if none exists yet. Never overwrites a mission the learner has already started/finished today. */
export async function getOrCreateDailyMission(userId: string): Promise<DailyMissionRow | null> {
  const missionDate = todayDateString();
  const supabase = supabaseAdmin();
  const { data: existing } = await supabase
    .from("daily_missions")
    .select("*")
    .eq("user_id", userId)
    .eq("mission_date", missionDate)
    .maybeSingle();
  if (existing) return existing as DailyMissionRow;

  return buildAndInsertMission(userId, missionDate);
}

/** Forces a fresh mission for today, replacing a pending/skipped one. Refuses to clobber one already in_progress/completed. */
export async function regenerateDailyMission(userId: string): Promise<DailyMissionRow | null> {
  const missionDate = todayDateString();
  const supabase = supabaseAdmin();
  const { data: existing } = await supabase
    .from("daily_missions")
    .select("status")
    .eq("user_id", userId)
    .eq("mission_date", missionDate)
    .maybeSingle();
  if (existing && (existing.status === "in_progress" || existing.status === "completed")) {
    return null;
  }
  return buildAndInsertMission(userId, missionDate);
}

export async function updateDailyMissionStatus(
  userId: string,
  missionId: string,
  status: "in_progress" | "completed" | "skipped"
): Promise<boolean> {
  const supabase = supabaseAdmin();
  const { error } = await supabase
    .from("daily_missions")
    .update({ status, completed_at: status === "completed" ? new Date().toISOString() : null })
    .eq("id", missionId)
    .eq("user_id", userId);
  return !error;
}
