import "server-only";

import { supabaseAdmin } from "@/lib/supabase/server";
import { recordVerificationRun } from "@/lib/verification-runs";
import { runAccessibilityAudit, runPerformanceCheck, runSecurityScan, runVisualQA } from "@/lib/quality-labs";
import type { VerificationCheckType } from "@/types/db";

/**
 * Post-audit P2 fix: Failure Replay previously only worked for
 * `ai_evaluation` runs (see ai-evaluation.ts's replayFailedRun). This
 * generalizes the same FAILED -> REPLAY -> FIX -> RE-RUN -> PASS loop to
 * the other quality-lab check types, since their input (a target URL, or a
 * linked GitHub repo) is real, structured, and re-runnable — re-running the
 * exact same check against the same real target. `test_generation` and
 * `code_review`/`architecture_drift`/`ai_code_defense` are intentionally
 * left unsupported here: they produce a text artifact for the learner to
 * act on, not a pass/fail check against a live target, so "replay" wouldn't
 * mean anything — this is documented, not silently faked.
 */

const REPLAYABLE_TYPES: VerificationCheckType[] = ["visual_qa", "accessibility", "security", "performance"];

export function isReplayable(checkType: VerificationCheckType): boolean {
  return REPLAYABLE_TYPES.includes(checkType);
}

export async function replayVerificationRun(
  userId: string,
  runId: string
): Promise<{ resolved: boolean } | { error: string }> {
  const supabase = supabaseAdmin();
  const { data: run } = await supabase
    .from("project_verification_runs")
    .select("*")
    .eq("id", runId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!run) return { error: "Original run not found." };

  const checkType = run.check_type as VerificationCheckType;
  if (!isReplayable(checkType)) {
    return { error: `${checkType.replace(/_/g, " ")} checks don't support replay yet — re-run them manually from the labs panel.` };
  }
  if (!run.portfolio_item_id) return { error: "This run isn't linked to a project." };

  const results = run.results as Record<string, unknown>;
  const targetUrl = typeof results.checkedUrl === "string" ? results.checkedUrl : null;

  let rerunResult;
  if (checkType === "visual_qa") {
    if (!targetUrl) return { error: "No target URL recorded on the original run." };
    rerunResult = await runVisualQA({ userId, portfolioItemId: run.portfolio_item_id, targetUrl });
  } else if (checkType === "accessibility") {
    if (!targetUrl) return { error: "No target URL recorded on the original run." };
    rerunResult = await runAccessibilityAudit({ userId, portfolioItemId: run.portfolio_item_id, targetUrl });
  } else if (checkType === "performance") {
    if (!targetUrl) return { error: "No target URL recorded on the original run." };
    rerunResult = await runPerformanceCheck({ userId, portfolioItemId: run.portfolio_item_id, targetUrl });
  } else {
    const { data: repoLink } = await supabase
      .from("github_repo_links")
      .select("repo_full_name")
      .eq("portfolio_item_id", run.portfolio_item_id)
      .maybeSingle();
    rerunResult = await runSecurityScan({
      userId,
      portfolioItemId: run.portfolio_item_id,
      targetUrl,
      repoFullName: repoLink?.repo_full_name,
    });
  }

  if ("error" in rerunResult) return rerunResult;

  // The quality-lab functions already recorded a fresh project_verification_runs
  // row as a side effect — read it back to know whether the replay actually
  // resolved the failure (never assume; check the real new blockers).
  const { data: freshRun } = await supabase
    .from("project_verification_runs")
    .select("blockers")
    .eq("portfolio_item_id", run.portfolio_item_id)
    .eq("check_type", checkType)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const actuallyResolved = !freshRun || !freshRun.blockers || freshRun.blockers.length === 0;

  await recordVerificationRun({
    userId,
    portfolioItemId: run.portfolio_item_id,
    checkType: "failure_replay",
    inputSummary: `Replay of ${runId} (${checkType})`,
    results: { originalRunId: runId, checkType, resolved: actuallyResolved },
  });

  return { resolved: actuallyResolved };
}
