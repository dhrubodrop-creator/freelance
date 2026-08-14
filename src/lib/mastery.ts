import "server-only";

import { supabaseAdmin } from "@/lib/supabase/server";
import type { MasteryLevel, SkillMastery } from "@/types/db";

/**
 * Deterministic evidence ladder — not an LLM call, not a cached table.
 * "Module marked complete" and "skill mastered" are never the same claim in
 * this product (see spec section 19): mastery only advances past LEARNING
 * when there's actual practice (a completed exercise) or proof (a portfolio
 * item tagged with this skill). Recomputed from source signals on every
 * read, so it can never drift stale the way a cached score could.
 */
export function computeSkillMasteryLevel(evidence: {
  studied: boolean;
  practiced: boolean;
  project: boolean;
}): MasteryLevel {
  if (evidence.project && evidence.practiced) return "strong";
  if (evidence.project) return "demonstrated";
  if (evidence.practiced) return "practicing";
  if (evidence.studied) return "learning";
  return "not_started";
}

/**
 * Post-audit consistency-sweep fix: "is this skill VERIFIED" (demonstrated
 * or strong — i.e. backed by a real portfolio project, not just practice)
 * was previously re-derived independently in 5 different files. One
 * canonical definition now — every consumer (proof, opportunities,
 * monetisation, proof-share, proposals) imports this instead of re-checking
 * `level === "demonstrated" || level === "strong"` itself.
 */
export function isVerifiedMasteryLevel(level: MasteryLevel): boolean {
  return level === "demonstrated" || level === "strong";
}

export interface MasterySourceData {
  /** skill_id -> module ids that teach it */
  moduleIdsBySkill: Map<string, string[]>;
  /** skill_id -> exercise ids that belong to a module teaching it */
  exerciseIdsBySkill: Map<string, string[]>;
  completedModuleIds: Set<string>;
  completedExerciseIds: Set<string>;
  skillIdsWithPortfolioEvidence: Set<string>;
}

/**
 * Loads every source signal needed for computeMasteryForSkills across the
 * whole catalog for one user. The catalog is small (78 modules, a few
 * hundred exercises total) so one pass of small queries is cheap — this is
 * server-side aggregation for a single dashboard read, not per-request data
 * shipped to the client.
 */
export async function loadUserMasterySourceData(userId: string): Promise<MasterySourceData> {
  const supabase = supabaseAdmin();

  const [
    { data: moduleSkillRows },
    { data: exerciseRows },
    { data: progressRows },
    { data: exerciseCompletionRows },
    { data: portfolioSkillRows },
  ] = await Promise.all([
    supabase.from("module_skills").select("module_id, skill_id"),
    supabase.from("exercises").select("id, module_id"),
    supabase.from("progress").select("module_id").eq("user_id", userId).not("completed_at", "is", null),
    supabase.from("exercise_completions").select("exercise_id").eq("user_id", userId),
    supabase
      .from("portfolio_item_skills")
      .select("skill_id, portfolio_items!inner(user_id)")
      .eq("portfolio_items.user_id", userId),
  ]);

  const moduleIdsBySkill = new Map<string, string[]>();
  for (const row of moduleSkillRows ?? []) {
    const list = moduleIdsBySkill.get(row.skill_id) ?? [];
    list.push(row.module_id);
    moduleIdsBySkill.set(row.skill_id, list);
  }

  const skillIdsByModule = new Map<string, string[]>();
  for (const row of moduleSkillRows ?? []) {
    const list = skillIdsByModule.get(row.module_id) ?? [];
    list.push(row.skill_id);
    skillIdsByModule.set(row.module_id, list);
  }

  const exerciseIdsBySkill = new Map<string, string[]>();
  for (const exercise of exerciseRows ?? []) {
    for (const skillId of skillIdsByModule.get(exercise.module_id) ?? []) {
      const list = exerciseIdsBySkill.get(skillId) ?? [];
      list.push(exercise.id);
      exerciseIdsBySkill.set(skillId, list);
    }
  }

  return {
    moduleIdsBySkill,
    exerciseIdsBySkill,
    completedModuleIds: new Set((progressRows ?? []).map((r) => r.module_id as string)),
    completedExerciseIds: new Set((exerciseCompletionRows ?? []).map((r) => r.exercise_id as string)),
    skillIdsWithPortfolioEvidence: new Set((portfolioSkillRows ?? []).map((r) => r.skill_id as string)),
  };
}

export function computeMasteryForSkills(skillIds: string[], data: MasterySourceData): SkillMastery[] {
  return skillIds.map((skillId) => {
    const modules = data.moduleIdsBySkill.get(skillId) ?? [];
    const exercises = data.exerciseIdsBySkill.get(skillId) ?? [];
    const studied = modules.length > 0 && modules.every((id) => data.completedModuleIds.has(id));
    const practiced = exercises.some((id) => data.completedExerciseIds.has(id));
    const project = data.skillIdsWithPortfolioEvidence.has(skillId);
    return {
      skillId,
      level: computeSkillMasteryLevel({ studied, practiced, project }),
      evidence: { studied, practiced, project },
    };
  });
}
