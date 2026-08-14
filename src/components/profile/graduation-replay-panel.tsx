"use client";

import * as React from "react";
import { toast } from "sonner";
import { ChevronDown, CheckCircle2, Circle, GraduationCap, Loader2 } from "lucide-react";

import type { GraduationStage } from "@/lib/graduation-replay";

const STAGE_LABEL: Record<GraduationStage["stage"], string> = {
  idea: "Idea",
  plan: "Plan",
  build: "Build",
  fail: "Fail",
  debug: "Debug",
  test: "Test",
  deploy: "Deploy",
  defend: "Defend",
  prove: "Prove",
};

export function GraduationReplayPanel({ portfolioItemId }: { portfolioItemId: string }) {
  const [expanded, setExpanded] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [stages, setStages] = React.useState<GraduationStage[] | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/portfolio/${portfolioItemId}/graduation-replay`);
      const data = await res.json();
      if (!res.ok) throw new Error();
      setStages(data.stages);
    } catch {
      toast.error("Couldn't load the graduation replay.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-border">
      <button
        type="button"
        onClick={() => {
          setExpanded((e) => !e);
          if (!stages && !expanded) void load();
        }}
        className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-sm font-medium"
      >
        <span className="flex items-center gap-1.5">
          <GraduationCap className="size-3.5" /> Graduation replay
        </span>
        <ChevronDown className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && (
        <div className="flex flex-col gap-2.5 border-t border-border p-3.5 text-sm">
          {loading && <Loader2 className="size-4 animate-spin" />}
          {stages?.map((s) => (
            <div key={s.stage} className="flex items-start gap-2.5">
              {s.reached ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
              ) : (
                <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground/40" />
              )}
              <div>
                <p className="font-medium">{STAGE_LABEL[s.stage]}</p>
                <p className="text-micro text-muted-foreground">{s.summary}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
