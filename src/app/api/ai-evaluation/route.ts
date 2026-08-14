import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { supabaseAdmin } from "@/lib/supabase/server";
import { listEvalRuns } from "@/lib/ai-evaluation";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const portfolioItemId = url.searchParams.get("portfolioItemId") ?? undefined;
  const featureName = url.searchParams.get("featureName") ?? undefined;

  const supabase = supabaseAdmin();
  const { data: user } = await supabase.from("users").select("id").eq("clerk_id", userId).maybeSingle();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const runs = await listEvalRuns(user.id, portfolioItemId, featureName);
  return NextResponse.json({ runs });
}
