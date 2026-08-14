import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Sparkles, GraduationCap, Radio, UserCircle, FolderGit2 } from "lucide-react";

import { CalendarClock } from "lucide-react";

import { getCurrentUser } from "@/lib/current-user";
import { supabaseAdmin } from "@/lib/supabase/server";
import { computeProfileCompletion } from "@/lib/profile-completion";
import { getOrCreateDailyMission } from "@/lib/daily-mission";
import { getAllResumeStates } from "@/lib/resume-state";
import { computeCatchupPlan } from "@/lib/catchup-plan";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RegenerateRecommendationButton } from "@/components/portal/regenerate-recommendation-button";
import { MonetisationInsightCard } from "@/components/portal/monetisation-insight-card";
import { DailyMissionCard } from "@/components/portal/daily-mission-card";
import { PriceTag } from "@/components/shared/price-tag";
import type {
  CourseRow,
  EnrollmentRow,
  MonetisationActionRow,
  MonetisationPlanRow,
  ProfileRow,
  RecommendationRow,
} from "@/types/db";

type RecommendationWithCourse = RecommendationRow & { course: CourseRow | null };
type EnrollmentWithCourse = EnrollmentRow & { course: CourseRow | null };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const supabase = supabaseAdmin();

  const [
    { data: recommendation },
    { data: enrollments },
    { data: courses },
    { data: profileData },
    { data: educationRows },
    { data: experienceRows },
    { data: userSkillRows },
    { data: portfolioRows },
    { data: planRow },
  ] = await Promise.all([
    supabase
      .from("recommendations")
      .select("*, course:courses(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle() as unknown as Promise<{ data: RecommendationWithCourse | null }>,
    supabase
      .from("enrollments")
      .select("*, course:courses(*)")
      .eq("user_id", user.id)
      .eq("status", "active") as unknown as Promise<{ data: EnrollmentWithCourse[] | null }>,
    supabase.from("courses").select("*").order("price", { ascending: true }),
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("education").select("id").eq("user_id", user.id).limit(1),
    supabase.from("work_experiences").select("id").eq("user_id", user.id).limit(1),
    supabase.from("user_skills").select("id").eq("user_id", user.id),
    supabase.from("portfolio_items").select("id").eq("user_id", user.id),
    supabase.from("monetisation_plans").select("*").eq("user_id", user.id).maybeSingle(),
  ]);

  const recommendedCourse = recommendation?.course ?? null;
  const enrolledCourseIds = new Set((enrollments ?? []).map((e) => e.course_id));

  const { data: latestAnnouncement } = enrolledCourseIds.size
    ? await supabase.from("announcements").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle()
    : { data: null };

  const profile = profileData as ProfileRow | null;
  const profileCompletion = computeProfileCompletion(
    profile,
    (educationRows?.length ?? 0) > 0,
    (experienceRows?.length ?? 0) > 0
  );
  const skillsCount = userSkillRows?.length ?? 0;
  const portfolioCount = portfolioRows?.length ?? 0;

  const plan = (planRow as MonetisationPlanRow | null) ?? null;
  const { data: actionRows } = plan
    ? await supabase.from("monetisation_actions").select("*").eq("plan_id", plan.id)
    : { data: [] };
  const actions = (actionRows ?? []) as MonetisationActionRow[];

  const [mission, resumeStates] = await Promise.all([
    getOrCreateDailyMission(user.id),
    getAllResumeStates(user.id),
  ]);
  const missionCourse = mission ? (courses ?? []).find((c) => c.id === mission.course_id) : null;
  const catchupPlan = mission ? await computeCatchupPlan(user.id, mission.course_id) : null;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-sm text-muted-foreground">Welcome back{user.name ? `, ${user.name.split(" ")[0]}` : ""}</p>
        <h1 className="font-heading text-h2 font-bold">Your dashboard</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Link href="/profile" className="flex flex-col gap-1 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted">
          <span className="flex items-center gap-1.5 text-micro font-semibold uppercase tracking-wide text-muted-foreground">
            <UserCircle className="size-3.5" /> Profile
          </span>
          <span className="font-heading text-xl font-bold">{profileCompletion.percent}%</span>
        </Link>
        <Link href="/skills" className="flex flex-col gap-1 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted">
          <span className="flex items-center gap-1.5 text-micro font-semibold uppercase tracking-wide text-muted-foreground">
            <Sparkles className="size-3.5" /> Skills
          </span>
          <span className="font-heading text-xl font-bold">{skillsCount}</span>
        </Link>
        <Link href="/portfolio" className="flex flex-col gap-1 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted">
          <span className="flex items-center gap-1.5 text-micro font-semibold uppercase tracking-wide text-muted-foreground">
            <FolderGit2 className="size-3.5" /> Proof projects
          </span>
          <span className="font-heading text-xl font-bold">{portfolioCount}</span>
        </Link>
        <div className="flex flex-col gap-1 rounded-lg border border-border bg-card p-4">
          <span className="text-micro font-semibold uppercase tracking-wide text-muted-foreground">
            Readiness
          </span>
          <span className="font-heading text-xl font-bold">{plan ? plan.readiness_score : "—"}</span>
        </div>
      </div>

      <DailyMissionCard mission={mission} courseSlug={missionCourse?.slug ?? null} />

      {catchupPlan && (
        <Card className="border-primary-100 bg-primary-50/40">
          <CardContent className="flex flex-col gap-2 py-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary-700">
              <CalendarClock className="size-4" />
              You&rsquo;ve been away {catchupPlan.days_inactive} days — here&rsquo;s a realistic way back in
            </div>
            <p className="text-sm text-muted-foreground">
              {catchupPlan.remaining_modules} module{catchupPlan.remaining_modules === 1 ? "" : "s"} left, about{" "}
              {catchupPlan.recommended_weekly_minutes} minutes/week based on your own past pace — not a guess.
              {catchupPlan.target_completion_date && ` Realistic finish: ${catchupPlan.target_completion_date}.`}
            </p>
          </CardContent>
        </Card>
      )}

      <MonetisationInsightCard plan={plan} actions={actions} />

      {recommendedCourse && !enrolledCourseIds.has(recommendedCourse.id) && (
        <Card className="border-accent/40 bg-gradient-to-br from-accent-50 to-background">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="accent" className="gap-1">
                <Sparkles className="size-3" />
                AI recommended
              </Badge>
              <RegenerateRecommendationButton />
            </div>
            <CardTitle className="text-h4">{recommendedCourse.title}</CardTitle>
            <CardDescription>{recommendation?.rationale}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <Button asChild variant="accent">
              <Link href={`/courses/${recommendedCourse.slug}`}>
                View this track <ArrowRight className="size-4" />
              </Link>
            </Button>
            <PriceTag price={Number(recommendedCourse.price)} slug={recommendedCourse.slug} />
          </CardContent>
        </Card>
      )}

      {latestAnnouncement && (
        <Card className="border-primary-100 bg-primary-50/40">
          <CardContent className="flex items-start gap-3 py-5">
            <Radio className="mt-0.5 size-4 shrink-0 text-primary-700" />
            <div>
              <p className="font-heading text-sm font-semibold text-primary-700">{latestAnnouncement.title}</p>
              <p className="text-sm text-muted-foreground">{latestAnnouncement.body}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {enrollments && enrollments.length > 0 && (
        <div>
          <h2 className="mb-3 font-heading text-lg font-semibold">Continue learning</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {enrollments.map((enrollment) => {
              const course = enrollment.course;
              if (!course) return null;
              const checkpoint = resumeStates.get(course.id);
              const resumeHref = checkpoint?.module_id
                ? `/courses/${course.slug}/learn/${checkpoint.module_id}`
                : `/courses/${course.slug}/learn`;
              return (
                <Card key={enrollment.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{course.title}</CardTitle>
                    <CardDescription>{course.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild size="sm">
                      <Link href={resumeHref}>
                        Resume <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-3 flex items-center gap-2 font-heading text-lg font-semibold">
          <GraduationCap className="size-5 text-muted-foreground" />
          Browse all tracks
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(courses ?? []).map((course) => (
            <Card key={course.id}>
              <CardHeader>
                <CardTitle className="text-base">{course.title}</CardTitle>
                <CardDescription className="line-clamp-2">{course.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <PriceTag price={Number(course.price)} slug={course.slug} />
                <Button asChild variant="outline" size="sm" className="w-fit">
                  <Link href={`/courses/${course.slug}`}>Details</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
