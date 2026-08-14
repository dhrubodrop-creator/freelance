"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ListChecks } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { OutcomeCandidate } from "@/lib/outcome-engine";

/** Outcome Engine Phase 3 — the shortest realistic ordered path to being ready, not a magic "do it for me" button; every step links to the real feature that does it. */
export function MakeMeReadyPanel({ plan }: { plan: OutcomeCandidate[] }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card>
      <CardHeader className="pb-3">
        <button type="button" onClick={() => setExpanded((e) => !e)} className="flex items-center justify-between gap-2 text-left">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <ListChecks className="size-4 text-accent-600" /> Make me ready
            </CardTitle>
            <CardDescription>Your realistic path, in order — not a promise, a plan.</CardDescription>
          </div>
          <ChevronDown className={`size-4 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
      </CardHeader>
      {expanded && (
        <CardContent className="flex flex-col gap-2">
          {plan.map((step, i) => (
            <div key={`${step.action}-${i}`} className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent-100 text-micro font-semibold text-accent-700">
                {i + 1}
              </span>
              <div className="flex-1">
                <p className="font-medium">{step.title}</p>
                <p className="text-micro text-muted-foreground">{step.why}</p>
              </div>
              <Button asChild size="sm" variant="ghost">
                <Link href={step.href}>Go</Link>
              </Button>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}
