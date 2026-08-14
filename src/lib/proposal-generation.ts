import "server-only";

import { callAI } from "@/lib/ai/router";
import { supabaseAdmin } from "@/lib/supabase/server";
import { computeMasteryForSkills, isVerifiedMasteryLevel, loadUserMasterySourceData } from "@/lib/mastery";
import type { ProposalRow } from "@/types/db";

/**
 * Post-audit P1 fix — brief section 40 (Proposal Generator) was entirely
 * missing; the monetisation journey dead-ended at a checklist. Grounds
 * ONLY in: an approved case study (if the chosen project has one), the
 * project's own recorded facts, the learner's VERIFIED skills, and
 * explicit user-supplied inputs (service/buyer type, pricing). Never
 * invents clients, revenue, metrics, years of experience, or unseen tech —
 * unknowns are marked "USER INPUT REQUIRED" rather than filled in.
 */

const SYSTEM_PROMPT = `You draft a client-facing service proposal for a Ropes learner, grounded ONLY in the real,
verified facts given to you. You will be given: their verified skills (skills with real evidence — module completion +
practiced exercise + a portfolio project, or a passed capstone), an optional approved case study and/or project facts for
one specific project, an optional target opportunity they're proposing against, and explicit inputs they typed themselves
(service type, buyer type, and any pricing notes).

Absolute rules:
- Never invent a client name, past client, testimonial, revenue figure, performance metric, or years of experience —
  none of that was given to you, so none of it exists for this proposal.
- Never claim a technology, skill, or capability that isn't in the verified skills or project facts given.
- If something a real proposal would normally include is unknown (e.g. exact timeline, exact price, team size), write
  the literal string "USER INPUT REQUIRED" for that field rather than guessing or making up a plausible-sounding value.
- Pricing must be phrased as a suggested/indicative structure, never a guaranteed quote — the learner sets real numbers.

Respond with strict JSON only, no markdown, in this exact shape:
{
  "problemStatement": "<grounded in the buyer type / opportunity given, generic but real>",
  "proposedSolution": "<grounded in verified skills / project facts — no invented tech>",
  "scope": "<what's included>",
  "deliverables": ["<concrete deliverable>"],
  "timeline": "<realistic estimate or 'USER INPUT REQUIRED'>",
  "assumptions": ["<assumption the proposal depends on>"],
  "exclusions": ["<explicitly out of scope>"],
  "pricingStructure": "<suggested structure, indicative only, or 'USER INPUT REQUIRED' if no pricing input was given>",
  "nextStepCta": "<one concrete next action for the buyer>"
}`;

export interface GeneratedProposal {
  problemStatement: string;
  proposedSolution: string;
  scope: string;
  deliverables: string[];
  timeline: string;
  assumptions: string[];
  exclusions: string[];
  pricingStructure: string | null;
  nextStepCta: string;
}

export async function generateProposal(input: {
  userId: string;
  portfolioItemId?: string | null;
  opportunityId?: string | null;
  serviceType: string;
  buyerType: string;
  pricingNotes?: string | null;
}): Promise<{ proposal: ProposalRow } | { error: string }> {
  const supabase = supabaseAdmin();

  const [{ data: allSkills }, masteryData] = await Promise.all([
    supabase.from("skills").select("id, name"),
    loadUserMasterySourceData(input.userId),
  ]);
  const mastery = computeMasteryForSkills((allSkills ?? []).map((s) => s.id), masteryData);
  const skillNameById = new Map((allSkills ?? []).map((s) => [s.id, s.name]));
  const verifiedSkillNames = mastery
    .filter((m) => isVerifiedMasteryLevel(m.level))
    .map((m) => skillNameById.get(m.skillId))
    .filter((n): n is string => Boolean(n));

  if (verifiedSkillNames.length === 0) {
    return { error: "No verified skills yet — a proposal needs at least one demonstrated skill to ground itself in." };
  }

  let projectFacts: Record<string, unknown> | null = null;
  if (input.portfolioItemId) {
    const { data: item } = await supabase
      .from("portfolio_items")
      .select("title, description, problem, solution, outcome, tools_used")
      .eq("id", input.portfolioItemId)
      .eq("user_id", input.userId)
      .maybeSingle();
    if (!item) return { error: "Project not found." };
    const { data: caseStudy } = await supabase
      .from("portfolio_case_studies")
      .select("case_study, approved")
      .eq("portfolio_item_id", input.portfolioItemId)
      .eq("approved", true)
      .maybeSingle();
    projectFacts = { ...item, approvedCaseStudy: caseStudy?.case_study ?? null };
  }

  let opportunityFacts: Record<string, unknown> | null = null;
  if (input.opportunityId) {
    const { data: opp } = await supabase
      .from("opportunities")
      .select("title, description, type, compensation_range")
      .eq("id", input.opportunityId)
      .maybeSingle();
    if (opp) opportunityFacts = opp;
  }

  const result = await callAI({
    task: "proposal_generation",
    userId: input.userId,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: JSON.stringify({
          verifiedSkills: verifiedSkillNames,
          project: projectFacts,
          targetOpportunity: opportunityFacts,
          serviceType: input.serviceType,
          buyerType: input.buyerType,
          pricingNotes: input.pricingNotes ?? null,
        }),
      },
    ],
  });
  if (!result) return { error: "The proposal generator is unavailable right now. Try again shortly." };

  let generated: GeneratedProposal;
  try {
    const raw = result.content;
    generated = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1)) as GeneratedProposal;
    if (!generated.problemStatement || !generated.proposedSolution) throw new Error("incomplete");
  } catch {
    return { error: "Couldn't generate a proposal. Try again." };
  }

  const { data: inserted, error } = await supabase
    .from("proposals")
    .insert({
      user_id: input.userId,
      portfolio_item_id: input.portfolioItemId ?? null,
      opportunity_id: input.opportunityId ?? null,
      service_type: input.serviceType,
      buyer_type: input.buyerType,
      inputs: { pricingNotes: input.pricingNotes ?? null },
      problem_statement: generated.problemStatement,
      proposed_solution: generated.proposedSolution,
      scope: generated.scope,
      deliverables: generated.deliverables,
      timeline: generated.timeline,
      assumptions: generated.assumptions,
      exclusions: generated.exclusions,
      pricing_structure: generated.pricingStructure,
      next_step_cta: generated.nextStepCta,
    })
    .select("*")
    .single();
  if (error) return { error: "Couldn't save the proposal." };

  return { proposal: inserted as ProposalRow };
}

export async function approveProposal(userId: string, proposalId: string): Promise<boolean> {
  const supabase = supabaseAdmin();
  const { error } = await supabase.from("proposals").update({ approved: true }).eq("id", proposalId).eq("user_id", userId);
  return !error;
}

export async function listProposals(userId: string): Promise<ProposalRow[]> {
  const supabase = supabaseAdmin();
  const { data } = await supabase.from("proposals").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  return (data ?? []) as ProposalRow[];
}
