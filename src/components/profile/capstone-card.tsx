"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { GraduationCap, Sparkles } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import type { CapstoneReviewRow, CapstoneSubmissionRow, CourseCapstoneRow, PortfolioItemRow } from "@/types/db";

export function CapstoneCard({
  capstone,
  courseTitle,
  eligibleItems,
  submission,
  review,
}: {
  capstone: CourseCapstoneRow;
  courseTitle: string;
  eligibleItems: PortfolioItemRow[];
  submission: CapstoneSubmissionRow | null;
  review: CapstoneReviewRow | null;
}) {
  const router = useRouter();
  const [selectedItemId, setSelectedItemId] = React.useState(eligibleItems[0]?.id ?? "");
  const [starting, setStarting] = React.useState(false);
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [defending, setDefending] = React.useState(false);

  async function start() {
    if (!selectedItemId) {
      toast.error("Add a portfolio project for this course first.");
      return;
    }
    setStarting(true);
    try {
      const res = await fetch(`/api/capstone/${capstone.id}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portfolioItemId: selectedItemId }),
      });
      if (!res.ok) throw new Error();
      toast.success("Defence questions ready");
      router.refresh();
    } catch {
      toast.error("Couldn't start the defence — try again.");
    } finally {
      setStarting(false);
    }
  }

  async function submitDefence() {
    if (!review) return;
    const answered = review.defence_questions.map((q) => ({ question: q.question, answer: answers[q.question] ?? "" }));
    if (answered.some((a) => !a.answer.trim())) {
      toast.error("Answer every question before submitting.");
      return;
    }
    setDefending(true);
    try {
      const res = await fetch(`/api/capstone/${capstone.id}/defend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: answered }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(typeof data?.error === "string" ? data.error : "Something went wrong.");
      }
      toast.success("Your defence has been scored");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setDefending(false);
    }
  }

  const status = submission?.status ?? "not_started";

  return (
    <Card className="border-primary-100">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="accent" className="gap-1">
            <GraduationCap className="size-3" />
            Capstone
          </Badge>
          <span className="text-micro text-muted-foreground">{courseTitle}</span>
        </div>
        <CardTitle className="text-base">{capstone.title}</CardTitle>
        <CardDescription>{capstone.brief}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {capstone.requirements.length > 0 && (
          <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
            {capstone.requirements.map((r) => (
              <li key={r} className="flex items-start gap-2">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-accent-600" />
                {r}
              </li>
            ))}
          </ul>
        )}

        {status === "not_started" && (
          <div className="flex flex-wrap items-center gap-2">
            {eligibleItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Add a portfolio project for this course, then come back to submit it as your capstone.
              </p>
            ) : (
              <>
                <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                  <SelectTrigger className="h-9 w-56 text-sm">
                    <SelectValue placeholder="Choose your project" />
                  </SelectTrigger>
                  <SelectContent>
                    {eligibleItems.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="accent" size="sm" onClick={start} disabled={starting} className="gap-1.5">
                  <Sparkles className="size-3.5" />
                  {starting ? "Preparing your defence…" : "Submit for defence"}
                </Button>
              </>
            )}
          </div>
        )}

        {(status === "awaiting_defence_answers" || status === "submitted_for_review") && review && (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium">Defence questions — answer honestly, this is what gets scored:</p>
            {review.defence_questions.map((q) => (
              <div key={q.question}>
                <p className="text-sm font-medium">{q.question}</p>
                <p className="mb-1 text-micro text-muted-foreground">{q.probes}</p>
                <Textarea
                  value={answers[q.question] ?? ""}
                  onChange={(e) => setAnswers((a) => ({ ...a, [q.question]: e.target.value }))}
                  rows={3}
                />
              </div>
            ))}
            <Button
              variant="accent"
              size="sm"
              onClick={submitDefence}
              disabled={defending}
              className="w-fit gap-1.5"
            >
              <Sparkles className="size-3.5" />
              {defending ? "Scoring your defence…" : "Submit defence for review"}
            </Button>
          </div>
        )}

        {status === "reviewed" && review && (
          <div className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {Object.entries(review.dimension_scores).map(([dimension, s]) => (
                <div key={dimension}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{dimension}</span>
                    <span className="text-muted-foreground">{s.score}/100</span>
                  </div>
                  <Progress value={s.score} className="mt-1 h-1.5" />
                  <p className="mt-1 text-micro text-muted-foreground">{s.note}</p>
                </div>
              ))}
            </div>
            {review.overall_feedback && <p className="text-sm">{review.overall_feedback}</p>}
            {review.strengths.length > 0 && (
              <div>
                <p className="text-micro font-semibold uppercase tracking-wide text-success">Strong</p>
                <ul className="mt-1 flex flex-col gap-0.5 text-sm text-muted-foreground">
                  {review.strengths.map((s) => (
                    <li key={s}>• {s}</li>
                  ))}
                </ul>
              </div>
            )}
            {review.weaknesses.length > 0 && (
              <div>
                <p className="text-micro font-semibold uppercase tracking-wide text-muted-foreground">Weak</p>
                <ul className="mt-1 flex flex-col gap-0.5 text-sm text-muted-foreground">
                  {review.weaknesses.map((s) => (
                    <li key={s}>• {s}</li>
                  ))}
                </ul>
              </div>
            )}
            {review.missing.length > 0 && (
              <div>
                <p className="text-micro font-semibold uppercase tracking-wide text-destructive">Missing</p>
                <ul className="mt-1 flex flex-col gap-0.5 text-sm text-muted-foreground">
                  {review.missing.map((s) => (
                    <li key={s}>• {s}</li>
                  ))}
                </ul>
              </div>
            )}
            {review.improvements.length > 0 && (
              <div>
                <p className="text-micro font-semibold uppercase tracking-wide text-accent-600">Improve</p>
                <ul className="mt-1 flex flex-col gap-0.5 text-sm text-muted-foreground">
                  {review.improvements.map((s) => (
                    <li key={s}>• {s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
