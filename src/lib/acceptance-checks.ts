import "server-only";

import { supabaseAdmin } from "@/lib/supabase/server";
import type { AcceptanceCheckRow, AcceptanceCheckType } from "@/types/db";

/**
 * Section 17 — Executable Definition of Done. `http_200`/`http_auth_rejects`/
 * `deployment_live` are genuinely auto-verified with a real outbound fetch
 * to a URL the learner supplies — never learner code execution on the Ropes
 * server (brief's security principle). `manual` criteria are explicitly
 * self-attested and the UI must never present them as machine-verified.
 */
export async function createAcceptanceCheck(input: {
  userId: string;
  portfolioItemId: string;
  description: string;
  checkType: AcceptanceCheckType;
  targetUrl?: string | null;
}): Promise<AcceptanceCheckRow | null> {
  const supabase = supabaseAdmin();
  const { data: item } = await supabase
    .from("portfolio_items")
    .select("id")
    .eq("id", input.portfolioItemId)
    .eq("user_id", input.userId)
    .maybeSingle();
  if (!item) return null;

  const { data, error } = await supabase
    .from("acceptance_checks")
    .insert({
      portfolio_item_id: input.portfolioItemId,
      description: input.description,
      check_type: input.checkType,
      target_url: input.targetUrl ?? null,
    })
    .select("*")
    .single();
  if (error) return null;
  return data as AcceptanceCheckRow;
}

export async function listAcceptanceChecks(userId: string, portfolioItemId: string): Promise<AcceptanceCheckRow[]> {
  const supabase = supabaseAdmin();
  const { data: item } = await supabase
    .from("portfolio_items")
    .select("id")
    .eq("id", portfolioItemId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!item) return [];
  const { data } = await supabase
    .from("acceptance_checks")
    .select("*")
    .eq("portfolio_item_id", portfolioItemId)
    .order("order_index");
  return (data ?? []) as AcceptanceCheckRow[];
}

/** Runs the real HTTP check for one criterion. Times out at 8s so a slow/dead target can't hang the request. */
export async function runAcceptanceCheck(userId: string, checkId: string): Promise<AcceptanceCheckRow | null> {
  const supabase = supabaseAdmin();
  const { data: check } = await supabase
    .from("acceptance_checks")
    .select("*, portfolio_items!inner(user_id)")
    .eq("id", checkId)
    .maybeSingle();
  if (!check || (check as unknown as { portfolio_items: { user_id: string } }).portfolio_items.user_id !== userId) {
    return null;
  }
  const row = check as unknown as AcceptanceCheckRow;

  if (row.check_type === "manual") return row;
  if (!row.target_url) return row;

  let pass = false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(row.target_url, { method: "GET", redirect: "follow", signal: controller.signal });
    clearTimeout(timeout);
    if (row.check_type === "http_200" || row.check_type === "deployment_live") {
      pass = res.status >= 200 && res.status < 400;
    } else if (row.check_type === "http_auth_rejects") {
      pass = res.status === 401 || res.status === 403 || res.status === 302 || res.status === 307;
    }
  } catch {
    pass = false;
  }

  const { data: updated, error } = await supabase
    .from("acceptance_checks")
    .update({ last_result: pass ? "pass" : "fail", last_checked_at: new Date().toISOString() })
    .eq("id", checkId)
    .select("*")
    .single();
  if (error) return null;
  return updated as AcceptanceCheckRow;
}

export async function setSelfAttested(userId: string, checkId: string, value: boolean): Promise<boolean> {
  const supabase = supabaseAdmin();
  const { data: check } = await supabase
    .from("acceptance_checks")
    .select("id, portfolio_items!inner(user_id)")
    .eq("id", checkId)
    .maybeSingle();
  if (!check || (check as unknown as { portfolio_items: { user_id: string } }).portfolio_items.user_id !== userId) {
    return false;
  }
  const { error } = await supabase.from("acceptance_checks").update({ self_attested: value }).eq("id", checkId);
  return !error;
}
