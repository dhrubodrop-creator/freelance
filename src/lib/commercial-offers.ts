import "server-only";

import { supabaseAdmin } from "@/lib/supabase/server";
import { computeMasteryForSkills, isVerifiedMasteryLevel, loadUserMasterySourceData } from "@/lib/mastery";

/**
 * "What Can I Sell?" — deliberately NOT a redisplay of monetisation_plans
 * (the AI-generated narrative career plan on the dashboard). This is a
 * deterministic, per-skill-category SYNTHESIS across verified skills,
 * supporting projects, real verification evidence, and market signals —
 * genuinely new structure, zero new AI calls. A category becomes an
 * "offer" only when it has at least one VERIFIED (not self-reported) skill
 * — self-reported skills are shown as a strengthening note, never
 * presented as the basis of the offer itself.
 */

export interface SellableOffer {
  categoryId: string;
  offerName: string;
  targetBuyer: string;
  problem: string;
  deliverable: string;
  verifiedSkills: string[];
  selfReportedOnlySkills: string[];
  supportingProjects: { id: string; title: string }[];
  supportingEvidence: string[];
  readiness: number;
  missingEvidence: string[];
  marketSignal: { signal: string; source: string } | null;
  nextAction: { label: string; href: string };
}

export async function buildSellableOffers(userId: string): Promise<SellableOffer[]> {
  const supabase = supabaseAdmin();

  const [{ data: categories }, { data: allSkills }, masteryData, { data: userSkillRows }] = await Promise.all([
    supabase.from("skill_categories").select("*"),
    supabase.from("skills").select("id, name, category_id"),
    loadUserMasterySourceData(userId),
    supabase.from("user_skills").select("skill_id").eq("user_id", userId),
  ]);

  const mastery = computeMasteryForSkills((allSkills ?? []).map((s) => s.id), masteryData);
  const masteryBySkill = new Map(mastery.map((m) => [m.skillId, m.level]));
  const selfReportedIds = new Set((userSkillRows ?? []).map((r) => r.skill_id));

  const skillsByCategory = new Map<string, { id: string; name: string }[]>();
  for (const s of allSkills ?? []) {
    const list = skillsByCategory.get(s.category_id) ?? [];
    list.push({ id: s.id, name: s.name });
    skillsByCategory.set(s.category_id, list);
  }

  const offers: SellableOffer[] = [];

  for (const category of categories ?? []) {
    const categorySkills = skillsByCategory.get(category.id) ?? [];
    const verified = categorySkills.filter((s) => isVerifiedMasteryLevel(masteryBySkill.get(s.id) ?? "not_started"));
    if (verified.length === 0) continue; // never build an offer on self-reported evidence alone

    const selfReportedOnly = categorySkills.filter(
      (s) => selfReportedIds.has(s.id) && !isVerifiedMasteryLevel(masteryBySkill.get(s.id) ?? "not_started")
    );

    const verifiedSkillIds = verified.map((s) => s.id);
    const { data: linkedItemRows } = await supabase
      .from("portfolio_item_skills")
      .select("portfolio_item_id, skill_id, portfolio_items!inner(id, title, user_id, build_deliverable)")
      .in("skill_id", verifiedSkillIds)
      .eq("portfolio_items.user_id", userId);
    const projectMap = new Map<string, { id: string; title: string; build_deliverable: string | null }>();
    for (const row of (linkedItemRows ?? []) as unknown as { portfolio_items: { id: string; title: string; user_id: string; build_deliverable: string | null } | null }[]) {
      if (row.portfolio_items) projectMap.set(row.portfolio_items.id, row.portfolio_items);
    }
    const supportingProjects = Array.from(projectMap.values());

    const supportingEvidence: string[] = [];
    let passingRunCount = 0;
    let approvedCaseStudyCount = 0;
    if (supportingProjects.length > 0) {
      const itemIds = supportingProjects.map((p) => p.id);
      const [{ data: runs }, { data: caseStudies }] = await Promise.all([
        supabase.from("project_verification_runs").select("check_type, blockers").in("portfolio_item_id", itemIds),
        supabase.from("portfolio_case_studies").select("id, approved").in("portfolio_item_id", itemIds),
      ]);
      passingRunCount = (runs ?? []).filter((r) => !r.blockers || r.blockers.length === 0).length;
      approvedCaseStudyCount = (caseStudies ?? []).filter((c) => c.approved).length;
      if (passingRunCount > 0) supportingEvidence.push(`${passingRunCount} passing verification check(s)`);
      if (approvedCaseStudyCount > 0) supportingEvidence.push(`${approvedCaseStudyCount} approved case study`);
    }

    const { data: signalRows } = await supabase
      .from("market_signals")
      .select("signal, source")
      .eq("category_id", category.id)
      .order("observed_at", { ascending: false })
      .limit(1);
    const marketSignal = signalRows && signalRows.length > 0 ? { signal: signalRows[0].signal, source: signalRows[0].source } : null;

    const missingEvidence: string[] = [];
    if (supportingProjects.length === 0) missingEvidence.push("No project yet demonstrates this skill combination.");
    if (approvedCaseStudyCount === 0) missingEvidence.push("No approved case study for a supporting project.");
    if (passingRunCount === 0) missingEvidence.push("No passing verification check on a supporting project.");

    // Deterministic readiness — same "explainable weighted sum" pattern as
    // monetisation.ts's computeReadinessScore, scoped to this one offer.
    const readiness = Math.min(
      100,
      Math.round(verified.length * 15 + supportingProjects.length * 20 + passingRunCount * 10 + approvedCaseStudyCount * 20)
    );

    const primaryProject = supportingProjects[0] ?? null;
    const offerName = `${category.name} Service`;
    const targetBuyer = category.description
      ? `Buyers who need ${category.description.toLowerCase()}`
      : `Small businesses or teams needing ${category.name.toLowerCase()}`;

    // Project -> Offer -> Proposal loop wiring: carry this offer's real service type,
    // buyer type, and (if any) supporting project straight into the proposal form so
    // the journey doesn't dead-end into a blank form the user re-types from scratch.
    const proposalDeepLink = `/dashboard?openProposal=1&serviceType=${encodeURIComponent(offerName)}&buyerType=${encodeURIComponent(targetBuyer)}${
      primaryProject ? `&portfolioItemId=${encodeURIComponent(primaryProject.id)}` : ""
    }`;

    offers.push({
      categoryId: category.id,
      offerName,
      targetBuyer,
      problem: category.description ?? `Manual or missing ${category.name.toLowerCase()} capability`,
      deliverable: primaryProject?.build_deliverable ?? "USER INPUT REQUIRED",
      verifiedSkills: verified.map((s) => s.name),
      selfReportedOnlySkills: selfReportedOnly.map((s) => s.name),
      supportingProjects: supportingProjects.map((p) => ({ id: p.id, title: p.title })),
      supportingEvidence,
      readiness,
      missingEvidence,
      marketSignal,
      nextAction:
        readiness >= 60
          ? { label: "Build this offer into a proposal", href: proposalDeepLink }
          : { label: "Strengthen the evidence first", href: "/portfolio" },
    });
  }

  return offers.sort((a, b) => b.readiness - a.readiness);
}
