import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { supabaseAdmin } from "@/lib/supabase/server";
import { computeProfileCompletion } from "@/lib/profile-completion";
import { computeSkillGap } from "@/lib/skill-gap";
import { computeMasteryForSkills, isVerifiedMasteryLevel, loadUserMasterySourceData } from "@/lib/mastery";
import { computeReadinessScore, generateMonetisationPlan } from "@/lib/monetisation";
import { logEvent } from "@/lib/analytics";
import { createNotification } from "@/lib/notifications";
import type { CourseRow, ProfileRow, SkillRow } from "@/types/db";

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = supabaseAdmin();
  const { data: user } = await supabase.from("users").select("id").eq("clerk_id", userId).maybeSingle();
  if (!user) return NextResponse.json({ error: "User record not found — try refreshing." }, { status: 404 });

  const [
    { data: profileData },
    { data: userSkillRows },
    { data: portfolioRows },
    { data: recommendationRow },
    { data: educationRows },
    { data: experienceRows },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("user_skills").select("skill_id, skills(id, name, category_id)").eq("user_id", user.id),
    supabase.from("portfolio_items").select("title").eq("user_id", user.id),
    supabase
      .from("recommendations")
      .select("course:courses(track)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("education").select("id").eq("user_id", user.id).limit(1),
    supabase.from("work_experiences").select("id").eq("user_id", user.id).limit(1),
  ]);

  const profile = profileData as ProfileRow | null;
  const userSkills = (userSkillRows ?? []) as unknown as { skill_id: string; skills: SkillRow | null }[];
  const skillNames = userSkills.map((us) => us.skills?.name).filter((n): n is string => Boolean(n));
  const userSkillIds = new Set(userSkills.map((us) => us.skill_id));

  const { data: allSkillRows } = await supabase.from("skills").select("id, name, category_id");
  const masteryData = await loadUserMasterySourceData(user.id);
  const mastery = computeMasteryForSkills((allSkillRows ?? []).map((s) => s.id), masteryData);
  const skillById = new Map(((allSkillRows ?? []) as { id: string; name: string; category_id: string }[]).map((s) => [s.id, s]));
  const verifiedSkillIds = mastery.filter((m) => isVerifiedMasteryLevel(m.level)).map((m) => m.skillId);
  const verifiedSkillNames = verifiedSkillIds.map((id) => skillById.get(id)?.name).filter((n): n is string => Boolean(n));
  const portfolioTitles = (portfolioRows ?? []).map((p) => p.title as string);
  const recommendedTrack =
    ((recommendationRow as unknown as { course: CourseRow | null } | null)?.course?.track) ?? null;

  let skillGapMissing: string[] = [];
  if (recommendedTrack) {
    const { data: categoryRow } = await supabase
      .from("skill_categories")
      .select("id")
      .eq("name", recommendedTrack)
      .maybeSingle();
    if (categoryRow) {
      const { data: trackSkills } = await supabase.from("skills").select("*").eq("category_id", categoryRow.id);
      const gap = computeSkillGap((trackSkills ?? []) as SkillRow[], userSkillIds);
      skillGapMissing = gap.missing.map((s) => s.name);
    }
  }

  // Post-audit fix: Market Pulse previously fed nothing downstream. Pull a
  // small, relevant slice of real market_signals — scoped to the categories
  // of the learner's VERIFIED skills, falling back to self-reported skill
  // categories only when no verified skills exist yet — rather than every
  // signal in the table, per the audit's explicit "must NOT receive every
  // market signal" requirement.
  const verifiedCategoryIds = Array.from(new Set(verifiedSkillIds.map((id) => skillById.get(id)?.category_id).filter((c): c is string => Boolean(c))));
  const selfReportedCategoryIds = Array.from(
    new Set(userSkills.map((us) => us.skills?.category_id).filter((c): c is string => Boolean(c)))
  );
  const relevantCategoryIds = verifiedCategoryIds.length > 0 ? verifiedCategoryIds : selfReportedCategoryIds;
  const { data: marketSignalRows } =
    relevantCategoryIds.length > 0
      ? await supabase
          .from("market_signals")
          .select("signal, source, confidence, category_id")
          .in("category_id", relevantCategoryIds)
          .order("observed_at", { ascending: false })
          .limit(5)
      : { data: [] };
  const marketSignals = (marketSignalRows ?? []).map((s) => ({ signal: s.signal, source: s.source, confidence: s.confidence }));

  const completion = computeProfileCompletion(profile, (educationRows?.length ?? 0) > 0, (experienceRows?.length ?? 0) > 0);
  const readiness = computeReadinessScore({
    skillsCount: skillNames.length,
    verifiedSkillsCount: verifiedSkillNames.length,
    portfolioCount: portfolioTitles.length,
    profileCompletionPercent: completion.percent,
    hasIncomeGoal: profile?.income_goal_inr != null,
    hasWorkPreference: Boolean(profile?.work_preference),
  });

  const plan = await generateMonetisationPlan({
    profile: {
      occupation: profile?.occupation ?? null,
      industry: profile?.industry ?? null,
      career_goal: profile?.career_goal ?? null,
      income_goal_inr: profile?.income_goal_inr ?? null,
      work_preference: profile?.work_preference ?? null,
    },
    skillNames,
    verifiedSkillNames,
    portfolioTitles,
    recommendedTrack,
    skillGapMissing,
    marketSignals,
    userId: user.id,
  });

  const { data: planRow, error: planError } = await supabase
    .from("monetisation_plans")
    .upsert(
      {
        user_id: user.id,
        summary: plan.summary,
        suggested_paths: plan.suggestedPaths,
        readiness_score: readiness.score,
        generated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (planError) return NextResponse.json({ error: planError.message }, { status: 500 });

  await supabase.from("monetisation_actions").delete().eq("plan_id", planRow.id);
  if (plan.weeklyActions.length > 0) {
    const { error: actionsError } = await supabase.from("monetisation_actions").insert(
      plan.weeklyActions.map((a) => ({ plan_id: planRow.id, week_number: a.weekNumber, task: a.task }))
    );
    if (actionsError) return NextResponse.json({ error: actionsError.message }, { status: 500 });
  }

  await logEvent(user.id, "monetisation_plan_created", { planId: planRow.id, readinessScore: readiness.score });
  await createNotification(
    user.id,
    "monetisation_plan",
    "Your monetisation plan is ready",
    plan.summary,
    "/dashboard"
  );

  return NextResponse.json({ ok: true, planId: planRow.id });
}
