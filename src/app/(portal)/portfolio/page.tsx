import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ExternalLink, Lightbulb, Plus, Wrench } from "lucide-react";

import { getCurrentUser } from "@/lib/current-user";
import { supabaseAdmin } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/admin/delete-button";
import { PortfolioFormDialog } from "@/components/profile/portfolio-form-dialog";
import { ProjectDecisions } from "@/components/profile/project-decisions";
import { ProjectCheckpoints } from "@/components/profile/project-checkpoints";
import { PortfolioCaseStudy } from "@/components/profile/portfolio-case-study";
import { CapstoneCard } from "@/components/profile/capstone-card";
import { GitHubConnectionCard } from "@/components/profile/github-connection-card";
import { GitHubRepoLink } from "@/components/profile/github-repo-link";
import { CodeCoachPanel } from "@/components/profile/code-coach-panel";
import { DefinitionOfDonePanel } from "@/components/profile/definition-of-done-panel";
import { QualityLabsPanel } from "@/components/profile/quality-labs-panel";
import { AiEvaluationStudio } from "@/components/profile/ai-evaluation-studio";
import { EvidencePanel } from "@/components/profile/evidence-panel";
import { ProductionReadinessCard } from "@/components/profile/production-readiness-card";
import { GraduationReplayPanel } from "@/components/profile/graduation-replay-panel";
import { ExpandableGroup } from "@/components/profile/expandable-group";
import { getGitHubConnectionSummary } from "@/lib/github";
import type {
  CapstoneReviewRow,
  CapstoneSubmissionRow,
  CourseCapstoneRow,
  CourseRow,
  AcceptanceCheckRow,
  PortfolioCaseStudyRow,
  PortfolioItemRow,
  ProjectCheckpointRow,
  ProjectDecisionRow,
  SkillRow,
} from "@/types/db";

export default async function PortfolioPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const supabase = supabaseAdmin();
  const [{ data: items }, { data: allSkills }, { data: itemSkillLinks }, { data: enrollmentRows }] =
    await Promise.all([
      supabase.from("portfolio_items").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("skills").select("*").order("name"),
      supabase.from("portfolio_item_skills").select("portfolio_item_id, skill_id"),
      supabase
        .from("enrollments")
        .select("course_id, courses(id, title)")
        .eq("user_id", user.id)
        .eq("status", "active"),
    ]);

  const portfolioItems = (items ?? []) as PortfolioItemRow[];
  const skills = (allSkills ?? []) as SkillRow[];
  const skillById = new Map(skills.map((s) => [s.id, s]));
  const skillsByItem = new Map<string, string[]>();
  for (const link of itemSkillLinks ?? []) {
    const list = skillsByItem.get(link.portfolio_item_id) ?? [];
    list.push(link.skill_id);
    skillsByItem.set(link.portfolio_item_id, list);
  }

  const decisionsByItem = new Map<string, ProjectDecisionRow[]>();
  const caseStudyByItem = new Map<string, PortfolioCaseStudyRow>();
  const checkpointsByItem = new Map<string, ProjectCheckpointRow[]>();
  if (portfolioItems.length > 0) {
    const [{ data: decisionRows }, { data: caseStudyRows }, { data: checkpointRows }] = await Promise.all([
      supabase
        .from("project_decisions")
        .select("*")
        .in("portfolio_item_id", portfolioItems.map((i) => i.id))
        .order("order_index"),
      supabase
        .from("portfolio_case_studies")
        .select("*")
        .in("portfolio_item_id", portfolioItems.map((i) => i.id)),
      supabase
        .from("project_checkpoints")
        .select("*")
        .in("portfolio_item_id", portfolioItems.map((i) => i.id))
        .order("created_at", { ascending: false }),
    ]);
    for (const d of (decisionRows ?? []) as ProjectDecisionRow[]) {
      const list = decisionsByItem.get(d.portfolio_item_id) ?? [];
      list.push(d);
      decisionsByItem.set(d.portfolio_item_id, list);
    }
    for (const c of (caseStudyRows ?? []) as PortfolioCaseStudyRow[]) {
      caseStudyByItem.set(c.portfolio_item_id, c);
    }
    for (const cp of (checkpointRows ?? []) as ProjectCheckpointRow[]) {
      const list = checkpointsByItem.get(cp.portfolio_item_id) ?? [];
      list.push(cp);
      checkpointsByItem.set(cp.portfolio_item_id, list);
    }
  }

  const [githubConnection, { data: repoLinkRows }, { data: acceptanceCheckRows }] = await Promise.all([
    getGitHubConnectionSummary(user.id),
    portfolioItems.length > 0
      ? supabase.from("github_repo_links").select("portfolio_item_id, repo_full_name").in(
          "portfolio_item_id",
          portfolioItems.map((i) => i.id)
        )
      : Promise.resolve({ data: [] as { portfolio_item_id: string; repo_full_name: string }[] }),
    portfolioItems.length > 0
      ? supabase
          .from("acceptance_checks")
          .select("*")
          .in("portfolio_item_id", portfolioItems.map((i) => i.id))
          .order("order_index")
      : Promise.resolve({ data: [] as AcceptanceCheckRow[] }),
  ]);
  const repoByItem = new Map((repoLinkRows ?? []).map((r) => [r.portfolio_item_id, r.repo_full_name]));
  const acceptanceChecksByItem = new Map<string, AcceptanceCheckRow[]>();
  for (const c of (acceptanceCheckRows ?? []) as AcceptanceCheckRow[]) {
    const list = acceptanceChecksByItem.get(c.portfolio_item_id) ?? [];
    list.push(c);
    acceptanceChecksByItem.set(c.portfolio_item_id, list);
  }

  const enrolledCourses = ((enrollmentRows ?? []) as unknown as { course_id: string; courses: CourseRow | null }[])
    .map((r) => r.courses)
    .filter((c): c is CourseRow => Boolean(c));

  let capstonePanels: ReactNode = null;
  if (enrolledCourses.length > 0) {
    const { data: capstoneRows } = await supabase
      .from("course_capstones")
      .select("*")
      .in("course_id", enrolledCourses.map((c) => c.id));
    const capstones = (capstoneRows ?? []) as CourseCapstoneRow[];

    if (capstones.length > 0) {
      const { data: submissionRows } = await supabase
        .from("capstone_submissions")
        .select("*")
        .eq("user_id", user.id)
        .in("capstone_id", capstones.map((c) => c.id));
      const submissions = (submissionRows ?? []) as CapstoneSubmissionRow[];
      const submissionByCapstone = new Map(submissions.map((s) => [s.capstone_id, s]));

      const { data: reviewRows } = submissions.length > 0
        ? await supabase.from("capstone_reviews").select("*").in("submission_id", submissions.map((s) => s.id))
        : { data: [] };
      const reviews = (reviewRows ?? []) as CapstoneReviewRow[];
      const reviewBySubmission = new Map(reviews.map((r) => [r.submission_id, r]));

      const courseById = new Map(enrolledCourses.map((c) => [c.id, c]));

      capstonePanels = (
        <div className="flex flex-col gap-4">
          <h2 className="font-heading text-h4 font-semibold">Capstones</h2>
          {capstones.map((capstone) => {
            const submission = submissionByCapstone.get(capstone.id) ?? null;
            const review = submission ? reviewBySubmission.get(submission.id) ?? null : null;
            const eligibleItems = portfolioItems.filter((i) => i.course_id === capstone.course_id);
            return (
              <CapstoneCard
                key={capstone.id}
                capstone={capstone}
                courseTitle={courseById.get(capstone.course_id)?.title ?? ""}
                eligibleItems={eligibleItems}
                submission={submission}
                review={review}
              />
            );
          })}
        </div>
      );
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-h2 font-bold">Portfolio</h1>
          <p className="mt-1 text-muted-foreground">
            Real proof of what you&rsquo;ve built — not &ldquo;I took a course,&rdquo; but &ldquo;I built this.&rdquo;
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="gap-1.5">
            <Link href="/portfolio/build-from-idea">
              <Lightbulb className="size-4" /> Build from my idea
            </Link>
          </Button>
          <PortfolioFormDialog
            title="Add a project"
            skills={skills}
            courses={enrolledCourses}
            trigger={
              <Button className="gap-1.5">
                <Plus className="size-4" /> Add project
              </Button>
            }
          />
        </div>
      </div>

      <GitHubConnectionCard connection={githubConnection} />

      {portfolioItems.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No projects yet. Add your first build from a course module or a client project.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {portfolioItems.map((item) => {
          const itemSkillIds = skillsByItem.get(item.id) ?? [];
          return (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{item.title}</CardTitle>
                  <div className="flex shrink-0 items-center gap-1">
                    <PortfolioFormDialog
                      title="Edit project"
                      skills={skills}
                      courses={enrolledCourses}
                      initial={item}
                      initialSkillIds={itemSkillIds}
                      trigger={
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      }
                    />
                    <DeleteButton endpoint={`/api/portfolio/${item.id}`} confirmMessage="Delete this project?" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                {item.outcome && (
                  <p className="text-sm">
                    <span className="font-semibold">Outcome: </span>
                    {item.outcome}
                  </p>
                )}
                {item.tools_used.length > 0 && (
                  <div className="flex items-center gap-1.5 text-micro text-muted-foreground">
                    <Wrench className="size-3.5" />
                    {item.tools_used.join(", ")}
                  </div>
                )}
                {itemSkillIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {itemSkillIds.map((sid) => {
                      const skill = skillById.get(sid);
                      return skill ? (
                        <Badge key={sid} variant="accent">
                          {skill.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
                {item.links.length > 0 && (
                  <div className="flex flex-col gap-1">
                    {item.links.map((link) => (
                      <a
                        key={link}
                        href={link}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="flex items-center gap-1.5 text-sm text-accent-600 hover:underline"
                      >
                        <ExternalLink className="size-3.5" />
                        {link}
                      </a>
                    ))}
                  </div>
                )}
                <ProjectDecisions portfolioItemId={item.id} decisions={decisionsByItem.get(item.id) ?? []} />
                <ProjectCheckpoints portfolioItemId={item.id} checkpoints={checkpointsByItem.get(item.id) ?? []} />
                <PortfolioCaseStudy portfolioItemId={item.id} caseStudy={caseStudyByItem.get(item.id) ?? null} />

                <ExpandableGroup label="Engineering studio">
                  <GitHubRepoLink portfolioItemId={item.id} repoFullName={repoByItem.get(item.id) ?? null} />
                  <CodeCoachPanel portfolioItemId={item.id} repoFullName={repoByItem.get(item.id) ?? null} />
                  <DefinitionOfDonePanel
                    portfolioItemId={item.id}
                    checks={acceptanceChecksByItem.get(item.id) ?? []}
                    repoFullName={repoByItem.get(item.id) ?? null}
                  />
                  <QualityLabsPanel portfolioItemId={item.id} repoFullName={repoByItem.get(item.id) ?? null} />
                  <AiEvaluationStudio portfolioItemId={item.id} />
                  <EvidencePanel
                    portfolioItemId={item.id}
                    repoFullName={repoByItem.get(item.id) ?? null}
                    hasArchitecture={Boolean(item.architecture_note)}
                  />
                  <ProductionReadinessCard portfolioItemId={item.id} initialDeploymentUrl={item.deployment_url} />
                  <GraduationReplayPanel portfolioItemId={item.id} />
                </ExpandableGroup>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {capstonePanels}
    </div>
  );
}
