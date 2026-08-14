import Link from "next/link";
import { redirect } from "next/navigation";
import { Flame, Rocket, Sparkles, TestTube2, Trophy, XCircle } from "lucide-react";

import { getCurrentUser } from "@/lib/current-user";
import { supabaseAdmin } from "@/lib/supabase/server";
import { computeMasteryForSkills, explainSkillEvidence, loadUserMasterySourceData } from "@/lib/mastery";
import { computeMomentum } from "@/lib/momentum";
import { generateWeeklyBuildStory } from "@/lib/weekly-story";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SkillEvidenceBadge } from "@/components/portal/skill-evidence-badge";
import type { SkillCategoryRow, SkillRow } from "@/types/db";

export default async function GrowthPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const supabase = supabaseAdmin();
  const [{ data: categories }, { data: skills }, masteryData, momentum, story, { data: enrollments }] = await Promise.all([
    supabase.from("skill_categories").select("*").order("name"),
    supabase.from("skills").select("*").order("name"),
    loadUserMasterySourceData(user.id),
    computeMomentum(user.id),
    generateWeeklyBuildStory(user.id),
    supabase.from("enrollments").select("course_id, courses(id, title)").eq("user_id", user.id).eq("status", "active"),
  ]);

  const allSkills = (skills ?? []) as SkillRow[];
  const mastery = computeMasteryForSkills(allSkills.map((s) => s.id), masteryData);
  const masteryBySkill = new Map(mastery.map((m) => [m.skillId, m]));
  const skillsByCategory = new Map<string, SkillRow[]>();
  for (const skill of allSkills) {
    const list = skillsByCategory.get(skill.category_id) ?? [];
    list.push(skill);
    skillsByCategory.set(skill.category_id, list);
  }

  // Value-layer P1 — "Don't learn this yet": skills genuinely outside the learner's
  // current active course, deterministically, not an AI opinion. Skipped entirely
  // (not guessed) when there's no active course to compare against.
  const activeEnrollment = (enrollments ?? [])[0] as unknown as { course_id: string; courses: { id: string; title: string } | null } | undefined;
  let dontLearnYet: { name: string }[] = [];
  let activeCourseTitle: string | null = null;
  if (activeEnrollment?.courses) {
    activeCourseTitle = activeEnrollment.courses.title;
    const { data: activeModules } = await supabase.from("modules").select("id").eq("course_id", activeEnrollment.course_id);
    const activeModuleIds = new Set((activeModules ?? []).map((m) => m.id));
    const { data: activeModuleSkills } = await supabase
      .from("module_skills")
      .select("skill_id, module_id")
      .in("module_id", Array.from(activeModuleIds).length ? Array.from(activeModuleIds) : [""]);
    const activeCourseSkillIds = new Set((activeModuleSkills ?? []).map((r) => r.skill_id));
    dontLearnYet = allSkills
      .filter((s) => !activeCourseSkillIds.has(s.id) && (masteryBySkill.get(s.id)?.level ?? "not_started") === "not_started")
      .slice(0, 6)
      .map((s) => ({ name: s.name }));
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-h2 font-bold">Growth</h1>
        <p className="mt-1 text-muted-foreground">Your skill map, momentum, and this week&rsquo;s real build story.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Flame className="size-4 text-accent-600" /> Momentum ({momentum.windowDays} days)
          </CardTitle>
          <CardDescription>Meaningful progress only — not clicks or page views.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { label: "Features shipped", value: momentum.featuresShipped },
            { label: "Tests passed", value: momentum.testsPassed },
            { label: "Capstone milestones", value: momentum.capstoneMilestones },
            { label: "Deployments", value: momentum.deployments },
            { label: "Failures resolved", value: momentum.resolvedFailures },
          ].map((m) => (
            <div key={m.label} className="rounded-lg border border-border p-3 text-center">
              <p className="font-heading text-xl font-bold">{m.value}</p>
              <p className="text-micro text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Rocket className="size-4 text-accent-600" /> This week&rsquo;s build story
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <StorySection title="Built" items={story.built} emptyHint="No projects shipped this week yet — build something in Portfolio." />
          <StorySection title="Failed" items={story.failed} emptyHint="No failures logged — that can mean nothing was tried yet, not that everything worked." />
          <StorySection title="Fixed" items={story.fixed} emptyHint="Nothing fixed yet this week." />
          <StorySection title="Learned" items={story.learned} emptyHint="Complete a module or exercise to fill this in." />
          <StorySection title="Next" items={story.next} emptyHint="Check Next Best Move above for what to do next." />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4 text-accent-600" /> Skill tree
          </CardTitle>
          <CardDescription>
            Lit up only where you have real evidence — self-ratings alone don&rsquo;t count. Click any skill to see why.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {((categories ?? []) as SkillCategoryRow[]).map((category) => {
            const categorySkills = skillsByCategory.get(category.id) ?? [];
            if (categorySkills.length === 0) return null;
            return (
              <div key={category.id}>
                <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                  <Trophy className="size-3.5 text-muted-foreground" /> {category.name}
                </p>
                <div className="flex flex-wrap gap-2">
                  {categorySkills.map((skill) => {
                    const m = masteryBySkill.get(skill.id);
                    const level = m?.level ?? "not_started";
                    const explanation = explainSkillEvidence(m?.evidence ?? { studied: false, practiced: false, project: false });
                    return <SkillEvidenceBadge key={skill.id} name={skill.name} level={level} explanation={explanation} />;
                  })}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {dontLearnYet.length > 0 && activeCourseTitle && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <XCircle className="size-4 text-muted-foreground" /> Don&rsquo;t learn this yet
            </CardTitle>
            <CardDescription>
              Not part of {activeCourseTitle} — staying focused on your current track beats spreading thin.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {dontLearnYet.map((s) => (
              <span key={s.name} className="rounded-full border border-dashed border-border px-3 py-1 text-micro text-muted-foreground">
                {s.name}
              </span>
            ))}
          </CardContent>
        </Card>
      )}

      <Link href="/reality-check" className="block">
        <Card className="border-primary-100 bg-primary-50/30 transition-colors hover:bg-primary-50/60">
          <CardContent className="flex items-center justify-between gap-2.5 py-4 text-sm">
            <span className="flex items-center gap-2.5">
              <TestTube2 className="size-4 shrink-0 text-primary-700" />
              Run checks in your Portfolio (Quality Labs, AI Evaluation Studio, tests) to turn more of this tree green.
            </span>
            <span className="shrink-0 font-medium text-primary-700">Reality Check →</span>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}

function StorySection({ title, items, emptyHint }: { title: string; items: string[]; emptyHint: string }) {
  return (
    <div>
      <p className="text-micro font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      {items.length === 0 ? (
        <p className="mt-1 text-micro text-muted-foreground">{emptyHint}</p>
      ) : (
        <ul className="mt-1 list-disc pl-4 text-sm">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
