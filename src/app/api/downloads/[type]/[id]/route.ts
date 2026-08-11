import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: Request, { params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (type !== "playbook" && type !== "template") {
    return NextResponse.json({ error: "Unknown resource type" }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { data: user } = await supabase.from("users").select("id").eq("clerk_id", userId).maybeSingle();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  let courseId: string | null = null;
  let fileUrl: string | null = null;

  if (type === "playbook") {
    const { data: playbook } = await supabase.from("playbooks").select("course_id, file_url").eq("id", id).maybeSingle();
    courseId = playbook?.course_id ?? null;
    fileUrl = playbook?.file_url ?? null;
  } else {
    const { data: template } = await supabase
      .from("templates")
      .select("file_url, module:modules(course_id)")
      .eq("id", id)
      .maybeSingle();
    fileUrl = template?.file_url ?? null;
    courseId = (template?.module as { course_id?: string } | null)?.course_id ?? null;
  }

  if (!courseId || !fileUrl) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .eq("status", "active")
    .maybeSingle();
  if (!enrollment) return NextResponse.json({ error: "Not enrolled in this course" }, { status: 403 });

  const { data: signed, error } = await supabase.storage.from("course-content").createSignedUrl(fileUrl, 60);
  if (error || !signed) return NextResponse.json({ error: "Could not generate download link" }, { status: 500 });

  return NextResponse.redirect(signed.signedUrl);
}
