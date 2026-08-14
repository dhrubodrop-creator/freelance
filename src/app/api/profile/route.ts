import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/current-user";
import { supabaseAdmin } from "@/lib/supabase/server";
import { generateRecommendation } from "@/lib/recommend";
import { logEvent } from "@/lib/analytics";

const profileSchema = z.object({
  occupation: z.string().min(1).max(200),
  yearsExperience: z.coerce.number().min(0).max(60),
  industry: z.string().min(1).max(200),
  careerGoal: z.enum(["freelance_income", "career_switch", "side_income"]),
  hoursPerWeek: z.coerce.number().min(1).max(80),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  let cvFileUrl: string | null = null;
  const cvFile = formData.get("cv");
  if (cvFile instanceof File && cvFile.size > 0) {
    if (cvFile.type !== "application/pdf") {
      return NextResponse.json({ error: "CV must be a PDF" }, { status: 400 });
    }
    const path = `${user.clerk_id}/${Date.now()}-${cvFile.name}`;
    const { error: uploadError } = await supabase.storage
      .from("cv-uploads")
      .upload(path, await cvFile.arrayBuffer(), { contentType: "application/pdf", upsert: true });
    if (!uploadError) cvFileUrl = path;
  }

  const { occupation, yearsExperience, industry, careerGoal, hoursPerWeek } = parsed.data;

  const { error: profileUpsertError } = await supabase.from("profiles").upsert(
    {
      user_id: user.id,
      occupation,
      years_experience: yearsExperience,
      industry,
      career_goal: careerGoal,
      hours_per_week: hoursPerWeek,
      // Only touch cv_file_url when a new file was actually uploaded this
      // submission — otherwise a resubmit without a new CV would wipe out
      // one already on file (e.g. uploaded later via the profile page).
      ...(cvFileUrl ? { cv_file_url: cvFileUrl } : {}),
    },
    { onConflict: "user_id" }
  );
  if (profileUpsertError) {
    console.error("[api/profile] profile upsert failed:", profileUpsertError.message);
    return NextResponse.json({ error: "Could not save your profile — try again." }, { status: 500 });
  }

  const { error: completionError } = await supabase
    .from("users")
    .update({ profile_completed: true })
    .eq("id", user.id);
  if (completionError) {
    console.error("[api/profile] profile completion update failed");
    return NextResponse.json({ error: "Could not finish account setup — try again." }, { status: 500 });
  }
  await logEvent(user.id, "onboarding_completed", { industry, careerGoal });

  const recommendation = await generateRecommendation(
    {
      occupation,
      years_experience: yearsExperience,
      industry,
      career_goal: careerGoal,
      hours_per_week: hoursPerWeek,
    },
    user.id
  );

  await supabase.from("recommendations").insert({
    user_id: user.id,
    course_id: recommendation.courseId,
    rationale: recommendation.rationale,
  });

  return NextResponse.json({ recommendation });
}

const profileUpdateSchema = z.object({
  bio: z.string().max(2000).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  preferredLanguage: z.string().max(100).optional().nullable(),
  incomeGoalInr: z.coerce.number().min(0).max(100_000_000).optional().nullable(),
  workPreference: z
    .enum(["full_time", "contract", "freelance", "consulting", "remote_only"])
    .optional()
    .nullable(),
  linkedinUrl: z.string().url().max(500).optional().nullable().or(z.literal("")),
  portfolioUrl: z.string().url().max(500).optional().nullable().or(z.literal("")),
  githubUrl: z.string().url().max(500).optional().nullable().or(z.literal("")),
  websiteUrl: z.string().url().max(500).optional().nullable().or(z.literal("")),
});

/** Ongoing profile edits (Phase 1) — separate from the one-time onboarding POST above. */
export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const v = parsed.data;
  const { error } = await supabase.from("profiles").upsert(
    {
      user_id: user.id,
      bio: v.bio ?? null,
      location: v.location ?? null,
      preferred_language: v.preferredLanguage ?? null,
      income_goal_inr: v.incomeGoalInr ?? null,
      work_preference: v.workPreference ?? null,
      linkedin_url: v.linkedinUrl || null,
      portfolio_url: v.portfolioUrl || null,
      github_url: v.githubUrl || null,
      website_url: v.websiteUrl || null,
    },
    { onConflict: "user_id" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
