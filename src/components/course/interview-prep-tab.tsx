"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { InterviewQuestionRow } from "@/types/db";

const CATEGORY_LABEL: Record<string, string> = {
  fundamentals: "Fundamentals",
  applied: "Applied",
  scenario: "Scenario",
  debugging: "Debugging",
  system_design: "System Design",
  project_defence: "Defend Your Project",
  behavioural: "Behavioural",
};

function QuestionCard({ q }: { q: InterviewQuestionRow }) {
  const [open, setOpen] = React.useState(false);

  return (
    <Card>
      <CardHeader className="pb-3">
        <Badge variant="outline" className="w-fit">
          {CATEGORY_LABEL[q.category] ?? q.category}
        </Badge>
        <CardTitle className="text-base font-medium">{q.question}</CardTitle>
      </CardHeader>
      <CardContent>
        <Button type="button" variant="ghost" size="sm" className="gap-1.5" onClick={() => setOpen((o) => !o)}>
          <ChevronDown className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
          {open ? "Hide guidance" : "What's being tested + how to answer"}
        </Button>
        {open && (
          <div className="mt-3 flex flex-col gap-3 text-sm">
            <div>
              <p className="text-micro font-semibold uppercase tracking-wide text-muted-foreground">
                What this is testing
              </p>
              <p className="mt-1 text-muted-foreground">{q.what_is_tested}</p>
            </div>
            <div>
              <p className="text-micro font-semibold uppercase tracking-wide text-success">Strong answer structure</p>
              <p className="mt-1">{q.strong_answer_structure}</p>
            </div>
            {q.weak_answer_example && (
              <div>
                <p className="text-micro font-semibold uppercase tracking-wide text-destructive">
                  A weak answer (and why)
                </p>
                <p className="mt-1 text-muted-foreground">{q.weak_answer_example}</p>
              </div>
            )}
            {q.follow_up_question && (
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-micro font-semibold uppercase tracking-wide text-muted-foreground">Follow-up</p>
                <p className="mt-1">{q.follow_up_question}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function InterviewPrepTab({ questions }: { questions: InterviewQuestionRow[] }) {
  if (questions.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No interview questions for this module yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Try to answer each question yourself before revealing the guidance — that&rsquo;s what makes this
        useful for an actual interview, not just familiar-looking text.
      </p>
      {questions.map((q) => (
        <QuestionCard key={q.id} q={q} />
      ))}
    </div>
  );
}
