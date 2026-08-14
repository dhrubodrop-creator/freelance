import "server-only";

import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * Section 43 — Momentum Meter. Counts only meaningful signals over a
 * trailing window (features shipped = passing verification runs, tests
 * passed = passing test_generation/ai_evaluation runs, capstone milestones,
 * deployments = passing deployment_live checks, resolved failures = true
 * failure_replay resolutions) — never raw click/page-view volume.
 */
export interface MomentumSummary {
  windowDays: number;
  featuresShipped: number;
  testsPassed: number;
  capstoneMilestones: number;
  deployments: number;
  resolvedFailures: number;
  total: number;
}

export async function computeMomentum(userId: string, windowDays = 30): Promise<MomentumSummary> {
  const supabase = supabaseAdmin();
  const since = new Date(Date.now() - windowDays * 86_400_000).toISOString();

  const [{ data: runs }, { data: checkpoints }, { data: capstoneSubs }] = await Promise.all([
    supabase
      .from("project_verification_runs")
      .select("check_type, blockers, results, created_at")
      .eq("user_id", userId)
      .gte("created_at", since),
    supabase.from("project_checkpoints").select("id, portfolio_items!inner(user_id), created_at").eq("portfolio_items.user_id", userId).gte("created_at", since),
    supabase.from("capstone_submissions").select("id, status, updated_at").eq("user_id", userId).eq("status", "reviewed").gte("updated_at", since),
  ]);

  const runRows = runs ?? [];
  const testsPassed = runRows.filter(
    (r) => (r.check_type === "test_generation" || r.check_type === "ai_evaluation") && (!Array.isArray(r.blockers) || r.blockers.length === 0)
  ).length;
  const deployments = runRows.filter(
    (r) => (r.results as { checkedUrl?: string } | null)?.checkedUrl && r.check_type === "performance" && (!Array.isArray(r.blockers) || r.blockers.length === 0)
  ).length;
  const resolvedFailures = runRows.filter((r) => r.check_type === "failure_replay" && (r.results as { resolved?: boolean } | null)?.resolved).length;

  const featuresShipped = (checkpoints ?? []).length;
  const capstoneMilestones = (capstoneSubs ?? []).length;

  return {
    windowDays,
    featuresShipped,
    testsPassed,
    capstoneMilestones,
    deployments,
    resolvedFailures,
    total: featuresShipped + testsPassed + capstoneMilestones + deployments + resolvedFailures,
  };
}
