import "server-only";

import { supabaseAdmin } from "@/lib/supabase/server";
import { computeMasteryForSkills, isVerifiedMasteryLevel, loadUserMasterySourceData } from "@/lib/mastery";
import { computeSkillGap } from "@/lib/skill-gap";
import { isCapstonePassed } from "@/lib/capstone-evidence";

/**
 * Outcome Engine — "Next Best Move" and "Make Me Ready" (brief phases 2-3).
 * Deliberately, entirely deterministic — no AI call anywhere in this file
 * (per the brief's own cost-discipline phase: "never call the 120B model
 * simply to calculate percentages/statuses/counts/deterministic
 * recommendations"). Every "why" string is a template filled with real,
 * already-computed facts, never generated text — this is enough to satisfy
 * "the system must explain why," and it costs nothing.
 *
 * Candidates are ranked once; Next Best Move is candidates[0], Make Me
 * Ready is the full ordered list — one engine, not two.
 */

export type OutcomeAction =
  | "take_diagnostic"
  | "complete_module"
  | "complete_exercise"
  | "fix_verification"
  | "start_capstone"
  | "defend_capstone"
  | "create_portfolio_proof"
  | "close_skill_gap"
  | "generate_monetisation_plan"
  | "generate_proposal"
  | "review_opportunity"
  | "keep_building";

export interface OutcomeCandidate {
  action: OutcomeAction;
  title: string;
  why: string;
  href: string;
  evidence: string[];
}

export async function buildOutcomeCandidates(userId: string): Promise<OutcomeCandidate[]> {
  const supabase = supabaseAdmin();
  const candidates: OutcomeCandidate[] = [];

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("course_id, courses(id, slug, title, track)")
    .eq("user_id", userId)
    .eq("status", "active");
  const activeEnrollment = (enrollments ?? [])[0] as unknown as { course_id: string; courses: { id: string; slug: string; title: string; track: string | null } | null } | undefined;

  if (!activeEnrollment?.courses) {
    return [
      {
        action: "keep_building",
        title: "Browse a course track",
        why: "You don't have an active course yet — pick a track that matches your outcome goal to get started.",
        href: "/courses",
        evidence: [],
      },
    ];
  }
  const course = activeEnrollment.courses;

  const { data: diagnostic } = await supabase
    .from("course_diagnostics")
    .select("id")
    .eq("user_id", userId)
    .eq("course_id", course.id)
    .maybeSingle();
  if (!diagnostic) {
    candidates.push({
      action: "take_diagnostic",
      title: "Complete your diagnostic",
      why: "Ropes can't recommend your next move with real confidence until it knows what you already know — the diagnostic takes 2 minutes.",
      href: `/courses/${course.slug}/learn/diagnostic`,
      evidence: [],
    });
  }

  const { data: modulesData } = await supabase
    .from("modules")
    .select("id, title, order_index")
    .eq("course_id", course.id)
    .order("order_index");
  const modules = modulesData ?? [];
  const { data: progressRows } = await supabase
    .from("progress")
    .select("module_id, completed_at")
    .eq("user_id", userId)
    .in("module_id", modules.map((m) => m.id));
  const completedModuleIds = new Set((progressRows ?? []).filter((p) => p.completed_at).map((p) => p.module_id));
  const currentModule = modules.find((m) => !completedModuleIds.has(m.id));
  const courseComplete = modules.length > 0 && !currentModule;

  // Most recent project this learner has for this course (if any) — the
  // anchor for verification/capstone/proof candidates below.
  const { data: portfolioItems } = await supabase
    .from("portfolio_items")
    .select("id, title")
    .eq("user_id", userId)
    .eq("course_id", course.id)
    .order("created_at", { ascending: false })
    .limit(1);
  const project = (portfolioItems ?? [])[0] ?? null;

  if (project) {
    const { data: openRuns } = await supabase
      .from("project_verification_runs")
      .select("check_type, blockers, created_at")
      .eq("portfolio_item_id", project.id)
      .order("created_at", { ascending: false });
    const seen = new Set<string>();
    for (const run of openRuns ?? []) {
      if (seen.has(run.check_type)) continue;
      seen.add(run.check_type);
      if (Array.isArray(run.blockers) && run.blockers.length > 0) {
        candidates.push({
          action: "fix_verification",
          title: `Fix a ${run.check_type.replace(/_/g, " ")} issue in "${project.title}"`,
          why: `You have a working project, but a real ${run.check_type.replace(/_/g, " ")} check is failing: "${run.blockers[0]}" — fixing this directly strengthens your production-readiness evidence and your proof.`,
          href: "/portfolio",
          evidence: [run.blockers[0]],
        });
      }
    }
  }

  if (currentModule) {
    candidates.push({
      action: "complete_module",
      title: `Continue "${currentModule.title}"`,
      why: `This is the next module in ${course.title} you haven't completed — everything downstream (project, capstone, proof) builds on it.`,
      href: `/courses/${course.slug}/learn/${currentModule.id}`,
      evidence: [],
    });

    const { data: exercisesData } = await supabase.from("exercises").select("id, title").eq("module_id", currentModule.id);
    const exercises = exercisesData ?? [];
    if (exercises.length > 0) {
      const { data: completions } = await supabase
        .from("exercise_completions")
        .select("exercise_id")
        .eq("user_id", userId)
        .in("exercise_id", exercises.map((e) => e.id));
      const completedIds = new Set((completions ?? []).map((c) => c.exercise_id));
      const nextExercise = exercises.find((e) => !completedIds.has(e.id));
      if (nextExercise) {
        candidates.push({
          action: "complete_exercise",
          title: `Complete "${nextExercise.title}"`,
          why: "Practicing this exercise is what turns watching the lesson into real, checkable evidence you can do it.",
          href: `/courses/${course.slug}/learn/${currentModule.id}`,
          evidence: [],
        });
      }
    }
  }

  const { data: capstone } = await supabase.from("course_capstones").select("*").eq("course_id", course.id).maybeSingle();
  if (capstone && courseComplete) {
    const { data: submission } = await supabase
      .from("capstone_submissions")
      .select("*")
      .eq("user_id", userId)
      .eq("capstone_id", capstone.id)
      .maybeSingle();
    if (!submission && project) {
      candidates.push({
        action: "start_capstone",
        title: `Start your capstone: ${capstone.title}`,
        why: "You've finished the course content — the capstone is what turns that into a defended, scored piece of evidence a client or employer would actually respect.",
        href: "/portfolio",
        evidence: [],
      });
    } else if (submission && submission.status !== "reviewed") {
      candidates.push({
        action: "defend_capstone",
        title: "Defend your capstone",
        why: "Your capstone submission is waiting on your defence answers — this is the step that actually earns your verified skill evidence.",
        href: "/portfolio",
        evidence: [],
      });
    } else if (submission && submission.status === "reviewed") {
      const { data: review } = await supabase.from("capstone_reviews").select("dimension_scores").eq("submission_id", submission.id).maybeSingle();
      if (review && !isCapstonePassed(review.dimension_scores)) {
        candidates.push({
          action: "defend_capstone",
          title: "Improve and re-defend your capstone",
          why: "Your last capstone attempt didn't clear the passing bar yet — this is worth fixing before moving on, since it's what unlocks real skill evidence for this course.",
          href: "/portfolio",
          evidence: [],
        });
      }
    }
  }

  if (project) {
    const { data: caseStudy } = await supabase.from("portfolio_case_studies").select("approved").eq("portfolio_item_id", project.id).maybeSingle();
    if (!caseStudy || !caseStudy.approved) {
      candidates.push({
        action: "create_portfolio_proof",
        title: `Turn "${project.title}" into portfolio proof`,
        why: "You've built something real — generating and approving a case study is what makes it usable outside Ropes (resume bullets, interview story, shareable proof).",
        href: "/portfolio",
        evidence: [],
      });
    }
  }

  // Skill gap against the enrolled course's own track category.
  if (course.track) {
    const { data: categoryRow } = await supabase.from("skill_categories").select("id").eq("name", course.track).maybeSingle();
    if (categoryRow) {
      const [{ data: trackSkills }, { data: userSkillRows }] = await Promise.all([
        supabase.from("skills").select("*").eq("category_id", categoryRow.id),
        supabase.from("user_skills").select("skill_id").eq("user_id", userId),
      ]);
      const gap = computeSkillGap(trackSkills ?? [], new Set((userSkillRows ?? []).map((r) => r.skill_id)));
      if (gap.missing.length > 0) {
        candidates.push({
          action: "close_skill_gap",
          title: `Close a skill gap: ${gap.missing[0].name}`,
          why: `${course.title} expects ${gap.missing[0].name}, but you don't have evidence for it yet — practicing it directly improves your opportunity match rate.`,
          href: "/skills",
          evidence: gap.missing.slice(0, 3).map((s) => s.name),
        });
      }
    }
  }

  const { data: monetisationPlan } = await supabase.from("monetisation_plans").select("id").eq("user_id", userId).maybeSingle();
  const { data: allSkillRows } = await supabase.from("skills").select("id");
  const masteryData = await loadUserMasterySourceData(userId);
  const mastery = computeMasteryForSkills((allSkillRows ?? []).map((s) => s.id), masteryData);
  const verifiedCount = mastery.filter((m) => isVerifiedMasteryLevel(m.level)).length;

  if (!monetisationPlan && verifiedCount > 0) {
    candidates.push({
      action: "generate_monetisation_plan",
      title: "See how your skills could turn into income",
      why: `You have ${verifiedCount} verified skill(s) now — enough real evidence for Ropes to suggest a grounded monetisation path.`,
      href: "/dashboard",
      evidence: [],
    });
  }

  if (monetisationPlan) {
    const { count: proposalCount } = await supabase.from("proposals").select("id", { count: "exact", head: true }).eq("user_id", userId);
    if (!proposalCount) {
      candidates.push({
        action: "generate_proposal",
        title: "Generate your first proposal",
        why: "You have a monetisation plan but no proposal yet — a proposal is the concrete next step toward actually pitching this to a buyer.",
        href: "/dashboard",
        evidence: [],
      });
    }
  }

  const { data: opportunities } = await supabase.from("opportunities").select("id, title").order("posted_at", { ascending: false }).limit(1);
  if (opportunities && opportunities.length > 0) {
    candidates.push({
      action: "review_opportunity",
      title: `Review: ${opportunities[0].title}`,
      why: "A real, curated opportunity is available — worth checking your match before it's outdated.",
      href: "/opportunities",
      evidence: [],
    });
  }

  if (candidates.length === 0) {
    candidates.push({
      action: "keep_building",
      title: "Keep building",
      why: "You're caught up on everything Ropes can see right now — check back after your next study session.",
      href: "/dashboard",
      evidence: [],
    });
  }

  return candidates;
}

export async function getNextBestMove(userId: string): Promise<OutcomeCandidate> {
  const candidates = await buildOutcomeCandidates(userId);
  return candidates[0];
}

export async function getReadyPlan(userId: string): Promise<OutcomeCandidate[]> {
  return buildOutcomeCandidates(userId);
}

/**
 * Value-layer P1 — "If I were you" framing. A template restatement of the
 * already-ranked top candidate's own `why`, not a new opinion or a second
 * ranking system — the ranking logic lives once, in buildOutcomeCandidates.
 */
export function toIfIWereYou(candidate: OutcomeCandidate): string {
  return `If I were you, I'd do this next: ${candidate.why}`;
}
