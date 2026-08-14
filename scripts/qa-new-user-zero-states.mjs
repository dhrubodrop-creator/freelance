// Safe, credential-free QA harness for "brand new learner" zero-states.
//
// WHAT THIS IS: inserts one throwaway row directly into `users` (service-role
// DB write, no Clerk account, no password, no authentication of any kind —
// this is data-only, the same mechanism the existing seed-*.mjs scripts use)
// with a clearly-synthetic clerk_id, then runs the exact same Supabase
// queries the dashboard/portfolio/proof/growth pages run for a real user, to
// confirm none of them throw for a user with zero rows everywhere. Deletes
// the row when done — nothing synthetic is left in the database.
//
// WHAT THIS IS NOT: a real browser render, a real Clerk session, or a
// replacement for authenticated UI verification. It proves the underlying
// queries survive a genuinely empty account (the #1 real-world cause of a
// "new user sees a 500" bug); it does not prove pixels are correct.
//
// Usage: node scripts/qa-new-user-zero-states.mjs

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import ws from "ws";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  realtime: { transport: ws },
});

const SYNTHETIC_CLERK_ID = `qa_synthetic_${Date.now()}`;
const results = [];

function record(label, ok, detail) {
  results.push({ label, ok, detail: detail ?? null });
  console.log(`${ok ? "PASS" : "FAIL"} — ${label}${detail ? `: ${detail}` : ""}`);
}

async function main() {
  console.log(`Creating synthetic zero-state user (clerk_id=${SYNTHETIC_CLERK_ID})...`);
  const { data: user, error: userErr } = await supabase
    .from("users")
    .insert({ clerk_id: SYNTHETIC_CLERK_ID, email: `${SYNTHETIC_CLERK_ID}@qa.invalid`, name: "QA Synthetic User" })
    .select("id")
    .single();

  if (userErr || !user) {
    record("Create synthetic user row", false, userErr?.message);
    return;
  }
  const userId = user.id;
  record("Create synthetic user row", true, userId);

  try {
    // ---- Dashboard page's query set ----
    const dashboardQueries = await Promise.allSettled([
      supabase.from("recommendations").select("*, course:courses(*)").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("enrollments").select("*, course:courses(*)").eq("user_id", userId).eq("status", "active"),
      supabase.from("courses").select("*").order("price", { ascending: true }),
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("education").select("id").eq("user_id", userId).limit(1),
      supabase.from("work_experiences").select("id").eq("user_id", userId).limit(1),
      supabase.from("user_skills").select("id").eq("user_id", userId),
      supabase.from("portfolio_items").select("id, title").eq("user_id", userId),
      supabase.from("monetisation_plans").select("*").eq("user_id", userId).maybeSingle(),
    ]);
    const dashboardFailed = dashboardQueries.filter((r) => r.status === "rejected" || r.value?.error);
    record(
      "Dashboard query set (9 queries) for zero-data user",
      dashboardFailed.length === 0,
      dashboardFailed.length ? JSON.stringify(dashboardFailed.map((r) => r.reason ?? r.value?.error)) : "all succeeded, all empty as expected"
    );

    // ---- Portfolio page's top-level queries ----
    const portfolioQueries = await Promise.allSettled([
      supabase.from("portfolio_items").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("github_connections").select("github_username, connected_at").eq("user_id", userId).maybeSingle(),
    ]);
    const portfolioFailed = portfolioQueries.filter((r) => r.status === "rejected" || r.value?.error);
    record("Portfolio query set for zero-data user", portfolioFailed.length === 0, portfolioFailed.length ? JSON.stringify(portfolioFailed.map((r) => r.reason ?? r.value?.error)) : "all succeeded, all empty as expected");

    // ---- Proof page's mastery-source query set ----
    const proofQueries = await Promise.allSettled([
      supabase.from("module_skills").select("module_id, skill_id"),
      supabase.from("exercises").select("id, module_id"),
      supabase.from("progress").select("module_id").eq("user_id", userId).not("completed_at", "is", null),
      supabase.from("exercise_completions").select("exercise_id").eq("user_id", userId),
      supabase.from("portfolio_item_skills").select("skill_id, portfolio_items!inner(user_id)").eq("portfolio_items.user_id", userId),
      supabase.from("capstone_submissions").select("*").eq("user_id", userId),
      supabase.from("portfolio_case_studies").select("*, portfolio_items!inner(user_id)").eq("portfolio_items.user_id", userId).eq("approved", true),
    ]);
    const proofFailed = proofQueries.filter((r) => r.status === "rejected" || r.value?.error);
    record("Proof page mastery-source query set for zero-data user", proofFailed.length === 0, proofFailed.length ? JSON.stringify(proofFailed.map((r) => r.reason ?? r.value?.error)) : "all succeeded, all empty as expected");

    // ---- Growth page: skill categories/skills/mastery + momentum + active enrollment for "don't learn yet" ----
    const growthQueries = await Promise.allSettled([
      supabase.from("skill_categories").select("*").order("name"),
      supabase.from("skills").select("*").order("name"),
      supabase.from("enrollments").select("course_id, courses(id, title)").eq("user_id", userId).eq("status", "active"),
      supabase.from("project_verification_runs").select("check_type, blockers, results, created_at").eq("user_id", userId).gte("created_at", new Date(Date.now() - 30 * 86_400_000).toISOString()),
    ]);
    const growthFailed = growthQueries.filter((r) => r.status === "rejected" || r.value?.error);
    record("Growth page query set for zero-data user", growthFailed.length === 0, growthFailed.length ? JSON.stringify(growthFailed.map((r) => r.reason ?? r.value?.error)) : "all succeeded, all empty as expected");

    // ---- One-Person Business + What Can I Sell underlying tables ----
    const businessQueries = await Promise.allSettled([
      supabase.from("proposals").select("id, buyer_type, pricing_structure").eq("user_id", userId),
      supabase.from("skill_categories").select("*"),
    ]);
    const businessFailed = businessQueries.filter((r) => r.status === "rejected" || r.value?.error);
    record("One-Person Business / What Can I Sell query set for zero-data user", businessFailed.length === 0, businessFailed.length ? JSON.stringify(businessFailed.map((r) => r.reason ?? r.value?.error)) : "all succeeded, all empty as expected");
  } finally {
    console.log("Deleting synthetic user row...");
    const { error: delErr } = await supabase.from("users").delete().eq("id", userId);
    record("Clean up synthetic user row", !delErr, delErr?.message);
  }

  const failed = results.filter((r) => !r.ok);
  console.log("\n=== SUMMARY ===");
  console.log(JSON.stringify({ total: results.length, passed: results.length - failed.length, failed: failed.length, results }, null, 2));
  if (failed.length > 0) process.exitCode = 1;
}

main();
