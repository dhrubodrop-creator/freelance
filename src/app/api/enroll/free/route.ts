import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabase/server";
import { isMasterPromoCode } from "@/lib/promo";
import { activateEnrollment } from "@/lib/enrollment";

const bodySchema = z.object({ courseSlug: z.string().min(1), promoCode: z.string().min(1) });

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  if (!isMasterPromoCode(parsed.data.promoCode)) {
    return NextResponse.json({ error: "That code isn't valid" }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const [{ data: user }, { data: course }] = await Promise.all([
    supabase.from("users").select("id").eq("clerk_id", userId).maybeSingle(),
    supabase.from("courses").select("id").eq("slug", parsed.data.courseSlug).maybeSingle(),
  ]);

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  await activateEnrollment({ userId: user.id, courseId: course.id, paymentId: `promo:${Date.now()}` });

  return NextResponse.json({ success: true });
}
