import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabase/server";

const bodySchema = z.object({ moduleId: z.string().uuid() });

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const supabase = supabaseAdmin();
  const { data: user } = await supabase.from("users").select("id").eq("clerk_id", userId).maybeSingle();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { data: module } = await supabase
    .from("modules")
    .select("id, course_id")
    .eq("id", parsed.data.moduleId)
    .maybeSingle();
  if (!module) return NextResponse.json({ error: "Module not found" }, { status: 404 });

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", module.course_id)
    .eq("status", "active")
    .maybeSingle();
  if (!enrollment) return NextResponse.json({ error: "Not enrolled in this course" }, { status: 403 });

  await supabase
    .from("progress")
    .upsert(
      { user_id: user.id, module_id: parsed.data.moduleId, completed_at: new Date().toISOString() },
      { onConflict: "user_id,module_id" }
    );

  return NextResponse.json({ success: true });
}
