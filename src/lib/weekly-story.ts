import "server-only";

import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * Section 44 — Weekly Build Story. Fully deterministic (no AI call) — every
 * category maps directly to a real, already-classified event type, so
 * there's nothing for an LLM to add except narrative flourish, which isn't
 * worth the extra API call/cost per the brief's AI-cost-control principle.
 */
export interface WeeklyBuildStory {
  windowStart: string;
  built: string[];
  failed: string[];
  fixed: string[];
  learned: string[];
  next: string[];
}

export async function generateWeeklyBuildStory(userId: string): Promise<WeeklyBuildStory> {
  const supabase = supabaseAdmin();
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString();

  const [{ data: checkpoints }, { data: decisions }, { data: runs }, { data: rescues }, { data: progress }, { data: mission }] = await Promise.all([
    supabase.from("project_checkpoints").select("label, portfolio_items!inner(user_id)").eq("portfolio_items.user_id", userId).gte("created_at", since),
    supabase.from("project_decisions").select("decision, portfolio_items!inner(user_id)").eq("portfolio_items.user_id", userId).gte("created_at", since),
    supabase.from("project_verification_runs").select("check_type, blockers, results").eq("user_id", userId).gte("created_at", since),
    supabase.from("concept_rescue_requests").select("module_id, modules(title)").eq("user_id", userId).gte("created_at", since),
    supabase.from("progress").select("module_id, modules(title)").eq("user_id", userId).not("completed_at", "is", null).gte("completed_at", since),
    supabase.from("daily_missions").select("objective").eq("user_id", userId).eq("status", "pending").order("mission_date", { ascending: false }).limit(1).maybeSingle(),
  ]);

  const built = [
    ...(checkpoints ?? []).map((c) => c.label),
    ...(decisions ?? []).map((d) => `Decided: ${d.decision}`),
  ];

  const runRows = runs ?? [];
  const failed = runRows
    .filter((r) => Array.isArray(r.blockers) && r.blockers.length > 0)
    .map((r) => `${r.check_type.replace(/_/g, " ")}: ${r.blockers[0]}`);
  const fixed = runRows
    .filter((r) => r.check_type === "failure_replay" && (r.results as { resolved?: boolean } | null)?.resolved)
    .map(() => "Fixed a previously failing check");

  const learned = [
    ...(rescues ?? []).map((r) => `Worked through a concept in ${(r.modules as unknown as { title?: string })?.title ?? "a module"}`),
    ...(progress ?? []).map((p) => `Completed module: ${(p.modules as unknown as { title?: string })?.title ?? "a module"}`),
  ];

  const next = mission?.objective ? [mission.objective] : ["Check your dashboard for today's mission."];

  return { windowStart: since, built, failed, fixed, learned, next };
}
