import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { razorpay } from "@/lib/razorpay";
import { ENABLE_RETAINER_SUBSCRIPTIONS } from "@/lib/constants";

/**
 * Retainer-tier recurring subscription via Razorpay Subscriptions.
 * Gated behind NEXT_PUBLIC_ENABLE_RETAINER_SUBSCRIPTIONS — Razorpay
 * recurring billing needs a live (non-test) business account to activate
 * a plan, so this ships as a real, working code path that stays off by
 * default until a RAZORPAY_RETAINER_PLAN_ID is configured (see DECISIONS.md).
 */
export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!ENABLE_RETAINER_SUBSCRIPTIONS) {
    return NextResponse.json({ error: "Retainer subscriptions aren't open yet." }, { status: 400 });
  }

  const planId = process.env.RAZORPAY_RETAINER_PLAN_ID;
  if (!planId) {
    return NextResponse.json({ error: "Retainer plan isn't configured." }, { status: 500 });
  }

  const subscription = await razorpay.subscriptions.create({
    plan_id: planId,
    customer_notify: 1,
    total_count: 12,
    notes: { clerkUserId: userId },
  });

  return NextResponse.json({
    subscriptionId: subscription.id,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
}
