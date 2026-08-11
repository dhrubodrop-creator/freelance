import { NextResponse } from "next/server";

import { verifyRazorpaySignature } from "@/lib/razorpay";
import { supabaseAdmin } from "@/lib/supabase/server";
import { activateEnrollment } from "@/lib/enrollment";

/**
 * Durable fallback for enrollment activation — fires even if the buyer
 * closes their browser before the client-side verify call completes.
 * Idempotent alongside /api/payments/verify via activateEnrollment().
 */
export async function POST(req: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });

  const signature = req.headers.get("x-razorpay-signature");
  const body = await req.text();

  if (!signature || !verifyRazorpaySignature(body, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(body);

  if (event.event === "payment.captured" || event.event === "order.paid") {
    const payment = event.payload?.payment?.entity;
    const notes = payment?.notes ?? {};
    const clerkUserId: string | undefined = notes.clerkUserId;
    const courseId: string | undefined = notes.courseId;

    if (clerkUserId && courseId) {
      const supabase = supabaseAdmin();
      const { data: user } = await supabase.from("users").select("id").eq("clerk_id", clerkUserId).maybeSingle();
      if (user) {
        await activateEnrollment({ userId: user.id, courseId, paymentId: payment.id });
      }
    }
  }

  return NextResponse.json({ received: true });
}
