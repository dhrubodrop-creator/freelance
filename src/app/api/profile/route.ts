import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabase/server";
import { generateRecommendation } from "@/lib/recommend";

const profileSchema = z.object({
  occupation: z.string().min(1).max(200),
  yearsExperience: z.coerce.number().min(0).max(60),
  industry: z.string().min(1).max(200),
  careerGoal: z.enum(["freelance_income", "career_switch", "side_income"]),
  hoursPerWeek: z.coerce.number().min(1).max(80),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const parsed = profileSchema.safeParse({
    occupation: formData.get("occupation"),
    yearsExperience: formData.get("yearsExperience"),
    industry: formData.get("industry"),
    careerGoal: formData.get("careerGoal"),
    hoursPerWeek: formData.get("hoursPerWeek"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = supabaseAdmin();

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("clerk_id", userId)
    .maybeSingle();

  if (userError || !user) {
    return NextResponse.json({ error: "User record not found — try refreshing." }, { status: 404 });
  }

  let cvFileUrl: string | null = null;
  const cvFile = formData.get("cv");
  if (cvFile instanceof File && cvFile.size > 0) {
    if (cvFile.type !== "application/pdf") {
      return NextResponse.json({ error: "CV must be a PDF" }, { status: 400 });
    }
    const path = `${userId}/${Date.now()}-${cvFile.name}`;
    const { error: uploadError } = await supabase.storage
      .from("cv-uploads")
      .upload(path, await cvFile.arrayBuffer(), { contentType: "application/pdf", upsert: true });
    if (!uploadError) cvFileUrl = path;
  }

  const { occupation, yearsExperience, industry, careerGoal, hoursPerWeek } = parsed.data;

  await supabase.from("profiles").upsert(
    {
      user_id: user.id,
      occupation,
      years_experience: yearsExperience,
      industry,
      career_goal: careerGoal,
      hours_per_week: hoursPerWeek,
      cv_file_url: cvFileUrl,
    },
    { onConflict: "user_id" }
  );

  await supabase.from("users").update({ profile_completed: true }).eq("id", user.id);

  const recommendation = await generateRecommendation({
    occupation,
    years_experience: yearsExperience,
    industry,
    career_goal: careerGoal,
    hours_per_week: hoursPerWeek,
  });

  await supabase.from("recommendations").insert({
    user_id: user.id,
    course_id: recommendation.courseId,
    rationale: recommendation.rationale,
  });

  return NextResponse.json({ recommendation });
}
