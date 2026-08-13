import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { supabaseAdmin } from "@/lib/supabase/server";
import { generatePortfolioCaseStudy } from "@/lib/portfolio-generation";
import type { PortfolioItemRow, ProjectDecisionRow } from "@/types/db";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: portfolioItemId } = await params;
  const supabase = supabaseAdmin();
  const { data: user } = await supabase.from("users").select("id").eq("clerk_id", userId).maybeSingle();
  if (!user) return NextResponse.json({ error: "User record not found — try refreshing." }, { status: 404 });

  const { data: item } = await supabase
    .from("portfolio_items")
    .select("*")
    .eq("id", portfolioItemId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!item) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const [{ data: decisions }, { data: skillLinks }] = await Promise.all([
    supabase.from("project_decisions").select("*").eq("portfolio_item_id", portfolioItemId).order("order_index"),
    supabase.from("portfolio_item_skills").select("skills(name)").eq("portfolio_item_id", portfolioItemId),
  ]);
  const skillNames = ((skillLinks ?? []) as unknown as { skills: { name: string } | null }[])
    .map((l) => l.skills?.name)
    .filter((n): n is string => Boolean(n));

  const generated = await generatePortfolioCaseStudy({
    item: item as PortfolioItemRow,
    decisions: (decisions ?? []) as ProjectDecisionRow[],
    skillNames,
    userId: user.id,
  });

  if (!generated) {
    return NextResponse.json(
      { error: "Couldn't generate that right now — try again in a moment." },
      { status: 502 }
    );
  }

  const { data: row, error } = await supabase
    .from("portfolio_case_studies")
    .upsert(
      {
        portfolio_item_id: portfolioItemId,
        case_study: generated.caseStudy,
        short_version: generated.shortVersion,
        resume_bullets: generated.resumeBullets,
        interview_story: generated.interviewStory,
        approved: false,
        generated_at: new Date().toISOString(),
      },
      { onConflict: "portfolio_item_id" }
    )
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ caseStudy: row });
}
