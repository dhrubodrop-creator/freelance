import "server-only";

import { supabaseAdmin } from "@/lib/supabase/server";
import { getEvidenceTimeline } from "@/lib/evidence-timeline";

/**
 * Section 48 — Graduation Replay. Composes the full idea -> plan -> build ->
 * fail -> debug -> test -> deploy -> defend -> prove story entirely from
 * evidence already recorded in earlier phases — no new table, no invented
 * narrative. A stage is only shown as "reached" when real evidence for it
 * exists; stages with nothing yet are shown as not-yet-reached rather than
 * silently skipped, so the replay stays honest about what's actually done.
 */
export interface GraduationStage {
  stage: "idea" | "plan" | "build" | "fail" | "debug" | "test" | "deploy" | "defend" | "prove";
  reached: boolean;
  summary: string;
}

export async function generateGraduationReplay(userId: string, portfolioItemId: string): Promise<GraduationStage[] | null> {
  const supabase = supabaseAdmin();
  const { data: item } = await supabase
    .from("portfolio_items")
    .select("id, title, course_id")
    .eq("id", portfolioItemId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!item) return null;

  const [{ data: ideaPlan }, timeline, { data: rescues }, { data: runs }, { data: capstoneSubmission }, { data: caseStudy }] = await Promise.all([
    supabase.from("project_idea_plans").select("idea, milestones").eq("portfolio_item_id", portfolioItemId).maybeSingle(),
    getEvidenceTimeline(userId, portfolioItemId),
    supabase.from("concept_rescue_requests").select("id").eq("user_id", userId).limit(1),
    supabase.from("project_verification_runs").select("check_type, blockers").eq("portfolio_item_id", portfolioItemId),
    item.course_id
      ? supabase.from("capstone_submissions").select("status").eq("user_id", userId).eq("status", "reviewed").limit(1).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("portfolio_case_studies").select("approved").eq("portfolio_item_id", portfolioItemId).maybeSingle(),
  ]);

  const runRows = runs ?? [];
  const failures = runRows.filter((r) => Array.isArray(r.blockers) && r.blockers.length > 0);
  const tests = runRows.filter((r) => r.check_type === "test_generation");
  const deploys = runRows.filter((r) => r.check_type === "performance" || r.check_type === "security");
  const defenses = runRows.filter((r) => r.check_type === "code_review");

  const checkpointCount = timeline.filter((e) => e.type === "checkpoint").length;
  const decisionCount = timeline.filter((e) => e.type === "decision").length;

  return [
    {
      stage: "idea",
      reached: Boolean(ideaPlan),
      summary: ideaPlan ? `Started from: "${ideaPlan.idea}"` : `Project "${item.title}" was added directly, not via Build From My Idea.`,
    },
    {
      stage: "plan",
      reached: Boolean(ideaPlan?.milestones?.length),
      summary: ideaPlan?.milestones?.length ? `${ideaPlan.milestones.length} milestones planned.` : "No structured plan recorded.",
    },
    {
      stage: "build",
      reached: checkpointCount > 0 || decisionCount > 0,
      summary: `${checkpointCount} checkpoint(s), ${decisionCount} architecture decision(s) logged.`,
    },
    {
      stage: "fail",
      reached: failures.length > 0,
      summary: failures.length > 0 ? `${failures.length} check(s) surfaced real issues along the way.` : "No recorded failures — or none checked yet.",
    },
    {
      stage: "debug",
      reached: (rescues?.length ?? 0) > 0 || runRows.some((r) => r.check_type === "failure_replay"),
      summary: (rescues?.length ?? 0) > 0 ? "Used Concept Rescue to work through a sticking point." : "No recorded debugging sessions.",
    },
    {
      stage: "test",
      reached: tests.length > 0,
      summary: tests.length > 0 ? `${tests.length} test-generation run(s).` : "No tests generated yet.",
    },
    {
      stage: "deploy",
      reached: deploys.length > 0,
      summary: deploys.length > 0 ? "Performance/security checks run against a real deployment." : "Not yet deployed and checked.",
    },
    {
      stage: "defend",
      reached: defenses.length > 0 || Boolean(capstoneSubmission),
      summary: capstoneSubmission ? "Capstone defended and scored." : defenses.length > 0 ? "Code reviewed/defended." : "No defense recorded yet.",
    },
    {
      stage: "prove",
      reached: Boolean(caseStudy?.approved),
      summary: caseStudy?.approved ? "Case study approved — ready for the proof profile." : "Case study not yet approved.",
    },
  ];
}
