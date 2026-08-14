import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { supabaseAdmin } from "@/lib/supabase/server";
import { getOrCreateDailyMission, regenerateDailyMission } from "@/lib/daily-mission";

/** Returns today's Daily Mission, generating one from real progress signals if none exists yet. */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = supabaseAdmin();
  const { data: user } = await supabase.from("users").select("id").eq("clerk_id", userId).maybeSingle();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const mission = await getOrCreateDailyMission(user.id);
  return NextResponse.json({ mission });
}

/** Forces a fresh mission for today; refuses to clobber one already in progress or completed. */
export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = supabaseAdmin();
  const { data: user } = await supabase.from("users").select("id").eq("clerk_id", userId).maybeSingle();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const mission = await regenerateDailyMission(user.id);
  if (!mission) {
    return NextResponse.json({ error: "Today's mission is already in progress or completed" }, { status: 409 });
  }
  return NextResponse.json({ mission });
}
