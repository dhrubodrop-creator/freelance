import type { SkillRow } from "@/types/db";

export interface SkillGap {
  have: SkillRow[];
  missing: SkillRow[];
}

/**
 * Plain set comparison — deterministic, not an LLM call. Comparing "skills
 * in a track's category" against "skills the user has already added" is
 * arithmetic, not reasoning, so it belongs in normal code per this
 * project's AI/non-AI split (see DECISIONS.md).
 */
export function computeSkillGap(trackSkills: SkillRow[], userSkillIds: Set<string>): SkillGap {
  const have: SkillRow[] = [];
  const missing: SkillRow[] = [];
  for (const skill of trackSkills) {
    (userSkillIds.has(skill.id) ? have : missing).push(skill);
  }
  return { have, missing };
}
