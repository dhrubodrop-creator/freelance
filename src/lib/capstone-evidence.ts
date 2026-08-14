import "server-only";

import { supabaseAdmin } from "@/lib/supabase/server";
import type { DimensionScore } from "@/types/db";

/**
 * Post-audit P0 fix: the capstone previously certified a project without
 * ever knowing whether it actually passed its own automated verification.
 * This module builds a compact, honest evidence summary from real
 * project_verification_runs/acceptance_checks/github_repo_links rows —
 * never fabricated, and NOT_RUN is always distinct from PASS.
 *
 * Also the single canonical capstone-passing rule (previously inlined only
 * in defend/route.ts) — every place that needs to know "did this capstone
 * pass" must import isCapstonePassed() from here, not re-derive the
 * threshold.
 */

export const CAPSTONE_PASS_THRESHOLD = 50;

export function averageDimensionScore(dimensionScores: Record<string, DimensionScore>): number {
  const values = Object.values(dimensionScores ?? {});
  if (values.length === 0) return 0;
  return values.reduce((sum, s) => sum + s.score, 0) / values.length;
}

export function isCapstonePassed(dimensionScores: Record<string, DimensionScore> | null | undefined): boolean {
  if (!dimensionScores) return false;
  return averageDimensionScore(dimensionScores) >= CAPSTONE_PASS_THRESHOLD;
}

export type EvidenceStatus = "PASS" | "FAIL" | "NOT_RUN";
export type GitHubStatus = "CONNECTED" | "NOT_CONNECTED";

export interface VerificationEvidenceSummary {
  tests: EvidenceStatus;
  security: EvidenceStatus;
  accessibility: EvidenceStatus;
  performance: EvidenceStatus;
  aiEvaluation: EvidenceStatus;
  deployment: EvidenceStatus;
  github: GitHubStatus;
  openBlockers: string[];
  /** Plain-text block to inject directly into an AI prompt — see buildEvidencePromptBlock(). */
  promptBlock: string;
}

function statusFromLatestRun(run: { blockers: string[] } | null): EvidenceStatus {
  if (!run) return "NOT_RUN";
  return run.blockers.length > 0 ? "FAIL" : "PASS";
}

/**
 * Builds the evidence summary for a specific portfolio item. Never requires
 * GitHub to be configured — if no repo is linked, `github` is reported as
 * NOT_CONNECTED and no GitHub evidence is fabricated or implied.
 */
export async function buildVerificationEvidenceSummary(portfolioItemId: string): Promise<VerificationEvidenceSummary> {
  const supabase = supabaseAdmin();

  const [{ data: runs }, { data: checks }, { data: repoLink }] = await Promise.all([
    supabase
      .from("project_verification_runs")
      .select("check_type, blockers, created_at")
      .eq("portfolio_item_id", portfolioItemId)
      .order("created_at", { ascending: false }),
    supabase.from("acceptance_checks").select("check_type, last_result").eq("portfolio_item_id", portfolioItemId),
    supabase.from("github_repo_links").select("repo_full_name").eq("portfolio_item_id", portfolioItemId).maybeSingle(),
  ]);

  const runRows = (runs ?? []) as { check_type: string; blockers: string[]; created_at: string }[];
  const latestByType = new Map<string, { blockers: string[] }>();
  for (const r of runRows) {
    // Rows are already ordered newest-first, so the first occurrence per type is the latest.
    if (!latestByType.has(r.check_type)) latestByType.set(r.check_type, { blockers: r.blockers });
  }

  const deploymentChecks = (checks ?? []).filter((c) => c.check_type === "deployment_live");
  const deployment: EvidenceStatus =
    deploymentChecks.length === 0 ? "NOT_RUN" : deploymentChecks.some((c) => c.last_result === "pass") ? "PASS" : "FAIL";

  const github: GitHubStatus = repoLink ? "CONNECTED" : "NOT_CONNECTED";

  const summary: Omit<VerificationEvidenceSummary, "promptBlock"> = {
    tests: statusFromLatestRun(latestByType.get("test_generation") ?? null),
    security: statusFromLatestRun(latestByType.get("security") ?? null),
    accessibility: statusFromLatestRun(latestByType.get("accessibility") ?? null),
    performance: statusFromLatestRun(latestByType.get("performance") ?? null),
    aiEvaluation: statusFromLatestRun(latestByType.get("ai_evaluation") ?? null),
    deployment,
    github,
    openBlockers: runRows.filter((r) => r.blockers.length > 0).flatMap((r) => r.blockers.map((b) => `[${r.check_type}] ${b}`)),
  };

  return { ...summary, promptBlock: buildEvidencePromptBlock(summary) };
}

function buildEvidencePromptBlock(summary: Omit<VerificationEvidenceSummary, "promptBlock">): string {
  const lines = [
    "VERIFICATION SUMMARY (real, from this learner's actual project — NOT_RUN means never checked, treat it as unproven, never as a pass):",
    `Tests: ${summary.tests}`,
    `Security: ${summary.security}`,
    `Accessibility: ${summary.accessibility}`,
    `Performance: ${summary.performance}`,
    `AI evaluation: ${summary.aiEvaluation}`,
    `Deployment: ${summary.deployment}`,
    `GitHub: ${summary.github}${summary.github === "NOT_CONNECTED" ? " (no repository was linked — do not assume or invent any GitHub activity)" : ""}`,
    `Open blockers: ${summary.openBlockers.length > 0 ? summary.openBlockers.join("; ") : "none recorded"}`,
  ];
  return lines.join("\n");
}
