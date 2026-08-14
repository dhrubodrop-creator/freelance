"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles, RefreshCw } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ProposalGeneratorDialog } from "@/components/portal/proposal-generator-dialog";
import type { MonetisationActionRow, MonetisationPlanRow } from "@/types/db";

export function MonetisationInsightCard({
  plan,
  actions,
  portfolioItems,
}: {
  plan: MonetisationPlanRow | null;
  actions: MonetisationActionRow[];
  portfolioItems: { id: string; title: string }[];
}) {
  const router = useRouter();
  const [generating, setGenerating] = React.useState(false);
  const [pendingActionId, setPendingActionId] = React.useState<string | null>(null);

  async function generate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/monetisation/generate", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(typeof data?.error === "string" ? data.error : "Something went wrong.");
      }
      toast.success(plan ? "Plan updated" : "Plan generated");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setGenerating(false);
    }
  }

  async function toggleAction(actionId: string, done: boolean) {
    setPendingActionId(actionId);
    try {
      const res = await fetch(`/api/monetisation/actions/${actionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done }),
      });
      if (!res.ok) throw new Error("Something went wrong.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPendingActionId(null);
    }
  }

  if (!plan) {
    return (
      <Card className="border-accent/40 bg-gradient-to-br from-accent-50 to-background">
        <CardHeader>
          <Badge variant="accent" className="w-fit gap-1">
            <Sparkles className="size-3" />
            Skill → Income insight
          </Badge>
          <CardTitle className="text-h4">See how your skills could turn into income</CardTitle>
          <CardDescription>
            Based on your profile, skills, and portfolio — a suggested path, not a promise.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="accent" onClick={generate} disabled={generating} className="gap-1.5">
            <Sparkles className="size-4" />
            {generating ? "Generating…" : "Generate my plan"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const sortedActions = [...actions].sort((a, b) => a.week_number - b.week_number);

  return (
    <Card className="border-accent/40 bg-gradient-to-br from-accent-50 to-background">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge variant="accent" className="gap-1">
            <Sparkles className="size-3" />
            Skill → Income insight
          </Badge>
          <Button variant="ghost" size="sm" onClick={generate} disabled={generating} className="gap-1.5">
            <RefreshCw className={generating ? "size-3.5 animate-spin" : "size-3.5"} />
            {generating ? "Updating…" : "Regenerate"}
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-heading text-2xl font-bold text-accent-600">{plan.readiness_score}</span>
          <div className="flex-1">
            <p className="text-micro font-semibold uppercase tracking-wide text-muted-foreground">
              Monetisation readiness
            </p>
            <Progress value={plan.readiness_score} className="mt-1 h-1.5" />
          </div>
        </div>
        <CardDescription className="pt-2">{plan.summary}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {plan.suggested_paths.length > 0 && (
          <div className="flex flex-col gap-3">
            {plan.suggested_paths.map((path) => (
              <div key={path.name} className="rounded-lg border border-border bg-background/60 p-3.5">
                <p className="text-sm font-semibold">{path.name}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{path.reasoning}</p>
                {path.skillsPresent.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {path.skillsPresent.map((s) => (
                      <Badge key={s} variant="success">
                        {s}
                      </Badge>
                    ))}
                    {path.skillsNeeded.map((s) => (
                      <Badge key={s} variant="outline">
                        {s}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {sortedActions.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-micro font-semibold uppercase tracking-wide text-muted-foreground">
              Your 4-week plan
            </p>
            {sortedActions.map((action) => (
              <label key={action.id} className="flex items-start gap-2.5 text-sm">
                <Checkbox
                  checked={action.done}
                  disabled={pendingActionId === action.id}
                  onCheckedChange={(checked) => toggleAction(action.id, checked === true)}
                  className="mt-0.5"
                />
                <span className={action.done ? "text-muted-foreground line-through" : ""}>
                  <span className="font-medium">Week {action.week_number}: </span>
                  {action.task}
                </span>
              </label>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <p className="text-micro text-muted-foreground">
            Illustrative and personalised to your current profile — not a guarantee of income or a job offer.
          </p>
          <ProposalGeneratorDialog portfolioItems={portfolioItems} />
        </div>
      </CardContent>
    </Card>
  );
}
