import "server-only";

import { supabaseAdmin } from "@/lib/supabase/server";
import type { ProjectCheckpointRow } from "@/types/db";

/**
 * Automatic checkpoints for a portfolio-item project. `state_snapshot` is
 * built from real, currently-true signals (decision count, case-study
 * existence) at the moment the checkpoint is taken — not free-form text —
 * so a later "compare" is a real diff. Ropes doesn't host learner code, so
 * "restore" is scoped to what this system actually owns: re-surfacing a
 * past checkpoint's note/task as context, never overwriting the learner's
 * current project state (there is nothing here that could destructively
 * overwrite real code).
 */
export async function createCheckpoint(input: {
  userId: string;
  portfolioItemId: string;
  label: string;
  task?: string | null;
  learnerNote?: string | null;
  commitSha?: string | null;
}): Promise<ProjectCheckpointRow | null> {
  const supabase = supabaseAdmin();

  const { data: item } = await supabase
    .from("portfolio_items")
    .select("id, title, description, outcome, updated_at")
    .eq("id", input.portfolioItemId)
    .eq("user_id", input.userId)
    .maybeSingle();
  if (!item) return null;

  const [{ count: decisionCount }, { data: caseStudy }] = await Promise.all([
    supabase
      .from("project_decisions")
      .select("id", { count: "exact", head: true })
      .eq("portfolio_item_id", input.portfolioItemId),
    supabase.from("portfolio_case_studies").select("approved").eq("portfolio_item_id", input.portfolioItemId).maybeSingle(),
  ]);

  const { data: inserted, error } = await supabase
    .from("project_checkpoints")
    .insert({
      portfolio_item_id: input.portfolioItemId,
      label: input.label,
      task: input.task ?? null,
      learner_note: input.learnerNote ?? null,
      commit_sha: input.commitSha ?? null,
      state_snapshot: {
        title: item.title,
        hasOutcome: Boolean(item.outcome),
        decisionCount: decisionCount ?? 0,
        caseStudyApproved: caseStudy?.approved ?? false,
      },
    })
    .select("*")
    .single();

  if (error) return null;
  return inserted as ProjectCheckpointRow;
}

export async function listCheckpoints(userId: string, portfolioItemId: string): Promise<ProjectCheckpointRow[]> {
  const supabase = supabaseAdmin();
  const { data: item } = await supabase
    .from("portfolio_items")
    .select("id")
    .eq("id", portfolioItemId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!item) return [];

  const { data } = await supabase
    .from("project_checkpoints")
    .select("*")
    .eq("portfolio_item_id", portfolioItemId)
    .order("created_at", { ascending: false });
  return (data ?? []) as ProjectCheckpointRow[];
}
