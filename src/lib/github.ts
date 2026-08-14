import "server-only";
import crypto from "crypto";

import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * GitHub OAuth + webhook integration. No GitHub OAuth App is registered for
 * this deployment yet — `isGitHubConfigured()` gates every entry point so
 * the feature honestly reports "not connected, owner setup required"
 * instead of faking a successful connection (brief section 6/50). Every
 * function below is real, working code, ready to go live the moment
 * GITHUB_CLIENT_ID/GITHUB_CLIENT_SECRET are set in the environment.
 */

export function isGitHubConfigured(): boolean {
  return Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
}

export function isGitHubWebhookConfigured(): boolean {
  return Boolean(process.env.GITHUB_WEBHOOK_SECRET);
}

export function buildGitHubAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID as string,
    redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/github/callback`,
    scope: "repo read:user",
    state,
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export async function exchangeCodeForAccessToken(code: string): Promise<string | null> {
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/github/callback`,
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { access_token?: string };
  return data.access_token ?? null;
}

export async function fetchGitHubUsername(accessToken: string): Promise<string | null> {
  const res = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/vnd.github+json" },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { login?: string };
  return data.login ?? null;
}

export async function saveGitHubConnection(userId: string, accessToken: string, githubUsername: string): Promise<boolean> {
  const supabase = supabaseAdmin();
  const { error } = await supabase.from("github_connections").upsert(
    {
      user_id: userId,
      github_username: githubUsername,
      access_token: accessToken,
      scopes: ["repo", "read:user"],
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  return !error;
}

/** Never returns access_token — this is the only path the UI/API should read a connection through. */
export async function getGitHubConnectionSummary(
  userId: string
): Promise<{ githubUsername: string; scopes: string[]; connectedAt: string } | null> {
  const supabase = supabaseAdmin();
  const { data } = await supabase
    .from("github_connections")
    .select("github_username, scopes, connected_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return null;
  return { githubUsername: data.github_username, scopes: data.scopes, connectedAt: data.connected_at };
}

export async function disconnectGitHub(userId: string): Promise<boolean> {
  const supabase = supabaseAdmin();
  const { error } = await supabase.from("github_connections").delete().eq("user_id", userId);
  return !error;
}

export async function linkRepoToProject(userId: string, portfolioItemId: string, repoFullName: string): Promise<boolean> {
  const supabase = supabaseAdmin();
  const { data: item } = await supabase
    .from("portfolio_items")
    .select("id")
    .eq("id", portfolioItemId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!item) return false;

  const { error } = await supabase.from("github_repo_links").upsert(
    { portfolio_item_id: portfolioItemId, user_id: userId, repo_full_name: repoFullName },
    { onConflict: "portfolio_item_id" }
  );
  return !error;
}

/** Same length-check-before-timingSafeEqual pattern as verifyRazorpaySignature — a malformed header must 400, not crash to 500. */
function safeEqual(expectedHex: string, actualHex: string): boolean {
  const expected = Buffer.from(expectedHex);
  let actual: Buffer;
  try {
    actual = Buffer.from(actualHex);
  } catch {
    return false;
  }
  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
}

/**
 * Fails closed when the secret isn't configured — the Calendly webhook had
 * exactly the inverse (fail-open) bug in this codebase before (see
 * DECISIONS.md, "Webhook signature hardening"); this must not repeat it.
 */
export function verifyGitHubWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) return false;
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqual(expected, signatureHeader.slice("sha256=".length));
}

/**
 * Not every push is proof of work — a force-push with no real commits, or a
 * closed-but-not-merged PR, isn't evidence. Deliberately conservative: when
 * in doubt, `meaningful: false` — the brief's "don't count every commit as
 * proof of mastery" instruction.
 */
export function classifyGitHubEvent(
  eventType: "push" | "pull_request" | "workflow_run" | "deployment_status",
  payload: Record<string, unknown>
): { summary: string; meaningful: boolean } {
  if (eventType === "push") {
    const commits = Array.isArray(payload.commits) ? (payload.commits as { message?: string }[]) : [];
    const realCommits = commits.filter((c) => c.message && !/^(wip|test|tmp|\.)$/i.test(c.message.trim()));
    return {
      summary: `Pushed ${commits.length} commit${commits.length === 1 ? "" : "s"} to ${String(payload.ref ?? "a branch")}`,
      meaningful: realCommits.length > 0,
    };
  }
  if (eventType === "pull_request") {
    const action = String(payload.action ?? "");
    const merged = Boolean((payload.pull_request as { merged?: boolean } | undefined)?.merged);
    return {
      summary: `Pull request ${action}${merged ? " (merged)" : ""}`,
      meaningful: action === "opened" || merged,
    };
  }
  if (eventType === "workflow_run") {
    const conclusion = String((payload.workflow_run as { conclusion?: string } | undefined)?.conclusion ?? "");
    return { summary: `Workflow run: ${conclusion || "in progress"}`, meaningful: conclusion === "success" };
  }
  const state = String(payload.state ?? "");
  return { summary: `Deployment status: ${state || "unknown"}`, meaningful: state === "success" };
}

export async function recordGitHubEvent(input: {
  userId: string;
  repoFullName: string;
  eventType: "push" | "pull_request" | "workflow_run" | "deployment_status";
  summary: string;
  meaningful: boolean;
  externalId: string | null;
}): Promise<void> {
  const supabase = supabaseAdmin();
  await supabase.from("github_events").upsert(
    {
      user_id: input.userId,
      repo_full_name: input.repoFullName,
      event_type: input.eventType,
      summary: input.summary,
      meaningful: input.meaningful,
      external_id: input.externalId,
    },
    { onConflict: "repo_full_name,event_type,external_id", ignoreDuplicates: true }
  );
}

/** Returns the raw access token for server-side GitHub API calls only — never return this from an API route. */
export async function getRawAccessToken(userId: string): Promise<string | null> {
  const supabase = supabaseAdmin();
  const { data } = await supabase.from("github_connections").select("access_token").eq("user_id", userId).maybeSingle();
  return data?.access_token ?? null;
}

/** Fetches real file content from a repo the learner has connected — grounds Explain-My-Code/Debug-This in actual code, never invented. */
export async function fetchRepoFileContent(accessToken: string, repoFullName: string, path: string): Promise<string | null> {
  const res = await fetch(`https://api.github.com/repos/${repoFullName}/contents/${encodeURI(path)}`, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/vnd.github+json" },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { content?: string; encoding?: string; size?: number };
  if (!data.content || data.encoding !== "base64") return null;
  if ((data.size ?? 0) > 200_000) return null; // keep prompt-safe; don't feed huge files into the AI router
  return Buffer.from(data.content, "base64").toString("utf8");
}

export async function findUserIdByRepo(repoFullName: string): Promise<string | null> {
  const supabase = supabaseAdmin();
  const { data } = await supabase
    .from("github_repo_links")
    .select("user_id")
    .eq("repo_full_name", repoFullName)
    .maybeSingle();
  return data?.user_id ?? null;
}
