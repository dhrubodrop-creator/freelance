import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabase/server";
import { generateDefenceQuestions } from "@/lib/capstone";
import { logEvent } from "@/lib/analytics";
import type { CourseCapstoneRow, PortfolioItemRow, ProjectDecisionRow } from "@/types/db";

const bodySchema = z.object({ portfolioItemId: z.string().uuid() });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: capstoneId } = await params;
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const supabase = supabaseAdmin();
  const { data: user } = await supabase.from("users").select("id").eq("clerk_id", userId).maybeSingle();
  if (!user) return NextResponse.json({ error: "User record not found — try refreshing." }, { status: 404 });

  const { data: capstone } = await supabase
    .from("course_capstones")
    .select("*")
    .eq("id", capstoneId)
    .maybeSingle();
  if (!capstone) return NextResponse.json({ error: "Capstone not found" }, { status: 404 });
  const capstoneRow = capstone as CourseCapstoneRow;

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", capstoneRow.course_id)
    .eq("status", "active")
    .maybeSingle();
  if (!enrollment) return NextResponse.json({ error: "Not enrolled in this course" }, { status: 403 });

  const { data: item } = await supabase
    .from("portfolio_items")
    .select("*")
    .eq("id", parsed.data.portfolioItemId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!item) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const { data: decisions } = await supabase
    .from("project_decisions")
    .select("*")
    .eq("portfolio_item_id", item.id)
    .order("order_index");

  const { data: submission, error: submissionError } = await supabase
    .from("capstone_submissions")
    .upsert(
      {
        user_id: user.id,
        capstone_id: capstoneId,
        portfolio_item_id: item.id,
        status: "awaiting_defence_answers",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,capstone_id" }
    )
    .select()
    .single();
  if (submissionError) return NextResponse.json({ error: submissionError.message }, { status: 500 });

  const questions = await generateDefenceQuestions({
    capstoneTitle: capstoneRow.title,
    brief: capstoneRow.brief,
    requirements: capstoneRow.requirements,
    item: item as PortfolioItemRow,
    decisions: (decisions ?? []) as ProjectDecisionRow[],
    userId: user.id,
  });

  const { data: review, error: reviewError } = await supabase
    .from("capstone_reviews")
    .upsert(
      {
        submission_id: submission.id,
        defence_questions: questions,
        defence_answers: [],
        generated_at: new Date().toISOString(),
      },
      { onConflict: "submission_id" }
    )
    .select()
    .single();
  if (reviewError) return NextResponse.json({ error: reviewError.message }, { status: 500 });

  await logEvent(user.id, "capstone_started", { capstoneId, portfolioItemId: item.id });

  return NextResponse.json({ submission, review });
}
