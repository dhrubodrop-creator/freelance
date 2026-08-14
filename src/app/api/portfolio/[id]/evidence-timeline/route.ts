import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { supabaseAdmin } from "@/lib/supabase/server";
import { getBeforeAfterPlayback, getEvidenceTimeline } from "@/lib/evidence-timeline";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const mode = new URL(req.url).searchParams.get("mode");

  const supabase = supabaseAdmin();
  const { data: user } = await supabase.from("users").select("id").eq("clerk_id", userId).maybeSingle();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (mode === "playback") {
    const playback = await getBeforeAfterPlayback(user.id, id);
    return NextResponse.json({ playback });
  }
  const timeline = await getEvidenceTimeline(user.id, id);
  return NextResponse.json({ timeline });
}
