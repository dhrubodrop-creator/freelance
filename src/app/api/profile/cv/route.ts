import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { supabaseAdmin } from "@/lib/supabase/server";

/** Standalone CV re-upload for the ongoing profile page — unlike the onboarding
 * POST /api/profile, this doesn't touch occupation/industry/etc. or regenerate
 * a recommendation; it only replaces the stored CV file. */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData().catch(() => null);
  const cvFile = formData?.get("cv");
  if (!(cvFile instanceof File) || cvFile.size === 0) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (cvFile.type !== "application/pdf") {
    return NextResponse.json({ error: "CV must be a PDF" }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { data: user } = await supabase.from("users").select("id").eq("clerk_id", userId).maybeSingle();
  if (!user) return NextResponse.json({ error: "User record not found — try refreshing." }, { status: 404 });

  const path = `${userId}/${Date.now()}-${cvFile.name}`;
  const { error: uploadError } = await supabase.storage
    .from("cv-uploads")
    .upload(path, await cvFile.arrayBuffer(), { contentType: "application/pdf", upsert: true });
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { error } = await supabase.from("profiles").upsert(
    { user_id: user.id, cv_file_url: path },
    { onConflict: "user_id" }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, path });
}
