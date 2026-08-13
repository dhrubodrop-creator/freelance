import { redirect } from "next/navigation";
import { Award, FolderGit2, GraduationCap, Sparkles, Trophy } from "lucide-react";

import { getCurrentUser } from "@/lib/current-user";
import { supabaseAdmin } from "@/lib/supabase/server";
import { computeMasteryForSkills, loadUserMasterySourceData } from "@/lib/mastery";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CapstoneReviewRow, CapstoneSubmissionRow, CourseCapstoneRow, SkillRow } from "@/types/db";

export default async function ProofProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const supabase = supabaseAdmin();
  const [
    { data: skills },
    masteryData,
    { data: portfolioItems },
    { data: approvedCaseStudies },
    { data: submissions },
  ] = await Promise.all([
    supabase.from("skills").select("*").order("name"),
    loadUserMasterySourceData(user.id),
    supabase.from("portfolio_items").select("id, title").eq("user_id", user.id),
    supabase
      .from("portfolio_case_studies")
      .select("*, portfolio_items!inner(user_id)")
      .eq("portfolio_items.user_id", user.id)
      .eq("approved", true),
    supabase.from("capstone_submissions").select("*").eq("user_id", user.id).eq("status", "reviewed"),
  ]);

  const allSkills = (skills ?? []) as SkillRow[];
  const mastery = computeMasteryForSkills(allSkills.map((s) => s.id), masteryData);
  const skillById = new Map(allSkills.map((s) => [s.id, s]));
  const demonstrated = mastery.filter((m) => m.level === "demonstrated" || m.level === "strong");
  const strong = mastery.filter((m) => m.level === "strong");

  const reviewedSubmissions = (submissions ?? []) as CapstoneSubmissionRow[];
  let capstoneDetails: { capstone: CourseCapstoneRow; review: CapstoneReviewRow }[] = [];
  if (reviewedSubmissions.length > 0) {
    const [{ data: capstones }, { data: reviews }] = await Promise.all([
      supabase.from("course_capstones").select("*").in("id", reviewedSubmissions.map((s) => s.capstone_id)),
      supabase.from("capstone_reviews").select("*").in("submission_id", reviewedSubmissions.map((s) => s.id)),
    ]);
    const capstoneById = new Map(((capstones ?? []) as CourseCapstoneRow[]).map((c) => [c.id, c]));
    const reviewBySubmission = new Map(((reviews ?? []) as CapstoneReviewRow[]).map((r) => [r.submission_id, r]));
    capstoneDetails = reviewedSubmissions
      .map((s) => {
        const capstone = capstoneById.get(s.capstone_id);
        const review = reviewBySubmission.get(s.id);
        return capstone && review ? { capstone, review } : null;
      })
      .filter((x): x is { capstone: CourseCapstoneRow; review: CapstoneReviewRow } => Boolean(x));
  }

  const stats = [
    { label: "Skills demonstrated", value: demonstrated.length, icon: Sparkles },
    { label: "Projects completed", value: portfolioItems?.length ?? 0, icon: FolderGit2 },
    { label: "Capstones passed", value: capstoneDetails.length, icon: GraduationCap },
    { label: "Portfolio artifacts", value: (approvedCaseStudies ?? []).length, icon: Award },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-h2 font-bold">Your Professional Proof</h1>
        <p className="mt-1 text-muted-foreground">
          The bridge between learning and employability — everything here is backed by evidence
          (completed modules, practiced exercises, real projects), not self-reported claims.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 py-5">
              <s.icon className="size-6 text-accent-600" />
              <div>
                <p className="font-heading text-2xl font-bold">{s.value}</p>
                <p className="text-micro text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Skills with evidence</CardTitle>
          <CardDescription>
            Demonstrated (real portfolio proof) or Strong (proof + practice) — not self-ratings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {demonstrated.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              None yet — finish a module and attach a portfolio project to a skill to start building
              evidence.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {demonstrated.map((m) => (
                <Badge key={m.skillId} variant={strong.some((s) => s.skillId === m.skillId) ? "accent" : "success"}>
                  {skillById.get(m.skillId)?.name} — {strong.some((s) => s.skillId === m.skillId) ? "Strong" : "Demonstrated"}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {capstoneDetails.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Capstones</CardTitle>
            <CardDescription>AI-defended and scored, not just submitted.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {capstoneDetails.map(({ capstone, review }) => {
              const scores = Object.values(review.dimension_scores);
              const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b.score, 0) / scores.length) : null;
              return (
                <div key={capstone.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3.5 py-2.5">
                  <div className="flex items-center gap-2">
                    <Trophy className="size-4 text-accent-600" />
                    <span className="text-sm font-medium">{capstone.title}</span>
                  </div>
                  {avg !== null && <Badge variant="accent">{avg}/100 avg</Badge>}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
