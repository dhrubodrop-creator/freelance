import "server-only";
import crypto from "crypto";

import { supabaseAdmin } from "@/lib/supabase/server";
import { computeMasteryForSkills, isVerifiedMasteryLevel, loadUserMasterySourceData } from "@/lib/mastery";
import type { CapstoneReviewRow, CapstoneSubmissionRow, CourseCapstoneRow, SkillRow } from "@/types/db";

/**
 * Section 38 — Shareable Proof Link. Deliberately redacted: skills/
 * capstone-scores/approved case studies/approved portfolio summaries only.
 * Never exposes: private repository names/tokens, verification-run detail,
 * AI conversation/simulation transcripts, or unapproved content.
 */

export async function getOrCreateProofShareToken(userId: string): Promise<string> {
  const supabase = supabaseAdmin();
  const { data: existing } = await supabase.from("proof_share_tokens").select("token").eq("user_id", userId).maybeSingle();
  if (existing) return existing.token;

  const token = crypto.randomBytes(16).toString("hex");
  const { error } = await supabase.from("proof_share_tokens").insert({ user_id: userId, token });
  if (error) {
    const { data: raceWinner } = await supabase.from("proof_share_tokens").select("token").eq("user_id", userId).maybeSingle();
    if (raceWinner) return raceWinner.token;
    throw new Error("Couldn't create a proof share link.");
  }
  return token;
}

export async function revokeProofShareToken(userId: string): Promise<boolean> {
  const supabase = supabaseAdmin();
  const { error } = await supabase.from("proof_share_tokens").delete().eq("user_id", userId);
  return !error;
}

export interface PublicProof {
  name: string | null;
  skills: { name: string; level: string }[];
  capstones: { title: string; avgScore: number | null }[];
  projects: { title: string; description: string | null; caseStudy: string | null; liveUrl: string | null }[];
}

export async function getPublicProofByToken(token: string): Promise<PublicProof | null> {
  const supabase = supabaseAdmin();
  const { data: tokenRow } = await supabase.from("proof_share_tokens").select("user_id").eq("token", token).maybeSingle();
  if (!tokenRow) return null;
  const userId = tokenRow.user_id;

  const [{ data: user }, { data: skills }, masteryData, { data: submissions }, { data: portfolioItems }] = await Promise.all([
    supabase.from("users").select("name").eq("id", userId).maybeSingle(),
    supabase.from("skills").select("*").order("name"),
    loadUserMasterySourceData(userId),
    supabase.from("capstone_submissions").select("*").eq("user_id", userId).eq("status", "reviewed"),
    supabase.from("portfolio_items").select("id, title, description, links").eq("user_id", userId),
  ]);

  const allSkills = (skills ?? []) as SkillRow[];
  const mastery = computeMasteryForSkills(allSkills.map((s) => s.id), masteryData);
  const skillById = new Map(allSkills.map((s) => [s.id, s]));
  const demonstratedSkills = mastery
    .filter((m) => isVerifiedMasteryLevel(m.level))
    .map((m) => ({ name: skillById.get(m.skillId)?.name ?? "", level: m.level }))
    .filter((s) => s.name);

  const reviewedSubmissions = (submissions ?? []) as CapstoneSubmissionRow[];
  let capstones: { title: string; avgScore: number | null }[] = [];
  if (reviewedSubmissions.length > 0) {
    const [{ data: capstoneRows }, { data: reviewRows }] = await Promise.all([
      supabase.from("course_capstones").select("*").in("id", reviewedSubmissions.map((s) => s.capstone_id)),
      supabase.from("capstone_reviews").select("*").in("submission_id", reviewedSubmissions.map((s) => s.id)),
    ]);
    const capstoneById = new Map(((capstoneRows ?? []) as CourseCapstoneRow[]).map((c) => [c.id, c]));
    const reviewBySubmission = new Map(((reviewRows ?? []) as CapstoneReviewRow[]).map((r) => [r.submission_id, r]));
    capstones = reviewedSubmissions
      .map((s) => {
        const capstone = capstoneById.get(s.capstone_id);
        const review = reviewBySubmission.get(s.id);
        if (!capstone || !review) return null;
        const scores = Object.values(review.dimension_scores);
        const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b.score, 0) / scores.length) : null;
        return { title: capstone.title, avgScore: avg };
      })
      .filter((x): x is { title: string; avgScore: number | null } => Boolean(x));
  }

  const itemIds = (portfolioItems ?? []).map((i) => i.id);
  const { data: caseStudies } = itemIds.length > 0
    ? await supabase.from("portfolio_case_studies").select("portfolio_item_id, short_version, approved").in("portfolio_item_id", itemIds).eq("approved", true)
    : { data: [] };
  const caseStudyByItem = new Map((caseStudies ?? []).map((c) => [c.portfolio_item_id, c.short_version]));

  const projects = (portfolioItems ?? []).map((i) => ({
    title: i.title,
    description: i.description,
    caseStudy: caseStudyByItem.get(i.id) ?? null,
    liveUrl: i.links.find((l: string) => /^https?:\/\//.test(l)) ?? null,
  }));

  return { name: user?.name ?? null, skills: demonstratedSkills, capstones, projects };
}
