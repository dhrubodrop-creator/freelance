import { NextResponse } from "next/server";
import crypto from "node:crypto";

import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * Verifies Calendly's v2 webhook signature: header `Calendly-Webhook-Signature`
 * carries `t=<timestamp>,v1=<hmac>` — the HMAC is SHA-256 over `${t}.${rawBody}`.
 */
function verifyCalendlySignature(rawBody: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=") as [string, string]));
  if (!parts.t || !parts.v1) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${parts.t}.${rawBody}`).digest("hex");
  const expectedBuf = Buffer.from(expected);
  // timingSafeEqual throws on a length mismatch rather than returning false —
  // guard it so a malformed/truncated v1 value rejects cleanly instead of crashing.
  let actualBuf: Buffer;
  try {
    actualBuf = Buffer.from(parts.v1);
  } catch {
    return false;
  }
  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

export async function POST(req: Request) {
  const secret = process.env.CALENDLY_WEBHOOK_SIGNING_KEY;
  if (!secret) {
    console.error("[webhooks/calendly] CALENDLY_WEBHOOK_SIGNING_KEY is not configured — rejecting request");
    return NextResponse.json({ error: "Webhook signing key not configured" }, { status: 500 });
  }

  const rawBody = await req.text();

  if (!verifyCalendlySignature(rawBody, req.headers.get("calendly-webhook-signature"), secret)) {
    console.warn("[webhooks/calendly] signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: {
    event?: string;
    payload?: {
      email?: string;
      event?: string;
      uri?: string;
      scheduled_event?: { start_time?: string };
    };
  };
  try {
    event = JSON.parse(rawBody);
  } catch {
    console.warn("[webhooks/calendly] malformed JSON body");
    return NextResponse.json({ error: "Malformed request body" }, { status: 400 });
  }
  const supabase = supabaseAdmin();
  const payload = event.payload ?? {};
  const inviteeEmail: string | undefined = payload.email;

  if (!inviteeEmail) return NextResponse.json({ received: true });

  const { data: user } = await supabase.from("users").select("id").eq("email", inviteeEmail).maybeSingle();
  if (!user) return NextResponse.json({ received: true });

  if (event.event === "invitee.created") {
    await supabase.from("sessions").insert({
      user_id: user.id,
      calendly_event_id: payload.event ?? payload.uri ?? null,
      scheduled_at: payload.scheduled_event?.start_time ?? null,
      status: "scheduled",
    });
  }

  if (event.event === "invitee.canceled") {
    await supabase
      .from("sessions")
      .update({ status: "cancelled" })
      .eq("user_id", user.id)
      .eq("calendly_event_id", payload.event ?? payload.uri ?? "");
  }

  return NextResponse.json({ received: true });
}
