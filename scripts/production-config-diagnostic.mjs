// Read-only external-configuration diagnostic. Never prints secret values —
// only checks key PREFIXES/presence, which is enough to tell test vs. live
// mode without exposing anything sensitive. Safe to run any time.
//
// Usage: node scripts/production-config-diagnostic.mjs

import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")];
    })
);

const results = [];
function check(label, status, detail) {
  results.push({ label, status, detail });
  const icon = status === "PASS" ? "PASS" : status === "ACTION REQUIRED" ? "ACTION REQUIRED" : "NOT SET";
  console.log(`${icon} — ${label}${detail ? `: ${detail}` : ""}`);
}

console.log("=== ROPES PRODUCTION CONFIGURATION DIAGNOSTIC ===\n");

// --- Clerk ---
const pk = env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
const sk = env.CLERK_SECRET_KEY ?? "";
if (!pk || !sk) {
  check("CLERK PRODUCTION CONFIGURATION", "NOT SET", "publishable/secret key missing from .env.local");
} else if (pk.startsWith("pk_live_") && sk.startsWith("sk_live_")) {
  check("CLERK PRODUCTION CONFIGURATION", "PASS", "live keys configured");
} else if (pk.startsWith("pk_test_") || sk.startsWith("sk_test_")) {
  check(
    "CLERK PRODUCTION CONFIGURATION",
    "ACTION REQUIRED",
    "test-mode keys are in use — the owner must activate the Clerk Production instance in the Clerk Dashboard and put pk_live_/sk_live_ into Vercel env vars. This cannot be done from code — it requires the owner's own Clerk Dashboard login."
  );
} else {
  check("CLERK PRODUCTION CONFIGURATION", "ACTION REQUIRED", "key prefix not recognized as pk_live_/pk_test_ — verify manually");
}

// --- GitHub OAuth ---
if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
  check("GITHUB OAUTH CONFIGURATION", "PASS", "GITHUB_CLIENT_ID/SECRET are set");
} else {
  check(
    "GITHUB OAUTH CONFIGURATION",
    "ACTION REQUIRED",
    "GITHUB_CLIENT_ID/GITHUB_CLIENT_SECRET are not set. Owner must register a GitHub OAuth App (callback URL: <SITE_URL>/api/github/callback, scope: repo read:user) and set these two env vars. Repo-creation code (src/lib/github.ts createProjectRepository) is ready and will work the moment these are set."
  );
}
if (env.GITHUB_WEBHOOK_SECRET) {
  check("GITHUB WEBHOOK CONFIGURATION", "PASS", "GITHUB_WEBHOOK_SECRET is set");
} else {
  check("GITHUB WEBHOOK CONFIGURATION", "ACTION REQUIRED", "GITHUB_WEBHOOK_SECRET not set — inbound webhook route fails closed (returns 500) until configured, by design");
}

// --- Razorpay ---
if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET) {
  const live = env.RAZORPAY_KEY_ID.startsWith("rzp_live_");
  check("RAZORPAY CONFIGURATION", live ? "PASS" : "ACTION REQUIRED", live ? "live key configured" : `key id prefix: ${env.RAZORPAY_KEY_ID.slice(0, 8)}... — verify this is the live key, not test`);
} else {
  check("RAZORPAY CONFIGURATION", "NOT SET", "RAZORPAY_KEY_ID/SECRET missing from .env.local");
}

// --- Cerebras (AI provider) ---
if (env.CEREBRAS_API_KEY) {
  check("CEREBRAS AI PROVIDER", "PASS", `model=${env.CEREBRAS_MODEL ?? "gpt-oss-120b (default)"}`);
} else {
  check("CEREBRAS AI PROVIDER", "ACTION REQUIRED", "CEREBRAS_API_KEY not set — all AI features will fail gracefully (existing degradation UX handles this) but none will work");
}

console.log("\n=== SUMMARY ===");
console.log(JSON.stringify(results, null, 2));
