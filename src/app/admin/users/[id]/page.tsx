import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { supabaseAdmin } from "@/lib/supabase/server";
import { computeProfileCompletion } from "@/lib/profile-completion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type {
  CourseRow,
  EducationRow,
  EnrollmentRow,
  MonetisationPlanRow,
  ProfileRow,
  SkillRow,
  UserRow,
  UserSkillRow,
  WorkExperienceRow,
} from "@/types/db";

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = supabaseAdmin();

  const { data: userData } = await supabase.from("users").select("*").eq("id", id).maybeSingle();
  if (!userData) notFound();
  const user = userData as UserRow;

  const [
    { data: profileData },
    { data: educationRows },
    { data: experienceRows },
    { data: userSkillRows },
    { data: allSkills },
    { data: portfolioRows },
    { data: enrollmentRows },
    { data: planData },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", id).maybeSingle(),
    supabase.from("education").select("*").eq("user_id", id),
    supabase.from("work_experiences").select("*").eq("user_id", id),
    supabase.from("user_skills").select("*").eq("user_id", id),
    supabase.from("skills").select("*"),
    supabase.from("portfolio_items").select("id, title").eq("user_id", id),
    supabase.from("enrollments").select("*, course:courses(title, slug, price)").eq("user_id", id),
    supabase.from("monetisation_plans").select("*").eq("user_id", id).maybeSingle(),
  ]);

  const profile = profileData as ProfileRow | null;
  const education = (educationRows ?? []) as EducationRow[];
  const experience = (experienceRows ?? []) as WorkExperienceRow[];
  const userSkills = (userSkillRows ?? []) as UserSkillRow[];
  const skillById = new Map(((allSkills ?? []) as SkillRow[]).map((s) => [s.id, s]));
  const portfolioItems = portfolioRows ?? [];
  const enrollments = (enrollmentRows ?? []) as (EnrollmentRow & { course: Pick<CourseRow, "title" | "slug" | "price"> | null })[];
  const plan = planData as MonetisationPlanRow | null;

  const completion = computeProfileCompletion(profile, education.length > 0, experience.length > 0);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/users" className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to users
      </Link>

      <div>
        <h2 className="font-heading text-h3 font-semibold">{user.name ?? "Unnamed user"}</h2>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1.5 text-sm">
            <p>Role: <Badge variant={user.role === "admin" ? "accent" : "outline"}>{user.role}</Badge></p>
            <p>Created: {new Date(user.created_at).toLocaleDateString("en-IN")}</p>
            <p>Onboarded: {user.profile_completed ? "Yes" : "No"}</p>
            <p>Phone: {user.phone ?? "—"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile ({completion.percent}% complete)</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1.5 text-sm text-muted-foreground">
            <p>Occupation: {profile?.occupation ?? "—"}</p>
            <p>Industry: {profile?.industry ?? "—"}</p>
            <p>Career goal: {profile?.career_goal ?? "—"}</p>
            <p>Income goal: {profile?.income_goal_inr ? `₹${profile.income_goal_inr.toLocaleString("en-IN")}/mo` : "—"}</p>
            <p>Location: {profile?.location ?? "—"}</p>
            <p>Bio: {profile?.bio ?? "—"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Skills ({userSkills.length})</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {userSkills.length === 0 && <p className="text-sm text-muted-foreground">No skills added.</p>}
            {userSkills.map((us) => {
              const skill = skillById.get(us.skill_id);
              return skill ? (
                <Badge key={us.id} variant="outline">
                  {skill.name} · {us.self_level}
                </Badge>
              ) : null;
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Learning</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {enrollments.length === 0 && <p className="text-muted-foreground">No enrollments.</p>}
            {enrollments.map((e) => (
              <div key={e.id} className="flex items-center justify-between">
                <span>{e.course?.title ?? "Unknown course"}</span>
                <Badge variant={e.status === "active" ? "success" : "outline"}>{e.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Portfolio ({portfolioItems.length})</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm text-muted-foreground">
            {portfolioItems.length === 0 && <p>No projects yet.</p>}
            {portfolioItems.map((p) => (
              <p key={p.id}>{p.title}</p>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monetisation activity</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1.5 text-sm">
            {plan ? (
              <>
                <p>Readiness score: <span className="font-semibold">{plan.readiness_score}/100</span></p>
                <p className="text-muted-foreground">{plan.summary}</p>
              </>
            ) : (
              <p className="text-muted-foreground">No plan generated yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Payments</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border">
            {enrollments.length === 0 && <p className="py-2 text-sm text-muted-foreground">No payment history.</p>}
            {enrollments.map((e) => (
              <div key={e.id} className="flex items-center justify-between py-2 text-sm">
                <span>{e.course?.title ?? "Unknown course"}</span>
                <span className="text-muted-foreground">{e.payment_id ?? "—"}</span>
                <Badge variant={e.status === "active" ? "success" : e.status === "refunded" ? "destructive" : "outline"}>
                  {e.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
