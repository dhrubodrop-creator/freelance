import { redirect } from "next/navigation";
import { ExternalLink, TrendingUp, TrendingDown, Minus } from "lucide-react";

import { getCurrentUser } from "@/lib/current-user";
import { supabaseAdmin } from "@/lib/supabase/server";
import { computeMasteryForSkills, loadUserMasterySourceData } from "@/lib/mastery";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MarketSignalRow, SkillCategoryRow, SkillRow } from "@/types/db";

const DIRECTION_ICON = { rising: TrendingUp, declining: TrendingDown, stable: Minus } as const;
const DIRECTION_COLOR = {
  rising: "text-success",
  declining: "text-destructive",
  stable: "text-muted-foreground",
} as const;

export default async function MarketPulsePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const supabase = supabaseAdmin();
  const [{ data: userSkillRows }, { data: allSkills }, { data: categories }, { data: signals }, masteryData] =
    await Promise.all([
      supabase.from("user_skills").select("skill_id").eq("user_id", user.id),
      supabase.from("skills").select("*"),
      supabase.from("skill_categories").select("*").order("name"),
      supabase.from("market_signals").select("*").order("observed_at", { ascending: false }),
      loadUserMasterySourceData(user.id),
    ]);

  const allSkillRows = (allSkills ?? []) as SkillRow[];
  const skillById = new Map(allSkillRows.map((s) => [s.id, s]));

  // Personalise on the union of self-reported skills AND skills with real
  // evidence (a completed module, even if the learner never got around to
  // self-rating it) — a learner shouldn't see the generic feed just because
  // they haven't visited /skills yet when their course progress already
  // says otherwise.
  const mastery = computeMasteryForSkills(allSkillRows.map((s) => s.id), masteryData);
  const evidenceSkillIds = new Set(
    mastery.filter((m) => m.level !== "not_started").map((m) => m.skillId)
  );
  const myCategoryIds = new Set(
    [...(userSkillRows ?? []).map((us) => us.skill_id), ...Array.from(evidenceSkillIds)]
      .map((skillId) => skillById.get(skillId)?.category_id)
      .filter((id): id is string => Boolean(id))
  );

  const allSignals = (signals ?? []) as MarketSignalRow[];
  const myCategories = ((categories ?? []) as SkillCategoryRow[]).filter((c) => myCategoryIds.has(c.id));
  const mySignals = allSignals.filter((s) => myCategoryIds.has(s.category_id));
  const categoryById = new Map(((categories ?? []) as SkillCategoryRow[]).map((c) => [c.id, c]));

  const personalised = myCategoryIds.size > 0;
  const signalsToShow = personalised ? mySignals : allSignals;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-h2 font-bold">Market Pulse</h1>
        <p className="mt-1 text-muted-foreground">
          {personalised
            ? `Signals relevant to your skills and course progress in ${myCategories.map((c) => c.name).join(", ")}.`
            : "Add skills or make progress in a course to see signals filtered to what's relevant to you — showing everything for now."}
        </p>
      </div>

      {signalsToShow.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No market signals recorded yet for this area.
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {signalsToShow.map((signal) => {
          const Icon = DIRECTION_ICON[signal.direction];
          const category = categoryById.get(signal.category_id);
          return (
            <Card key={signal.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {category && <Badge variant="outline">{category.name}</Badge>}
                    <Badge variant={signal.confidence === "verified" ? "success" : "outline"}>
                      {signal.confidence}
                    </Badge>
                  </div>
                  <Icon className={`size-4 shrink-0 ${DIRECTION_COLOR[signal.direction]}`} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{signal.signal}</p>
                <div className="mt-2 flex items-center gap-1.5 text-micro text-muted-foreground">
                  <span>
                    Source: {signal.source} · {signal.region} · {new Date(signal.observed_at).toLocaleDateString("en-IN", { year: "numeric", month: "short" })}
                  </span>
                  {signal.source_url && (
                    <a href={signal.source_url} target="_blank" rel="noreferrer noopener" className="text-accent-600 hover:underline">
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-micro text-muted-foreground">
        Every signal above is a cited, real fact — not a live feed. This page shows the latest verified
        market data collected for each skill area; it refreshes as new research is added, not continuously.
      </p>
    </div>
  );
}
