import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { supabaseAdmin } from "@/lib/supabase/server";
import { disconnectGitHub } from "@/lib/github";

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = supabaseAdmin();
  const { data: user } = await supabase.from("users").select("id").eq("clerk_id", userId).maybeSingle();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const ok = await disconnectGitHub(user.id);
  if (!ok) return NextResponse.json({ error: "Couldn't disconnect" }, { status: 500 });
  return NextResponse.json({ success: true });
}
