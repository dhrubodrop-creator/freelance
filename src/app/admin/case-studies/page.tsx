import { supabaseAdmin } from "@/lib/supabase/server";
import { CaseStudiesTable } from "@/components/admin/case-studies-table";
import type { CaseStudyRow } from "@/types/db";

export default async function AdminCaseStudiesPage() {
  const { data } = await supabaseAdmin()
    .from("case_studies")
    .select("*")
    .order("created_at", { ascending: false });
  const caseStudies = (data ?? []) as CaseStudyRow[];

  return <CaseStudiesTable caseStudies={caseStudies} />;
}
