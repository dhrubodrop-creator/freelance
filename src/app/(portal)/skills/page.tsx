import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/current-user";
import { supabaseAdmin } from "@/lib/supabase/server";
import { SkillsGrid } from "@/components/profile/skills-grid";
import type { SkillCategoryRow, SkillRow, UserSkillRow } from "@/types/db";

export default async function SkillsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const supabase = supabaseAdmin();
  const [{ data: categories }, { data: skills }, { data: userSkills }] = await Promise.all([
    supabase.from("skill_categories").select("*").order("name"),
    supabase.from("skills").select("*").order("name"),
    supabase.from("user_skills").select("*").eq("user_id", user.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-h2 font-bold">My Skills</h1>
        <p className="mt-1 text-muted-foreground">
          Self-assessed, not verified — add skills as you build real proof of them in your{" "}
          <span className="font-medium text-foreground">Portfolio</span>.
        </p>
      </div>
      <SkillsGrid
        categories={(categories ?? []) as SkillCategoryRow[]}
        skills={(skills ?? []) as SkillRow[]}
        userSkills={(userSkills ?? []) as UserSkillRow[]}
      />
    </div>
  );
}
