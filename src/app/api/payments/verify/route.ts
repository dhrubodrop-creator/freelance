import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { verifyRazorpayPaymentSignature } from "@/lib/razorpay";
import { supabaseAdmin } from "@/lib/supabase/server";
import { activateEnrollment } from "@/lib/enrollment";

const bodySchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
  courseId: z.string().uuid(),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, courseId } = parsed.data;

  const valid = verifyRazorpayPaymentSignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });

  if (!valid) return NextResponse.json({ error: "Signature verification failed" }, { status: 400 });

  const supabase = supabaseAdmin();
  const { data: user } = await supabase.from("users").select("id").eq("clerk_id", userId).maybeSingle();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  await activateEnrollment({ userId: user.id, courseId, paymentId: razorpay_payment_id });

  return NextResponse.json({ success: true });
}
