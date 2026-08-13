import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/current-user";
import { supabaseAdmin } from "@/lib/supabase/server";
import { computeMasteryForSkills, loadUserMasterySourceData } from "@/lib/mastery";
import { SkillsGrid } from "@/components/profile/skills-grid";
import type { SkillCategoryRow, SkillMastery, SkillRow, UserSkillRow } from "@/types/db";

export default async function SkillsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const supabase = supabaseAdmin();
  const [{ data: categories }, { data: skills }, { data: userSkills }, masteryData] = await Promise.all([
    supabase.from("skill_categories").select("*").order("name"),
    supabase.from("skills").select("*").order("name"),
    supabase.from("user_skills").select("*").eq("user_id", user.id),
    loadUserMasterySourceData(user.id),
  ]);

  const mastery = computeMasteryForSkills((skills ?? []).map((s) => s.id), masteryData);
  const masteryBySkillId: Record<string, SkillMastery> = Object.fromEntries(
    mastery.map((m) => [m.skillId, m])
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-h2 font-bold">My Skills</h1>
        <p className="mt-1 text-muted-foreground">
          Self-rating is what you add below. The evidence badge next to each skill is computed from
          what you&rsquo;ve actually done — completed modules, practiced exercises, and portfolio
          proof — not from your self-rating.
        </p>
      </div>
      <SkillsGrid
        categories={(categories ?? []) as SkillCategoryRow[]}
        skills={(skills ?? []) as SkillRow[]}
        userSkills={(userSkills ?? []) as UserSkillRow[]}
        masteryBySkillId={masteryBySkillId}
      />
    </div>
  );
}
