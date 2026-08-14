import Link from "next/link";
import { redirect } from "next/navigation";
import { Award, Briefcase, FileText, FolderGit2, Sparkles, Trophy } from "lucide-react";

import { getCurrentUser } from "@/lib/current-user";
import { supabaseAdmin } from "@/lib/supabase/server";
import { computeMasteryForSkills, loadUserMasterySourceData } from "@/lib/mastery";
import { isCapstonePassed } from "@/lib/capstone-evidence";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MasteryLevel, SkillRow } from "@/types/db";

const LEVEL_LABEL: Record<MasteryLevel, string> = {
  not_started: "Not started",
  learning: "Learning",
  practicing: "Practicing",
  demonstrated: "Demonstrated",
  strong: "Strong",
};
const LEVEL_VARIANT: Record<MasteryLevel, "outline" | "accent" | "success"> = {
  not_started: "outline",
  learning: "outline",
  practicing: "outline",
  demonstrated: "success",
  strong: "accent",
};

/**
 * Outcome Engine Phase 4 — "My Assets". Pure aggregation of what already
 * exists across mastery/portfolio/capstone/proposal/opportunity systems —
 * no new tables, no new AI calls. Every item is explicitly labeled
 * CREATED/APPROVED/VERIFIED so nothing generated is silently presented as
 * verified evidence.
 */
export default async function AssetsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const supabase = supabaseAdmin();
  const [
    { data: skills },
    masteryData,
    { data: portfolioItems },
    { data: capstoneSubmissions },
    { data: caseStudies },
    { data: proposals },
    { data: monetisationPlan },
  ] = await Promise.all([
    supabase.from("skills").select("*").order("name"),
    loadUserMasterySourceData(user.id),
    supabase.from("portfolio_items").select("id, title, architecture_diagram_mermaid, deployment_url").eq("user_id", user.id),
    supabase.from("capstone_submissions").select("*, course_capstones(title)").eq("user_id", user.id).eq("status", "reviewed"),
    supabase.from("portfolio_case_studies").select("*, portfolio_items!inner(user_id, title)").eq("portfolio_items.user_id", user.id),
    supabase.from("proposals").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("monetisation_plans").select("*").eq("user_id", user.id).maybeSingle(),
  ]);

  const allSkills = (skills ?? []) as SkillRow[];
  const mastery = computeMasteryForSkills(allSkills.map((s) => s.id), masteryData);
  const skillById = new Map(allSkills.map((s) => [s.id, s]));
  const withEvidence = mastery.filter((m) => m.level !== "not_started");

  const items = portfolioItems ?? [];
  const { data: verificationRuns } = items.length > 0
    ? await supabase.from("project_verification_runs").select("portfolio_item_id, check_type, blockers").in("portfolio_item_id", items.map((i) => i.id))
    : { data: [] };
  const passingRunsByItem = new Map<string, number>();
  for (const r of verificationRuns ?? []) {
    if (!r.blockers || r.blockers.length === 0) passingRunsByItem.set(r.portfolio_item_id, (passingRunsByItem.get(r.portfolio_item_id) ?? 0) + 1);
  }

  const submissions = (capstoneSubmissions ?? []) as unknown as { id: string; course_capstones: { title: string } | null }[];
  const { data: reviews } = submissions.length > 0
    ? await supabase.from("capstone_reviews").select("submission_id, dimension_scores").in("submission_id", submissions.map((s) => s.id))
    : { data: [] };
  const reviewBySubmission = new Map((reviews ?? []).map((r) => [r.submission_id, r]));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading text-h2 font-bold">My Assets</h1>
        <p className="mt-1 text-muted-foreground">
          What you actually own because of your work — clearly labeled by how it was earned.
        </p>
      </div>

      <Section title="Skills" icon={Sparkles}>
        {withEvidence.length === 0 ? (
          <EmptyNote>No skill evidence yet — complete an exercise or attach a project to a skill to start building this.</EmptyNote>
        ) : (
          <div className="flex flex-wrap gap-2">
            {withEvidence.map((m) => (
              <Badge key={m.skillId} variant={LEVEL_VARIANT[m.level]}>
                {skillById.get(m.skillId)?.name} — {LEVEL_LABEL[m.level]}
              </Badge>
            ))}
          </div>
        )}
      </Section>

      <Section title="Projects" icon={FolderGit2}>
        {items.length === 0 ? (
          <EmptyNote>No projects yet — build one from a course module to start this category.</EmptyNote>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <Row key={item.id} title={item.title} tags={[
                { label: "CREATED", variant: "outline" },
                ...(passingRunsByItem.get(item.id) ? [{ label: "VERIFIED", variant: "success" as const }] : []),
                ...(item.deployment_url ? [{ label: "SHAREABLE", variant: "accent" as const }] : []),
              ]} href="/portfolio" />
            ))}
          </div>
        )}
        {submissions.length > 0 && (
          <div className="mt-3 flex flex-col gap-2">
            <p className="text-micro font-semibold uppercase tracking-wide text-muted-foreground">Capstones</p>
            {submissions.map((s) => {
              const review = reviewBySubmission.get(s.id);
              const passed = review ? isCapstonePassed(review.dimension_scores) : false;
              return (
                <Row
                  key={s.id}
                  title={s.course_capstones?.title ?? "Capstone"}
                  tags={[{ label: passed ? "VERIFIED" : "CREATED", variant: passed ? "success" : "outline" }]}
                  href="/proof"
                />
              );
            })}
          </div>
        )}
      </Section>

      <Section title="Proof" icon={Trophy}>
        {items.filter((i) => i.architecture_diagram_mermaid || passingRunsByItem.has(i.id)).length === 0 ? (
          <EmptyNote>No verification reports or architecture diagrams yet — run a check in Portfolio to start this category.</EmptyNote>
        ) : (
          <div className="flex flex-col gap-2">
            {items
              .filter((i) => i.architecture_diagram_mermaid || passingRunsByItem.has(i.id))
              .map((item) => (
                <Row
                  key={item.id}
                  title={item.title}
                  tags={[
                    ...(passingRunsByItem.get(item.id) ? [{ label: `${passingRunsByItem.get(item.id)} verification pass(es)`, variant: "success" as const }] : []),
                    ...(item.architecture_diagram_mermaid ? [{ label: "Architecture diagram", variant: "outline" as const }] : []),
                  ]}
                  href="/portfolio"
                />
              ))}
          </div>
        )}
      </Section>

      <Section title="Career" icon={Award}>
        {(caseStudies ?? []).length === 0 ? (
          <EmptyNote>No resume bullets or interview stories yet — generate a case study from an approved project.</EmptyNote>
        ) : (
          <div className="flex flex-col gap-2">
            {(caseStudies ?? []).map((c) => (
              <Row
                key={c.id}
                title={(c.portfolio_items as unknown as { title: string })?.title ?? "Case study"}
                tags={[
                  { label: c.approved ? "APPROVED" : "CREATED", variant: c.approved ? "success" : "outline" },
                  { label: `${c.resume_bullets?.length ?? 0} resume bullets`, variant: "outline" },
                ]}
                href="/portfolio"
              />
            ))}
          </div>
        )}
      </Section>

      <Section title="Business" icon={Briefcase}>
        {!monetisationPlan && (proposals ?? []).length === 0 ? (
          <EmptyNote>No service offers or proposals yet — generate a monetisation plan from your dashboard first.</EmptyNote>
        ) : (
          <div className="flex flex-col gap-2">
            {monetisationPlan && (
              <Row title="Monetisation plan" tags={[{ label: "CREATED", variant: "outline" }]} href="/dashboard" />
            )}
            {(proposals ?? []).map((p) => (
              <Row
                key={p.id}
                title={`Proposal: ${p.service_type}`}
                tags={[{ label: p.approved ? "APPROVED" : "CREATED", variant: p.approved ? "success" : "outline" }]}
                href="/dashboard"
              />
            ))}
          </div>
        )}
      </Section>

      <Section title="Opportunities" icon={FileText}>
        <p className="text-sm text-muted-foreground">
          Matched opportunities and readiness status live on the{" "}
          <Link href="/opportunities" className="text-accent-600 hover:underline">
            Opportunities page
          </Link>
          , kept there since they change as new listings are curated.
        </p>
      </Section>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: typeof Sparkles; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="size-4 text-accent-600" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

function Row({
  title,
  tags,
  href,
}: {
  title: string;
  tags: { label: string; variant: "outline" | "success" | "accent" }[];
  href: string;
}) {
  return (
    <Link href={href} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3.5 py-2.5 text-sm hover:bg-muted">
      <span className="font-medium">{title}</span>
      <span className="flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <Badge key={t.label} variant={t.variant} className="text-micro">
            {t.label}
          </Badge>
        ))}
      </span>
    </Link>
  );
}

