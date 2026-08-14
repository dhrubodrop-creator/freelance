import { NextResponse } from "next/server";

import { classifyGitHubEvent, findUserIdByRepo, isGitHubWebhookConfigured, recordGitHubEvent, verifyGitHubWebhookSignature } from "@/lib/github";

const SUPPORTED_EVENTS = new Set(["push", "pull_request", "workflow_run", "deployment_status"]);

/**
 * Fails closed when GITHUB_WEBHOOK_SECRET isn't set — same convention as
 * the Calendly webhook fix in this codebase (DECISIONS.md): an unsigned
 * request must never be silently processed just because the secret is
 * unconfigured.
 */
export async function POST(req: Request) {
  if (!isGitHubWebhookConfigured()) {
    console.error("[webhooks/github] GITHUB_WEBHOOK_SECRET is not configured — rejecting request");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const rawBody = await req.text();
  if (!verifyGitHubWebhookSignature(rawBody, req.headers.get("x-hub-signature-256"))) {
    console.warn("[webhooks/github] signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const eventType = req.headers.get("x-github-event");
  if (!eventType || !SUPPORTED_EVENTS.has(eventType)) {
    return NextResponse.json({ received: true });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Malformed request body" }, { status: 400 });
  }

  const repoFullName = (payload.repository as { full_name?: string } | undefined)?.full_name;
  if (!repoFullName) return NextResponse.json({ received: true });

  const userId = await findUserIdByRepo(repoFullName);
  if (!userId) return NextResponse.json({ received: true });

  const { summary, meaningful } = classifyGitHubEvent(eventType as "push" | "pull_request" | "workflow_run" | "deployment_status", payload);
  await recordGitHubEvent({
    userId,
    repoFullName,
    eventType: eventType as "push" | "pull_request" | "workflow_run" | "deployment_status",
    summary,
    meaningful,
    externalId: req.headers.get("x-github-delivery"),
  });

  return NextResponse.json({ received: true });
}
