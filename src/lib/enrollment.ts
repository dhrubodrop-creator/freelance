import "server-only";

import { supabaseAdmin } from "@/lib/supabase/server";
import { resend, FROM_EMAIL } from "@/lib/resend";
import type { CourseRow, UserRow } from "@/types/db";

/**
 * Idempotently marks an enrollment active and sends the access-granted
 * email exactly once. Called from both the client-side payment verify
 * route (fast path) and the Razorpay webhook (durable source of truth) —
 * whichever runs first does the work, the other is a no-op.
 */
export async function activateEnrollment(params: { userId: string; courseId: string; paymentId: string }) {
  const supabase = supabaseAdmin();

  const { data: existing } = await supabase
    .from("enrollments")
    .select("id, status")
    .eq("user_id", params.userId)
    .eq("course_id", params.courseId)
    .maybeSingle();

  const alreadyActive = existing?.status === "active";

  await supabase.from("enrollments").upsert(
    {
      user_id: params.userId,
      course_id: params.courseId,
      payment_id: params.paymentId,
      status: "active",
    },
    { onConflict: "user_id,course_id" }
  );

  if (alreadyActive) return;

  const [{ data: user }, { data: course }] = await Promise.all([
    supabase.from("users").select("*").eq("id", params.userId).maybeSingle(),
    supabase.from("courses").select("*").eq("id", params.courseId).maybeSingle(),
  ]);

  const typedUser = user as UserRow | null;
  const typedCourse = course as CourseRow | null;

  if (typedUser?.email && typedCourse) {
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: typedUser.email,
        subject: `You're in — ${typedCourse.title}`,
        html: `<p>Hi ${typedUser.name ?? "there"},</p>
<p>Your payment for <strong>${typedCourse.title}</strong> is confirmed and your course access is live.</p>
<p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/courses/${typedCourse.slug}/learn">Start your first module →</a></p>
<p>— The Ropes team</p>`,
      });
    } catch {
      // best-effort — don't fail enrollment activation on email delivery issues
    }
  }
}
