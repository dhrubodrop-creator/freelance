import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { supabaseAdmin } from "@/lib/supabase/server";
import { generateRecommendation } from "@/lib/recommend";

/** Re-runs the path recommendation from the student's existing profile (e.g. a "Regenerate" action on the dashboard). */
export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = supabaseAdmin();
  const { data: user } = await supabase.from("users").select("id").eq("clerk_id", userId).maybeSingle();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("occupation, years_experience, industry, career_goal, hours_per_week")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: "Complete your profile first" }, { status: 400 });
  }

  const recommendation = await generateRecommendation(profile);

  const { data: inserted } = await supabase
    .from("recommendations")
    .insert({ user_id: user.id, course_id: recommendation.courseId, rationale: recommendation.rationale })
    .select("*, course:courses(*)")
    .single();

  return NextResponse.json({ recommendation: inserted });
}
