import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { razorpay } from "@/lib/razorpay";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getDiscountedPrice } from "@/lib/pricing";
import { isMasterPromoCode } from "@/lib/promo";
import type { CourseRow } from "@/types/db";

const bodySchema = z.object({ courseSlug: z.string().min(1), promoCode: z.string().optional() });

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  if (isMasterPromoCode(parsed.data.promoCode)) {
    return NextResponse.json({ error: "Use the free-enrollment endpoint for this code" }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("slug", parsed.data.courseSlug)
    .maybeSingle();

  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  const typedCourse = course as CourseRow;
  // Price is always computed server-side from the standing discount — never trust a client-sent amount.
  const amountPaise = Math.round(getDiscountedPrice(Number(typedCourse.price), typedCourse.slug) * 100);

  const order = await razorpay.orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt: `${typedCourse.slug}-${userId}-${Date.now()}`,
    notes: { courseId: typedCourse.id, courseSlug: typedCourse.slug, clerkUserId: userId },
  });

  return NextResponse.json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    courseId: typedCourse.id,
    courseTitle: typedCourse.title,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
}
