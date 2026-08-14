import "server-only";

import { supabaseAdmin } from "@/lib/supabase/server";
import { isCapstonePassed } from "@/lib/capstone-evidence";

/**
 * Outcome Engine Phase 7 — "Reality Check": can you actually do the work,
 * not just did you finish the course. Deterministic, evidence-only —
 * dimensions Ropes genuinely has no persisted evidence for (explain a file,
 * modify code, reproduce a bug) are marked NOT_AVAILABLE rather than
 * silently scored, per the brief's "never give a false sense of
 * competence" instruction. No AI call — every input already exists.
 */
export type RealityCheckStatus = "ready" | "not_ready" | "not_available";

export interface RealityCheckDimension {
  key: string;
  label: string;
  status: RealityCheckStatus;
  evidence: string;
  fixHref: string | null;
}

export async function runRealityCheck(userId: string): Promise<{
  overall: "READY" | "NOT_READY";
  dimensions: RealityCheckDimension[];
  thingsToFix: { label: string; href: string }[];
}> {
  const supabase = supabaseAdmin();

  const [
    { data: capstoneSubmissions },
    { data: runs },
    { data: replays },
    { data: simSessions },
    { data: monetisationPlan },
    { count: approvedProposalCount },
  ] = await Promise.all([
    supabase.from("capstone_submissions").select("id").eq("user_id", userId).eq("status", "reviewed"),
    supabase.from("project_verification_runs").select("check_type, blockers, results").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("project_verification_runs").select("results").eq("user_id", userId).eq("check_type", "failure_replay"),
    supabase.from("simulation_sessions").select("evaluation").eq("user_id", userId).eq("status", "completed"),
    supabase.from("monetisation_plans").select("id").eq("user_id", userId).maybeSingle(),
    supabase.from("proposals").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("approved", true),
  ]);

  const latestByType = new Map<string, { blockers: string[] }>();
  for (const r of runs ?? []) if (!latestByType.has(r.check_type)) latestByType.set(r.check_type, { blockers: r.blockers ?? [] });
  const runReady = (type: string) => (!latestByType.has(type) ? null : (latestByType.get(type)?.blockers.length ?? 0) === 0);

  let capstonePassed: boolean | null = null;
  if ((capstoneSubmissions ?? []).length > 0) {
    const { data: reviews } = await supabase
      .from("capstone_reviews")
      .select("dimension_scores")
      .in("submission_id", (capstoneSubmissions ?? []).map((s) => s.id));
    capstonePassed = (reviews ?? []).some((r) => isCapstonePassed(r.dimension_scores));
  }

  const debugResolved = (replays ?? []).some((r) => (r.results as { resolved?: boolean } | null)?.resolved === true);
  const communicated = (simSessions ?? []).length > 0;
  const businessValueDemonstrated = Boolean(monetisationPlan) && (approvedProposalCount ?? 0) > 0;
  const testReady = runReady("test_generation") ?? runReady("ai_evaluation");
  const secureReady = runReady("security");
  const deployReady = runReady("performance");

  function dim(key: string, label: string, ready: boolean | null, evidenceYes: string, evidenceNo: string, fixHref: string | null): RealityCheckDimension {
    if (ready === null) return { key, label, status: "not_available", evidence: "No evidence recorded yet.", fixHref };
    return { key, label, status: ready ? "ready" : "not_ready", evidence: ready ? evidenceYes : evidenceNo, fixHref: ready ? null : fixHref };
  }

  const dimensions: RealityCheckDimension[] = [
    { key: "explain", label: "Explain your code", status: "not_available", evidence: "Ropes doesn't yet persist Explain-My-Code sessions as evidence.", fixHref: null },
    { key: "modify", label: "Modify your code", status: "not_available", evidence: "No persisted evidence for this capability yet.", fixHref: null },
    dim("debug", "Debug a real failure", debugResolved ? true : ((replays ?? []).length > 0 ? false : null), "You've fixed a real failing check via Failure Replay.", "You have unresolved failed checks — replay and fix one.", "/portfolio"),
    { key: "reproduce", label: "Reproduce an issue", status: "not_available", evidence: "No persisted evidence for this capability yet.", fixHref: null },
    dim("defend", "Defend your work", capstonePassed, "You've passed an AI-defended capstone.", "Your capstone hasn't passed yet — improve and re-defend it.", "/portfolio"),
    dim("secure", "Secure your project", secureReady, "Your last security check passed clean.", "Your last security check found issues.", "/portfolio"),
    dim("test", "Test your project", testReady, "You have a passing test/evaluation run.", "Your last test/evaluation run had issues.", "/portfolio"),
    dim("deploy", "Deploy your project", deployReady, "Your project has a real, checked deployment.", "No clean deployment check yet.", "/portfolio"),
    dim("communicate", "Communicate with a client", communicated, "You've completed a real simulation session.", "You haven't completed a client/discovery simulation yet.", "/simulations"),
    dim("business_value", "Demonstrate business value", businessValueDemonstrated, "You have a monetisation plan and an approved proposal.", "You don't have an approved proposal yet.", "/dashboard"),
  ];

  const scoredDimensions = dimensions.filter((d) => d.status !== "not_available");
  const readyCount = scoredDimensions.filter((d) => d.status === "ready").length;
  const overall: "READY" | "NOT_READY" = scoredDimensions.length > 0 && readyCount === scoredDimensions.length ? "READY" : "NOT_READY";

  const thingsToFix = dimensions
    .filter((d) => d.status === "not_ready" && d.fixHref)
    .slice(0, 3)
    .map((d) => ({ label: d.label, href: d.fixHref as string }));

  return { overall, dimensions, thingsToFix };
}
