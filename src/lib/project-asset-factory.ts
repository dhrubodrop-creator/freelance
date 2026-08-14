import "server-only";

import { supabaseAdmin } from "@/lib/supabase/server";
import { isVerifiedMasteryLevel, computeMasteryForSkills, loadUserMasterySourceData } from "@/lib/mastery";

/**
 * Project Asset Factory — per-project checklist of what actually EXISTS,
 * not what a generate-button implies. "Completed" means the row/field is
 * real; "Verified" means real evidence backs it (a passing check, an
 * approved case study). Two assets Ropes doesn't persist anywhere
 * (README as a standalone artifact outside Build-From-My-Idea, and a demo
 * script) are honestly marked NOT_TRACKED rather than always-false or
 * fabricated.
 */
export type AssetStatus = "verified" | "created" | "missing" | "not_tracked";

export interface ProjectAsset {
  key: string;
  label: string;
  status: AssetStatus;
}

export async function buildProjectAssetFactory(userId: string, portfolioItemId: string): Promise<ProjectAsset[] | null> {
  const supabase = supabaseAdmin();
  const { data: item } = await supabase
    .from("portfolio_items")
    .select("id, architecture_note, architecture_diagram_mermaid")
    .eq("id", portfolioItemId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!item) return null;

  const [
    { data: runs },
    { data: caseStudy },
    { data: ideaPlan },
    { data: proposal },
    { data: skillLinks },
  ] = await Promise.all([
    supabase.from("project_verification_runs").select("check_type, blockers").eq("portfolio_item_id", portfolioItemId),
    supabase.from("portfolio_case_studies").select("resume_bullets, interview_story, approved").eq("portfolio_item_id", portfolioItemId).maybeSingle(),
    supabase.from("project_idea_plans").select("readme_content").eq("portfolio_item_id", portfolioItemId).maybeSingle(),
    supabase.from("proposals").select("id, approved").eq("portfolio_item_id", portfolioItemId).maybeSingle(),
    supabase.from("portfolio_item_skills").select("skill_id").eq("portfolio_item_id", portfolioItemId),
  ]);

  const runByType = new Map<string, boolean>(); // true = passing
  for (const r of runs ?? []) {
    if (!runByType.has(r.check_type)) runByType.set(r.check_type, !r.blockers || r.blockers.length === 0);
  }

  let hasVerifiedSkillLink = false;
  if (skillLinks && skillLinks.length > 0) {
    const { data: allSkills } = await supabase.from("skills").select("id");
    const masteryData = await loadUserMasterySourceData(userId);
    const mastery = computeMasteryForSkills((allSkills ?? []).map((s) => s.id), masteryData);
    const verifiedIds = new Set(mastery.filter((m) => isVerifiedMasteryLevel(m.level)).map((m) => m.skillId));
    hasVerifiedSkillLink = skillLinks.some((l) => verifiedIds.has(l.skill_id));
  }

  const checkAsset = (key: string, label: string, checkType: string): ProjectAsset => {
    if (!runByType.has(checkType)) return { key, label, status: "missing" };
    return { key, label, status: runByType.get(checkType) ? "verified" : "created" };
  };

  return [
    { key: "architecture", label: "Architecture", status: item.architecture_diagram_mermaid || item.architecture_note ? "created" : "missing" },
    { key: "readme", label: "README", status: ideaPlan?.readme_content ? "created" : "not_tracked" },
    checkAsset("tests", "Test evidence", "test_generation"),
    checkAsset("security", "Security report", "security"),
    checkAsset("performance", "Performance report", "performance"),
    checkAsset("ai_eval", "AI evaluation", "ai_evaluation"),
    { key: "case_study", label: "Case study", status: caseStudy ? (caseStudy.approved ? "verified" : "created") : "missing" },
    { key: "portfolio", label: "Portfolio listing", status: "created" },
    { key: "resume_bullets", label: "Resume bullets", status: caseStudy?.resume_bullets?.length ? "created" : "missing" },
    { key: "interview_story", label: "Interview story", status: caseStudy?.interview_story ? "created" : "missing" },
    { key: "service_offer", label: "Service offer", status: hasVerifiedSkillLink ? "verified" : "missing" },
    { key: "proposal", label: "Proposal", status: proposal ? (proposal.approved ? "verified" : "created") : "missing" },
    { key: "demo_script", label: "Demo script", status: "not_tracked" },
  ];
}
