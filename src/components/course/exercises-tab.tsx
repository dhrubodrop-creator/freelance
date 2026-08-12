"use client";

import * as React from "react";
import { Lightbulb, ChevronDown } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MarkdownContent } from "@/components/course/markdown-content";
import type { ExerciseRow } from "@/types/db";

const LEVEL_LABEL: Record<string, string> = {
  guided: "Level 1 · Guided",
  semi_guided: "Level 2 · Semi-guided",
  independent: "Level 3 · Independent",
  capstone: "Capstone",
};

const LEVEL_DESCRIPTION: Record<string, string> = {
  guided: "Every step specified — the goal is to understand the mechanics.",
  semi_guided: "You choose what to check within a given process — the goal is judgment.",
  independent: "Only the problem, data, and constraints — the goal is to simulate real work.",
  capstone: "A full end-to-end professional simulation.",
};

function ExerciseCard({ exercise }: { exercise: ExerciseRow }) {
  const [hintsShown, setHintsShown] = React.useState(0);
  const [solutionShown, setSolutionShown] = React.useState(false);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="accent">{LEVEL_LABEL[exercise.level] ?? exercise.level}</Badge>
        </div>
        <CardTitle className="text-base">{exercise.title}</CardTitle>
        <p className="text-micro text-muted-foreground">{LEVEL_DESCRIPTION[exercise.level]}</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <MarkdownContent content={exercise.problem_statement} />

        {exercise.starter_context && (
          <div className="rounded-lg border border-border bg-muted/40 p-3.5">
            <p className="mb-1 text-micro font-semibold uppercase tracking-wide text-muted-foreground">Context</p>
            <MarkdownContent content={exercise.starter_context} />
          </div>
        )}

        {exercise.hints.length > 0 && (
          <div className="flex flex-col gap-2">
            {exercise.hints.slice(0, hintsShown).map((hint, i) => (
              <div key={i} className="flex items-start gap-2.5 rounded-lg bg-accent-50/60 p-3 text-sm">
                <Lightbulb className="mt-0.5 size-4 shrink-0 text-accent-600" />
                <span>{hint}</span>
              </div>
            ))}
            {hintsShown < exercise.hints.length && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit gap-1.5"
                onClick={() => setHintsShown((n) => n + 1)}
              >
                <Lightbulb className="size-3.5" />
                {hintsShown === 0 ? "Stuck? Get a hint" : "Another hint"}
              </Button>
            )}
          </div>
        )}

        {exercise.solution_notes && (
          <div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-fit gap-1.5"
              onClick={() => setSolutionShown((s) => !s)}
            >
              <ChevronDown className={`size-3.5 transition-transform ${solutionShown ? "rotate-180" : ""}`} />
              {solutionShown ? "Hide what a strong pass looks like" : "Done? See what a strong pass looks like"}
            </Button>
            {solutionShown && (
              <div className="mt-2 rounded-lg border border-success/30 bg-success/5 p-3.5">
                <MarkdownContent content={exercise.solution_notes} />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ExercisesTab({ exercises }: { exercises: ExerciseRow[] }) {
  if (exercises.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No practice exercises for this module yet.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {exercises.map((exercise) => (
        <ExerciseCard key={exercise.id} exercise={exercise} />
      ))}
    </div>
  );
}
