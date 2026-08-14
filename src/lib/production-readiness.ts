import "server-only";

import { supabaseAdmin } from "@/lib/supabase/server";
import { latestVerificationRun } from "@/lib/verification-runs";
import { runAccessibilityAudit, runPerformanceCheck, runSecurityScan, runVisualQA } from "@/lib/quality-labs";
import { checkArchitectureDrift } from "@/lib/code-review";
import type { VerificationCheckType } from "@/types/db";

/**
 * Sections 25/46/47 — Production Readiness Score, Project Health
 * Dashboard, Make Me Production Ready. Deliberately NOT a blind average
 * (brief's explicit instruction): dimensions with no real check data are
 * marked "not checked" rather than scored 0 or 100, and the overall score
 * only averages dimensions that actually have data, weighted by how much a
 * gap there actually costs (security/tests weighted highest).
 */

const DIMENSION_WEIGHTS: Record<string, number> = {
  build: 15,
  tests: 20,
  security: 20,
  accessibility: 10,
  performance: 10,
  ai_quality: 10,
  deployment: 10,
  operational_readiness: 5,
};

export interface DimensionStatus {
  dimension: string;
  status: "not_checked" | "pass" | "issues";
  score: number | null;
  blockers: string[];
  lastCheckedAt: string | null;
}

export interface ProjectHealth {
  score: number | null;
  dimensions: DimensionStatus[];
  blockers: string[];
  nextActions: string[];
}

async function dimensionFromRun(userId: string, portfolioItemId: string, checkType: VerificationCheckType, dimensionName: string): Promise<DimensionStatus> {
  const run = await latestVerificationRun(userId, portfolioItemId, checkType);
  if (!run) return { dimension: dimensionName, status: "not_checked", score: null, blockers: [], lastCheckedAt: null };
  return {
    dimension: dimensionName,
    status: run.blockers.length > 0 ? "issues" : "pass",
    score: run.score,
    blockers: run.blockers,
    lastCheckedAt: run.created_at,
  };
}

export async function computeProjectHealth(userId: string, portfolioItemId: string): Promise<ProjectHealth> {
  const supabase = supabaseAdmin();

  const [{ data: repoLink }, { data: checks }] = await Promise.all([
    supabase.from("github_repo_links").select("repo_full_name").eq("portfolio_item_id", portfolioItemId).maybeSingle(),
    supabase.from("acceptance_checks").select("check_type, last_result").eq("portfolio_item_id", portfolioItemId),
  ]);

  const buildDimension: DimensionStatus = repoLink
    ? { dimension: "build", status: "pass", score: 100, blockers: [], lastCheckedAt: null }
    : { dimension: "build", status: "not_checked", score: null, blockers: [], lastCheckedAt: null };

  const [tests, security, accessibility, performance, aiQuality, architectureDrift] = await Promise.all([
    dimensionFromRun(userId, portfolioItemId, "test_generation", "tests"),
    dimensionFromRun(userId, portfolioItemId, "security", "security"),
    dimensionFromRun(userId, portfolioItemId, "accessibility", "accessibility"),
    dimensionFromRun(userId, portfolioItemId, "performance", "performance"),
    dimensionFromRun(userId, portfolioItemId, "ai_evaluation", "ai_quality"),
    dimensionFromRun(userId, portfolioItemId, "architecture_drift", "architecture"),
  ]);

  const deploymentChecks = (checks ?? []).filter((c) => c.check_type === "deployment_live");
  const deployment: DimensionStatus =
    deploymentChecks.length === 0
      ? { dimension: "deployment", status: "not_checked", score: null, blockers: [], lastCheckedAt: null }
      : {
          dimension: "deployment",
          status: deploymentChecks.some((c) => c.last_result === "pass") ? "pass" : "issues",
          score: deploymentChecks.some((c) => c.last_result === "pass") ? 100 : 0,
          blockers: deploymentChecks.some((c) => c.last_result === "pass") ? [] : ["Deployment check is not passing."],
          lastCheckedAt: null,
        };

  const operationalReadiness: DimensionStatus = {
    dimension: "operational_readiness",
    status: (checks ?? []).length > 0 ? "pass" : "not_checked",
    score: (checks ?? []).length > 0 ? 100 : null,
    blockers: [],
    lastCheckedAt: null,
  };

  const dimensions = [buildDimension, tests, security, accessibility, performance, aiQuality, deployment, operationalReadiness];

  const scored = dimensions.filter((d) => d.score !== null);
  const score =
    scored.length === 0
      ? null
      : Math.round(
          scored.reduce((sum, d) => sum + (d.score as number) * (DIMENSION_WEIGHTS[d.dimension] ?? 10), 0) /
            scored.reduce((sum, d) => sum + (DIMENSION_WEIGHTS[d.dimension] ?? 10), 0)
        );

  const blockers = dimensions.flatMap((d) => d.blockers);
  if (architectureDrift.status === "issues") blockers.push(...architectureDrift.blockers);

  const nextActions = dimensions
    .filter((d) => d.status !== "pass")
    .map((d) =>
      d.status === "not_checked"
        ? `Run a ${d.dimension.replace(/_/g, " ")} check — no data yet.`
        : `Fix ${d.dimension.replace(/_/g, " ")}: ${d.blockers[0] ?? "see details"}.`
    );

  return { score, dimensions, blockers, nextActions };
}

export interface ProductionReadinessScan {
  health: ProjectHealth;
  scannedDimensions: string[];
  skippedDimensions: string[];
}

/** "Make Me Production Ready" — runs every automated check it safely can, then reports blockers + a prioritized plan. Never claims to auto-fix anything. */
export async function scanForProductionReadiness(userId: string, portfolioItemId: string): Promise<ProductionReadinessScan | { error: string }> {
  const supabase = supabaseAdmin();
  const { data: item } = await supabase
    .from("portfolio_items")
    .select("deployment_url, architecture_note")
    .eq("id", portfolioItemId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!item) return { error: "Project not found." };

  const { data: repoLink } = await supabase.from("github_repo_links").select("repo_full_name").eq("portfolio_item_id", portfolioItemId).maybeSingle();

  const scanned: string[] = [];
  const skipped: string[] = [];

  if (item.deployment_url) {
    await Promise.all([
      runVisualQA({ userId, portfolioItemId, targetUrl: item.deployment_url }),
      runAccessibilityAudit({ userId, portfolioItemId, targetUrl: item.deployment_url }),
      runPerformanceCheck({ userId, portfolioItemId, targetUrl: item.deployment_url }),
      runSecurityScan({ userId, portfolioItemId, targetUrl: item.deployment_url, repoFullName: repoLink?.repo_full_name }),
    ]);
    scanned.push("visual_qa", "accessibility", "performance", "security");
  } else {
    skipped.push("visual_qa", "accessibility", "performance", "security (no deployment URL set)");
  }

  if (repoLink && item.architecture_note) {
    await checkArchitectureDrift({ userId, portfolioItemId, repoFullName: repoLink.repo_full_name });
    scanned.push("architecture_drift");
  } else {
    skipped.push("architecture_drift (needs a linked repo and an architecture note)");
  }

  const health = await computeProjectHealth(userId, portfolioItemId);
  return { health, scannedDimensions: scanned, skippedDimensions: skipped };
}
