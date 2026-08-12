import { supabaseAdmin } from "@/lib/supabase/server";
import { OpportunitiesTable } from "@/components/admin/opportunities-table";
import type { OpportunityRow, SkillCategoryRow } from "@/types/db";

export default async function AdminOpportunitiesPage() {
  const supabase = supabaseAdmin();
  const [{ data: opportunities }, { data: categories }] = await Promise.all([
    supabase.from("opportunities").select("*").order("created_at", { ascending: false }),
    supabase.from("skill_categories").select("*").order("name"),
  ]);

  return (
    <OpportunitiesTable
      opportunities={(opportunities ?? []) as OpportunityRow[]}
      categories={(categories ?? []) as SkillCategoryRow[]}
    />
  );
}
