"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Compass, HelpCircle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { OutcomeCandidate } from "@/lib/outcome-engine";

// Mirrors lib/outcome-engine.ts's toIfIWereYou() exactly, duplicated here (not imported)
// because that module is server-only — this is a plain template restatement of the
// already-ranked candidate's own `why`, not a second ranking system.
function toIfIWereYou(candidate: OutcomeCandidate): string {
  return `If I were you, I'd do this next: ${candidate.why}`;
}

const ACTION_LABEL: Record<string, string> = {
  take_diagnostic: "Diagnostic",
  complete_module: "Learning",
  complete_exercise: "Practice",
  fix_verification: "Verification",
  start_capstone: "Capstone",
  defend_capstone: "Capstone",
  create_portfolio_proof: "Proof",
  close_skill_gap: "Skill gap",
  generate_monetisation_plan: "Monetisation",
  generate_proposal: "Business",
  review_opportunity: "Opportunity",
  keep_building: "Momentum",
};

/** Outcome Engine Phase 2 — single persistent "what should I do next" answer, universal action pattern (Phase 15): one primary CTA, one WHY toggle, nothing else competing for attention. */
export function NextBestMoveCard({ move }: { move: OutcomeCandidate }) {
  const [showWhy, setShowWhy] = useState(false);

  return (
    <Card className="border-accent/40 bg-gradient-to-br from-accent-50 to-background">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge variant="accent" className="gap-1">
            <Compass className="size-3" />
            Your next best move
          </Badge>
          <Badge variant="outline" className="text-micro">
            {ACTION_LABEL[move.action] ?? move.action}
          </Badge>
        </div>
        <CardTitle className="text-h4">{move.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setShowWhy((s) => !s)}
          className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <HelpCircle className="size-3.5" /> Why?
        </button>
        {showWhy && <p className="text-sm text-muted-foreground">{toIfIWereYou(move)}</p>}
        <Button asChild variant="accent" className="w-fit gap-1.5">
          <Link href={move.href}>
            Do this now <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
