import "server-only";

import { supabaseAdmin } from "@/lib/supabase/server";
import type { ProjectVerificationRunRow, VerificationCheckType } from "@/types/db";

/** Shared insert/list helpers for every automated-check type (Phases 7-10) — see migration 0021 for why these share one table. */
export async function recordVerificationRun(input: {
  userId: string;
  portfolioItemId?: string | null;
  checkType: VerificationCheckType;
  inputSummary: string;
  results: Record<string, unknown>;
  score?: number | null;
  blockers?: string[];
}): Promise<ProjectVerificationRunRow | null> {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("project_verification_runs")
    .insert({
      user_id: input.userId,
      portfolio_item_id: input.portfolioItemId ?? null,
      check_type: input.checkType,
      input_summary: input.inputSummary,
      results: input.results,
      score: input.score ?? null,
      blockers: input.blockers ?? [],
    })
    .select("*")
    .single();
  if (error) return null;
  return data as ProjectVerificationRunRow;
}

export async function listVerificationRuns(
  userId: string,
  filters: { portfolioItemId?: string; checkType?: VerificationCheckType } = {}
): Promise<ProjectVerificationRunRow[]> {
  const supabase = supabaseAdmin();
  let query = supabase.from("project_verification_runs").select("*").eq("user_id", userId);
  if (filters.portfolioItemId) query = query.eq("portfolio_item_id", filters.portfolioItemId);
  if (filters.checkType) query = query.eq("check_type", filters.checkType);
  const { data } = await query.order("created_at", { ascending: false });
  return (data ?? []) as ProjectVerificationRunRow[];
}

export async function latestVerificationRun(
  userId: string,
  portfolioItemId: string,
  checkType: VerificationCheckType
): Promise<ProjectVerificationRunRow | null> {
  const supabase = supabaseAdmin();
  const { data } = await supabase
    .from("project_verification_runs")
    .select("*")
    .eq("user_id", userId)
    .eq("portfolio_item_id", portfolioItemId)
    .eq("check_type", checkType)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as ProjectVerificationRunRow | null) ?? null;
}
