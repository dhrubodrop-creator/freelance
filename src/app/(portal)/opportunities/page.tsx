import { redirect } from "next/navigation";
import { Briefcase, ExternalLink, MapPin } from "lucide-react";

import { getCurrentUser } from "@/lib/current-user";
import { supabaseAdmin } from "@/lib/supabase/server";
import { computeMatchScore } from "@/lib/opportunity-matching";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { OpportunityRow, SkillCategoryRow } from "@/types/db";

export default async function OpportunitiesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const supabase = supabaseAdmin();
  const [{ data: opportunities }, { data: categories }, { data: userSkillRows }, { data: oppSkillLinks }] =
    await Promise.all([
      supabase.from("opportunities").select("*").order("posted_at", { ascending: false }),
      supabase.from("skill_categories").select("*"),
      supabase.from("user_skills").select("skill_id").eq("user_id", user.id),
      supabase.from("opportunity_skills").select("opportunity_id, skill_id"),
    ]);

  const items = (opportunities ?? []) as OpportunityRow[];
  const categoryById = new Map(((categories ?? []) as SkillCategoryRow[]).map((c) => [c.id, c]));
  const userSkillIds = new Set((userSkillRows ?? []).map((r) => r.skill_id));

  const requiredByOpportunity = new Map<string, string[]>();
  for (const link of oppSkillLinks ?? []) {
    const list = requiredByOpportunity.get(link.opportunity_id) ?? [];
    list.push(link.skill_id);
    requiredByOpportunity.set(link.opportunity_id, list);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-h2 font-bold">Opportunities</h1>
        <p className="mt-1 text-muted-foreground">
          Real, curated opportunities only — nothing here is generated or invented.
        </p>
      </div>

      {items.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Briefcase className="size-8 text-muted-foreground" />
            <p className="font-medium">No opportunities listed yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              This is a real, empty state, not a placeholder — we haven&rsquo;t connected an external job/
              freelance feed yet, and don&rsquo;t list anything we haven&rsquo;t verified. Check back as real,
              curated opportunities are added.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((opp) => {
          const required = requiredByOpportunity.get(opp.id) ?? [];
          const score = computeMatchScore(userSkillIds, required);
          const category = opp.category_id ? categoryById.get(opp.category_id) : null;
          return (
            <Card key={opp.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{opp.title}</CardTitle>
                  {required.length > 0 && (
                    <Badge variant={score >= 60 ? "success" : "outline"} className="shrink-0">
                      Match: {score}%
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-micro text-muted-foreground">
                  <Badge variant="outline">{opp.type.replace("_", " ")}</Badge>
                  {category && <Badge variant="outline">{category.name}</Badge>}
                  {(opp.is_remote || opp.location) && (
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3" /> {opp.is_remote ? "Remote" : opp.location}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {opp.description && <p className="text-sm text-muted-foreground">{opp.description}</p>}
                {opp.compensation_range && <p className="text-sm font-medium">{opp.compensation_range}</p>}
                {opp.source_url && (
                  <a
                    href={opp.source_url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="flex items-center gap-1.5 text-sm text-accent-600 hover:underline"
                  >
                    <ExternalLink className="size-3.5" /> View source
                  </a>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
