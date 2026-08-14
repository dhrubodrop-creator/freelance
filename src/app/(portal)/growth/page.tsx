import Link from "next/link";
import { redirect } from "next/navigation";
import { Flame, Rocket, Sparkles, TestTube2, Trophy } from "lucide-react";

import { getCurrentUser } from "@/lib/current-user";
import { supabaseAdmin } from "@/lib/supabase/server";
import { computeMasteryForSkills, loadUserMasterySourceData } from "@/lib/mastery";
import { computeMomentum } from "@/lib/momentum";
import { generateWeeklyBuildStory } from "@/lib/weekly-story";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MasteryLevel, SkillCategoryRow, SkillRow } from "@/types/db";

const LEVEL_VARIANT: Record<MasteryLevel, "outline" | "accent" | "success"> = {
  not_started: "outline",
  learning: "outline",
  practicing: "outline",
  demonstrated: "success",
  strong: "accent",
};

export default async function GrowthPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const supabase = supabaseAdmin();
  const [{ data: categories }, { data: skills }, masteryData, momentum, story] = await Promise.all([
    supabase.from("skill_categories").select("*").order("name"),
    supabase.from("skills").select("*").order("name"),
    loadUserMasterySourceData(user.id),
    computeMomentum(user.id),
    generateWeeklyBuildStory(user.id),
  ]);

  const allSkills = (skills ?? []) as SkillRow[];
  const mastery = computeMasteryForSkills(allSkills.map((s) => s.id), masteryData);
  const masteryBySkill = new Map(mastery.map((m) => [m.skillId, m.level]));
  const skillsByCategory = new Map<string, SkillRow[]>();
  for (const skill of allSkills) {
    const list = skillsByCategory.get(skill.category_id) ?? [];
    list.push(skill);
    skillsByCategory.set(skill.category_id, list);
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
          <StorySection title="Built" items={story.built} />
          <StorySection title="Failed" items={story.failed} />
          <StorySection title="Fixed" items={story.fixed} />
          <StorySection title="Learned" items={story.learned} />
          <StorySection title="Next" items={story.next} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4 text-accent-600" /> Skill tree
          </CardTitle>
          <CardDescription>Lit up only where you have real evidence — self-ratings alone don&rsquo;t count.</CardDescription>
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
                    const level = masteryBySkill.get(skill.id) ?? "not_started";
                    return (
                      <Badge key={skill.id} variant={LEVEL_VARIANT[level]} className={level === "not_started" ? "opacity-40" : ""}>
                        {skill.name}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

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

function StorySection({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-micro font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      {items.length === 0 ? (
        <p className="mt-1 text-micro text-muted-foreground">Nothing this week.</p>
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
