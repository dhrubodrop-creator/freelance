"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, RefreshCcw, Target } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DailyMissionRow } from "@/types/db";

export function DailyMissionCard({
  mission,
  courseSlug,
}: {
  mission: DailyMissionRow | null;
  courseSlug: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<"regenerate" | "start" | "skip" | null>(null);

  async function updateStatus(status: "in_progress" | "skipped") {
    if (!mission) return;
    setLoading(status === "in_progress" ? "start" : "skip");
    try {
      const res = await fetch(`/api/daily-mission/${mission.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      toast.error("Couldn't update your mission. Try again.");
    } finally {
      setLoading(null);
    }
  }

  async function regenerate() {
    setLoading("regenerate");
    try {
      const res = await fetch("/api/daily-mission", { method: "POST" });
      if (res.status === 409) {
        toast.info("Today's mission is already in progress — finish or skip it first.");
        return;
      }
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      toast.error("Couldn't refresh your mission. Try again.");
    } finally {
      setLoading(null);
    }
  }

  if (!mission) {
    return (
      <Card className="border-border bg-muted/30">
        <CardContent className="py-6 text-sm text-muted-foreground">
          Enroll in a course to get a daily mission — one clear priority task, picked from your actual progress.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-accent/40 bg-gradient-to-br from-accent-50 to-background">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <Badge variant="accent" className="gap-1">
            <Target className="size-3" />
            Today&rsquo;s mission
          </Badge>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-micro text-muted-foreground">
              <Clock className="size-3" />
              ~{mission.estimated_minutes} min
            </span>
            {mission.status === "pending" && (
              <Button variant="ghost" size="sm" onClick={regenerate} disabled={loading !== null}>
                <RefreshCcw className={`size-3.5 ${loading === "regenerate" ? "animate-spin" : ""}`} />
              </Button>
            )}
          </div>
        </div>
        <CardTitle className="text-h4">{mission.objective}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">{mission.why_it_matters}</p>

        {mission.acceptance_criteria.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <p className="text-micro font-semibold uppercase tracking-wide text-muted-foreground">Done when</p>
            {mission.acceptance_criteria.map((criterion) => (
              <div key={criterion} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                <span>{criterion}</span>
              </div>
            ))}
          </div>
        )}

        {mission.status === "completed" ? (
          <Badge variant="outline" className="w-fit gap-1 border-success text-success">
            <CheckCircle2 className="size-3.5" />
            Completed today
          </Badge>
        ) : mission.status === "skipped" ? (
          <Badge variant="outline" className="w-fit">
            Skipped for today
          </Badge>
        ) : (
          <div className="flex flex-wrap gap-2">
            {courseSlug && (
              <Button
                asChild
                variant="outline"
                size="sm"
                onClick={() => mission.status === "pending" && updateStatus("in_progress")}
              >
                <Link href={mission.module_id ? `/courses/${courseSlug}/learn/${mission.module_id}` : `/courses/${courseSlug}/learn`}>
                  Continue <CheckCircle2 className="size-4" />
                </Link>
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => updateStatus("skipped")} disabled={loading !== null}>
              {loading === "skip" ? "Skipping..." : "Skip today"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
