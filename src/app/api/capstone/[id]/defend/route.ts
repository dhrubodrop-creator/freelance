import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabase/server";
import { generateCapstoneReview } from "@/lib/capstone";
import { buildVerificationEvidenceSummary, isCapstonePassed } from "@/lib/capstone-evidence";
import { logEvent } from "@/lib/analytics";
import { createNotification } from "@/lib/notifications";
import type { CourseCapstoneRow, PortfolioItemRow, ProjectDecisionRow } from "@/types/db";

const bodySchema = z.object({
  answers: z.array(z.object({ question: z.string(), answer: z.string().min(1).max(2000) })).min(1),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: capstoneId } = await params;
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const supabase = supabaseAdmin();
  const { data: user } = await supabase.from("users").select("id").eq("clerk_id", userId).maybeSingle();
  if (!user) return NextResponse.json({ error: "User record not found — try refreshing." }, { status: 404 });

  const { data: submission } = await supabase
    .from("capstone_submissions")
    .select("*")
    .eq("user_id", user.id)
    .eq("capstone_id", capstoneId)
    .maybeSingle();
  if (!submission) return NextResponse.json({ error: "No submission in progress for this capstone" }, { status: 404 });

  const [{ data: capstone }, { data: item }, { data: decisions }] = await Promise.all([
    supabase.from("course_capstones").select("*").eq("id", capstoneId).maybeSingle(),
    supabase.from("portfolio_items").select("*").eq("id", submission.portfolio_item_id).maybeSingle(),
    supabase.from("project_decisions").select("*").eq("portfolio_item_id", submission.portfolio_item_id).order("order_index"),
  ]);
  if (!capstone || !item) return NextResponse.json({ error: "Submission data missing" }, { status: 404 });
  const capstoneRow = capstone as CourseCapstoneRow;

  await supabase
    .from("capstone_submissions")
    .update({ status: "submitted_for_review", updated_at: new Date().toISOString() })
    .eq("id", submission.id);

  const evidenceSummary = await buildVerificationEvidenceSummary(item.id);

  const review = await generateCapstoneReview({
    capstoneTitle: capstoneRow.title,
    brief: capstoneRow.brief,
    scoringDimensions: capstoneRow.scoring_dimensions,
    item: item as PortfolioItemRow,
    decisions: (decisions ?? []) as ProjectDecisionRow[],
    defenceAnswers: parsed.data.answers,
    evidenceSummary,
    userId: user.id,
  });

  if (!review) {
    return NextResponse.json(
      { error: "The review engine couldn't score this right now — try submitting your defence again in a moment." },
      { status: 502 }
    );
  }

  const { data: updatedReview, error: reviewError } = await supabase
    .from("capstone_reviews")
    .update({
      defence_answers: parsed.data.answers,
      dimension_scores: review.dimensionScores,
      overall_feedback: review.overallFeedback,
      strengths: review.strengths,
      weaknesses: review.weaknesses,
      missing: review.missing,
      improvements: review.improvements,
      generated_at: new Date().toISOString(),
    })
    .eq("submission_id", submission.id)
    .select()
    .single();
  if (reviewError) return NextResponse.json({ error: reviewError.message }, { status: 500 });

  await supabase
    .from("capstone_submissions")
    .update({ status: "reviewed", updated_at: new Date().toISOString() })
    .eq("id", submission.id);

  // Close the learning -> capstone -> demonstrated-skill loop: a capstone
  // that clears the canonical bare-pass bar (see isCapstonePassed() —
  // never award evidence for work that didn't actually demonstrate the
  // skill) auto-tags its portfolio item with every skill this course
  // teaches, the same portfolio_item_skills join computeMasteryForSkills
  // already reads. Without this, a learner would have to manually re-tag
  // skills the capstone already proved, and Proof Profile / Market Pulse /
  // monetisation would stay blind to a passed capstone until they did.
  const passed = isCapstonePassed(review.dimensionScores);
  if (passed) {
    const { data: courseModules } = await supabase.from("modules").select("id").eq("course_id", capstoneRow.course_id);
    const moduleIds = (courseModules ?? []).map((m) => m.id);
    if (moduleIds.length > 0) {
      const { data: moduleSkillRows } = await supabase.from("module_skills").select("skill_id").in("module_id", moduleIds);
      const courseSkillIds = Array.from(new Set((moduleSkillRows ?? []).map((r) => r.skill_id)));
      if (courseSkillIds.length > 0) {
        await supabase
          .from("portfolio_item_skills")
          .upsert(
            courseSkillIds.map((skill_id) => ({ portfolio_item_id: item.id, skill_id })),
            { onConflict: "portfolio_item_id,skill_id", ignoreDuplicates: true }
          );
      }
    }
  }

  await logEvent(user.id, "capstone_reviewed", { capstoneId, portfolioItemId: item.id, passed });
  await createNotification(
    user.id,
    "capstone_reviewed",
    "Your capstone defence has been scored",
    review.overallFeedback,
    "/portfolio"
  );

  return NextResponse.json({ review: updatedReview });
}
