import "server-only";

import { supabaseAdmin } from "@/lib/supabase/server";
import { buildSellableOffers } from "@/lib/commercial-offers";
import { computeMomentum } from "@/lib/momentum";
import { computeMasteryForSkills, isVerifiedMasteryLevel, loadUserMasterySourceData } from "@/lib/mastery";

/**
 * One-Person Business OS — an 11-stage readiness view, computed entirely
 * from real existing data (no new AI call, no fabricated "you're ready"
 * claims). Ropes genuinely doesn't track some stages (acquisition/outreach
 * activity) — those are honestly reported "Not configured" rather than
 * guessed, matching the brief's own example.
 */
export type StageStatus = "defined" | "needs_attention" | "not_configured";

export interface BusinessStage {
  key: string;
  label: string;
  status: StageStatus;
  evidence: string;
  missing: string | null;
  nextAction: { label: string; href: string } | null;
}

export async function buildOnePersonBusinessPlan(userId: string): Promise<BusinessStage[]> {
  const supabase = supabaseAdmin();

  const [{ data: allSkills }, masteryData, offers, momentum, { data: proposals }, { data: monetisationPlan }, { data: clientSims }] =
    await Promise.all([
      supabase.from("skills").select("id"),
      loadUserMasterySourceData(userId),
      buildSellableOffers(userId),
      computeMomentum(userId, 90),
      supabase.from("proposals").select("id, buyer_type, pricing_structure").eq("user_id", userId),
      supabase.from("monetisation_plans").select("id").eq("user_id", userId).maybeSingle(),
      supabase.from("simulation_sessions").select("id").eq("user_id", userId).eq("simulation_type", "client").eq("status", "completed"),
    ]);

  const mastery = computeMasteryForSkills((allSkills ?? []).map((s) => s.id), masteryData);
  const verifiedCount = mastery.filter((m) => isVerifiedMasteryLevel(m.level)).length;
  const topOffer = offers[0] ?? null;
  const hasRealPricing = (proposals ?? []).some((p) => p.pricing_structure && p.pricing_structure !== "USER INPUT REQUIRED");
  const hasRealBuyer = (proposals ?? []).some((p) => p.buyer_type);
  // Project -> Offer -> Proposal loop wiring: send the learner into a proposal already
  // carrying their strongest real offer, not a blank form.
  const proposalHref = topOffer ? topOffer.nextAction.href : "/dashboard?openProposal=1";

  function stage(key: string, label: string, defined: boolean, evidenceYes: string, evidenceNo: string, nextAction: { label: string; href: string } | null): BusinessStage {
    return {
      key,
      label,
      status: defined ? "defined" : "needs_attention",
      evidence: defined ? evidenceYes : evidenceNo,
      missing: defined ? null : evidenceNo,
      nextAction: defined ? null : nextAction,
    };
  }

  return [
    stage("expertise", "Expertise", verifiedCount > 0, `${verifiedCount} verified skill(s).`, "No verified skills yet.", { label: "Build evidence", href: "/portfolio" }),
    stage("niche", "Niche", Boolean(topOffer), topOffer ? `${topOffer.offerName} is your strongest offer.` : "No niche has enough verified evidence yet.", "No niche defined yet.", { label: "See what you can sell", href: "/what-can-i-sell" }),
    stage("buyer", "Target buyer", hasRealBuyer, "You've defined a real buyer type in a proposal.", "No buyer type defined yet — a proposal captures this.", { label: "Generate a proposal", href: proposalHref }),
    stage("problem", "Problem", Boolean(topOffer?.problem), topOffer ? topOffer.problem : "Not yet defined.", "No problem statement defined yet.", { label: "See what you can sell", href: "/what-can-i-sell" }),
    stage("service", "Service", Boolean(topOffer), topOffer ? `Supported by ${topOffer.verifiedSkills.length} verified skill(s).` : "No service backed by verified evidence yet.", "No service defined yet.", { label: "See what you can sell", href: "/what-can-i-sell" }),
    stage("proof", "Proof", Boolean(topOffer && topOffer.supportingEvidence.length > 0), topOffer ? topOffer.supportingEvidence.join(", ") || "No supporting evidence yet." : "No proof yet.", "No supporting evidence yet.", { label: "Run a verification check", href: "/portfolio" }),
    stage("offer", "Offer", Boolean(monetisationPlan), "You have a monetisation plan.", "No monetisation plan generated yet.", { label: "Generate a plan", href: "/dashboard" }),
    stage("pricing", "Pricing", hasRealPricing, "You have a real pricing structure on a proposal.", "USER INPUT REQUIRED — no real pricing entered yet.", { label: "Generate a proposal", href: proposalHref }),
    { key: "acquisition", label: "Acquisition", status: "not_configured", evidence: "Ropes doesn't track outreach/acquisition activity yet — this is on you.", missing: null, nextAction: { label: "Review opportunities", href: "/opportunities" } },
    stage("delivery", "Delivery", (clientSims ?? []).length > 0, "You've completed a real client simulation.", "No client simulation completed yet.", { label: "Practice Client Mode", href: "/simulations" }),
    stage("repeatability", "Repeatability", momentum.total > 0, `${momentum.total} meaningful action(s) in the last ${momentum.windowDays} days.`, "No recent meaningful activity yet.", { label: "See your momentum", href: "/growth" }),
  ];
}
