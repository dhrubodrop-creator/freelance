import Link from "next/link";
import { redirect } from "next/navigation";
import { Award, FolderGit2, GraduationCap, Sparkles, Trophy } from "lucide-react";

import { getCurrentUser } from "@/lib/current-user";
import { supabaseAdmin } from "@/lib/supabase/server";
import { computeMasteryForSkills, isVerifiedMasteryLevel, loadUserMasterySourceData } from "@/lib/mastery";
import { averageDimensionScore, isCapstonePassed } from "@/lib/capstone-evidence";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProofShareLinkCard } from "@/components/profile/proof-share-link-card";
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

  // "Projects with evidence" — post-audit fix: a raw portfolio_items row is
  // NOT evidence on its own (a learner can create one describing anything).
  // Only count a project once it has at least one real, verified signal:
  // an approved case study, a passing verification run, or a passed
  // capstone tied to it.
  const portfolioItemIds = (portfolioItems ?? []).map((i) => i.id);
  const { data: passingRunRows } =
    portfolioItemIds.length > 0
      ? await supabase
          .from("project_verification_runs")
          .select("portfolio_item_id, blockers")
          .in("portfolio_item_id", portfolioItemIds)
      : { data: [] };
  const itemsWithPassingRun = new Set(
    (passingRunRows ?? []).filter((r) => !r.blockers || r.blockers.length === 0).map((r) => r.portfolio_item_id as string)
  );
  const approvedCaseStudyItemIds = new Set((approvedCaseStudies ?? []).map((c) => c.portfolio_item_id));

  const { data: shareTokenRow } = await supabase.from("proof_share_tokens").select("token").eq("user_id", user.id).maybeSingle();

  const allSkills = (skills ?? []) as SkillRow[];
  const mastery = computeMasteryForSkills(allSkills.map((s) => s.id), masteryData);
  const skillById = new Map(allSkills.map((s) => [s.id, s]));
  const demonstrated = mastery.filter((m) => isVerifiedMasteryLevel(m.level));
  const strong = mastery.filter((m) => m.level === "strong");

  const reviewedSubmissions = (submissions ?? []) as CapstoneSubmissionRow[];
  let capstoneDetails: { capstone: CourseCapstoneRow; review: CapstoneReviewRow; portfolioItemId: string; passed: boolean }[] = [];
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
        if (!capstone || !review) return null;
        return { capstone, review, portfolioItemId: s.portfolio_item_id, passed: isCapstonePassed(review.dimension_scores) };
      })
      .filter((x): x is { capstone: CourseCapstoneRow; review: CapstoneReviewRow; portfolioItemId: string; passed: boolean } =>
        Boolean(x)
      );
  }
  // "Capstones passed" — post-audit fix: only count submissions that actually
  // cleared the canonical passing bar (isCapstonePassed), not every reviewed
  // submission regardless of score.
  const passedCapstones = capstoneDetails.filter((c) => c.passed);
  const passedCapstoneItemIds = new Set(passedCapstones.map((c) => c.portfolioItemId));

  const itemsWithEvidence = new Set(
    Array.from(itemsWithPassingRun).concat(Array.from(approvedCaseStudyItemIds), Array.from(passedCapstoneItemIds))
  );
  const projectsWithEvidenceCount = (portfolioItems ?? []).filter((i) => itemsWithEvidence.has(i.id)).length;

  const stats = [
    { label: "Skills demonstrated", value: demonstrated.length, icon: Sparkles, zeroHint: "Practice an exercise to start.", href: "/growth" },
    { label: "Projects with evidence", value: projectsWithEvidenceCount, icon: FolderGit2, zeroHint: "Attach a project to a skill.", href: "/portfolio" },
    { label: "Capstones passed", value: passedCapstones.length, icon: GraduationCap, zeroHint: "Submit a capstone for review.", href: "/portfolio" },
    { label: "Portfolio artifacts", value: (approvedCaseStudies ?? []).length, icon: Award, zeroHint: "Generate a case study from a project.", href: "/portfolio" },
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

      <ProofShareLinkCard initialToken={shareTokenRow?.token ?? null} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 py-5">
              <s.icon className="size-6 text-accent-600" />
              <div>
                <p className="font-heading text-2xl font-bold">{s.value}</p>
                <p className="text-micro text-muted-foreground">{s.label}</p>
                {s.value === 0 && (
                  <Link href={s.href} className="text-micro text-accent-600 hover:underline">
                    {s.zeroHint}
                  </Link>
                )}
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
            <CardDescription>
              AI-defended and scored, not just submitted — only a score of {Math.round(50)}/100 or higher counts as
              &ldquo;passed&rdquo; and awards skill evidence.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {capstoneDetails.map(({ capstone, review, passed }) => {
              const avg = Math.round(averageDimensionScore(review.dimension_scores));
              return (
                <div key={capstone.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3.5 py-2.5">
                  <div className="flex items-center gap-2">
                    <Trophy className="size-4 text-accent-600" />
                    <span className="text-sm font-medium">{capstone.title}</span>
                  </div>
                  <Badge variant={passed ? "accent" : "outline"}>{avg}/100 avg — {passed ? "passed" : "not passed"}</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
