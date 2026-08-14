import "server-only";

import { supabaseAdmin } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";

/**
 * Section 45 — Smart Celebrations. Deterministic detection of real,
 * concrete milestones (never invented), deduplicated via
 * celebrated_milestones so each fires exactly once. Kept useful and
 * concise, per the brief — one notification per milestone, not a barrage.
 */
const MILESTONE_DEFS = [
  { key: "first_deployment", title: "First deployment live", checkType: "performance" as const, predicate: (r: { results: Record<string, unknown> }) => Boolean((r.results as { checkedUrl?: string }).checkedUrl) },
  { key: "first_passing_eval", title: "First AI evaluation passed", checkType: "ai_evaluation" as const, predicate: (r: { results: Record<string, unknown> }) => (r.results as { verdict?: string }).verdict === "pass" },
  { key: "secured_endpoint", title: "Security check passed clean", checkType: "security" as const, predicate: (r: { blockers: string[] }) => r.blockers.length === 0 },
  { key: "recovered_incident", title: "Recovered from a failed check", checkType: "failure_replay" as const, predicate: (r: { results: Record<string, unknown> }) => (r.results as { resolved?: boolean }).resolved === true },
] as const;

export async function checkAndCelebrateMilestones(userId: string): Promise<string[]> {
  const supabase = supabaseAdmin();
  const { data: alreadyCelebrated } = await supabase.from("celebrated_milestones").select("milestone_key").eq("user_id", userId);
  const celebratedKeys = new Set((alreadyCelebrated ?? []).map((c) => c.milestone_key));

  const newlyCelebrated: string[] = [];

  for (const def of MILESTONE_DEFS) {
    if (celebratedKeys.has(def.key)) continue;
    const { data: runs } = await supabase
      .from("project_verification_runs")
      .select("results, blockers")
      .eq("user_id", userId)
      .eq("check_type", def.checkType)
      .order("created_at", { ascending: true })
      .limit(20);
    const hit = (runs ?? []).find((r) => def.predicate(r as never));
    if (!hit) continue;

    const { error } = await supabase.from("celebrated_milestones").insert({ user_id: userId, milestone_key: def.key });
    if (error) continue; // race with another request — don't double-celebrate
    await createNotification(userId, "celebration", def.title, undefined, "/portfolio");
    newlyCelebrated.push(def.key);
  }

  const { data: capstoneReviewed } = await supabase
    .from("capstone_submissions")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "reviewed")
    .limit(1);
  if (capstoneReviewed?.length && !celebratedKeys.has("first_capstone")) {
    const { error } = await supabase.from("celebrated_milestones").insert({ user_id: userId, milestone_key: "first_capstone" });
    if (!error) {
      await createNotification(userId, "celebration", "Capstone completed", undefined, "/proof");
      newlyCelebrated.push("first_capstone");
    }
  }

  return newlyCelebrated;
}
