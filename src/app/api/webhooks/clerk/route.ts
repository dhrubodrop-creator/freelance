import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/nextjs/server";

import { supabaseAdmin } from "@/lib/supabase/server";
import { logEvent } from "@/lib/analytics";
import { provisionAppUser } from "@/lib/user-provisioning";

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const headerList = await headers();
  const svixId = headerList.get("svix-id");
  const svixTimestamp = headerList.get("svix-timestamp");
  const svixSignature = headerList.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const body = await req.text();
  const webhook = new Webhook(secret);

  let event: WebhookEvent;
  try {
    event = webhook.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = supabaseAdmin();

  if (event.type === "user.created" || event.type === "user.updated") {
    const user = event.data;
    const primaryEmail = user.email_addresses?.find(
      (e) => e.id === user.primary_email_address_id
    )?.email_address;
    const primaryPhone = user.phone_numbers?.find(
      (p) => p.id === user.primary_phone_number_id
    )?.phone_number;
    const name = [user.first_name, user.last_name].filter(Boolean).join(" ") || null;

    try {
      const syncedUser = await provisionAppUser(
        {
          clerkId: user.id,
          name,
          email: primaryEmail ?? null,
          phone: primaryPhone ?? null,
        },
        "clerk_webhook"
      );
      if (event.type === "user.created") {
        await logEvent(syncedUser.id, "signup", { source: "clerk_webhook" });
      }
    } catch {
      return NextResponse.json({ error: "User synchronization failed" }, { status: 500 });
    }
  }

  if (event.type === "user.deleted" && event.data.id) {
    const { error } = await supabase.from("users").delete().eq("clerk_id", event.data.id);
    if (error) return NextResponse.json({ error: "User deletion synchronization failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
