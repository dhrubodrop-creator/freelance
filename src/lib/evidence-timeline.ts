import "server-only";

import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * Sections 32-33 — Evidence Timeline + Before/After Playback. No new table:
 * both are computed by merging existing evidence sources (checkpoints,
 * decisions, verification runs, GitHub events) chronologically. Activity
 * volume is not treated as competence — only `meaningful`/blocker-free
 * signals count toward "milestones", per the brief's explicit instruction.
 */

export interface EvidenceEvent {
  type: "checkpoint" | "decision" | "verification_pass" | "verification_fail" | "github_activity" | "case_study_approved";
  label: string;
  detail: string;
  timestamp: string;
}

export async function getEvidenceTimeline(userId: string, portfolioItemId: string): Promise<EvidenceEvent[]> {
  const supabase = supabaseAdmin();
  const { data: item } = await supabase.from("portfolio_items").select("id, title").eq("id", portfolioItemId).eq("user_id", userId).maybeSingle();
  if (!item) return [];

  const [{ data: checkpoints }, { data: decisions }, { data: runs }, { data: caseStudy }, { data: repoLink }] = await Promise.all([
    supabase.from("project_checkpoints").select("label, task, created_at").eq("portfolio_item_id", portfolioItemId),
    supabase.from("project_decisions").select("decision, reasoning, created_at").eq("portfolio_item_id", portfolioItemId),
    supabase.from("project_verification_runs").select("check_type, input_summary, blockers, created_at").eq("portfolio_item_id", portfolioItemId),
    supabase.from("portfolio_case_studies").select("approved, generated_at").eq("portfolio_item_id", portfolioItemId).maybeSingle(),
    supabase.from("github_repo_links").select("repo_full_name").eq("portfolio_item_id", portfolioItemId).maybeSingle(),
  ]);

  const events: EvidenceEvent[] = [];

  for (const c of checkpoints ?? []) {
    events.push({ type: "checkpoint", label: c.label, detail: c.task ?? "", timestamp: c.created_at });
  }
  for (const d of decisions ?? []) {
    events.push({ type: "decision", label: d.decision, detail: d.reasoning, timestamp: d.created_at });
  }
  for (const r of runs ?? []) {
    const hasBlockers = Array.isArray(r.blockers) && r.blockers.length > 0;
    events.push({
      type: hasBlockers ? "verification_fail" : "verification_pass",
      label: `${r.check_type.replace(/_/g, " ")} ${hasBlockers ? "found issues" : "passed"}`,
      detail: hasBlockers ? r.blockers.join("; ") : r.input_summary,
      timestamp: r.created_at,
    });
  }
  if (caseStudy?.approved) {
    events.push({ type: "case_study_approved", label: "Case study approved", detail: item.title, timestamp: caseStudy.generated_at });
  }
  if (repoLink) {
    const { data: githubEvents } = await supabase
      .from("github_events")
      .select("summary, received_at")
      .eq("repo_full_name", repoLink.repo_full_name)
      .eq("meaningful", true)
      .order("received_at", { ascending: false })
      .limit(20);
    for (const e of githubEvents ?? []) {
      events.push({ type: "github_activity", label: e.summary, detail: repoLink.repo_full_name, timestamp: e.received_at });
    }
  }

  return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export interface BeforeAfterPlayback {
  start: { label: string; timestamp: string };
  milestones: EvidenceEvent[];
  failures: EvidenceEvent[];
  fixes: EvidenceEvent[];
  final: { label: string; timestamp: string } | null;
}

export async function getBeforeAfterPlayback(userId: string, portfolioItemId: string): Promise<BeforeAfterPlayback | null> {
  const supabase = supabaseAdmin();
  const { data: item } = await supabase
    .from("portfolio_items")
    .select("id, title, created_at")
    .eq("id", portfolioItemId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!item) return null;

  const timeline = await getEvidenceTimeline(userId, portfolioItemId);
  const milestones = timeline.filter((e) => e.type === "checkpoint" || e.type === "case_study_approved");
  const failures = timeline.filter((e) => e.type === "verification_fail");
  const fixes = timeline.filter((e) => e.type === "verification_pass");
  const final = timeline.length > 0 ? { label: timeline[timeline.length - 1].label, timestamp: timeline[timeline.length - 1].timestamp } : null;

  return {
    start: { label: `Started "${item.title}"`, timestamp: item.created_at },
    milestones,
    failures,
    fixes,
    final,
  };
}
