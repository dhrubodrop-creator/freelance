"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Sparkles } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { DiagnosticExperienceLevel, DiagnosticSkillRating } from "@/types/db";

const EXPERIENCE_OPTIONS: { value: DiagnosticExperienceLevel; label: string; hint: string }[] = [
  { value: "new", label: "Completely new to this", hint: "Never worked with it before" },
  { value: "some_exposure", label: "Some exposure", hint: "Read about it or tried it briefly" },
  { value: "practiced", label: "Practiced", hint: "Built things with it, not in production" },
  { value: "professional", label: "Professional experience", hint: "Used it in a real job or client project" },
];

const SKILL_RATING_OPTIONS: { value: DiagnosticSkillRating; label: string }[] = [
  { value: "unfamiliar", label: "Unfamiliar" },
  { value: "aware", label: "Aware of it" },
  { value: "practiced", label: "Practiced it" },
  { value: "confident", label: "Confident" },
];

export function DiagnosticForm({
  courseSlug,
  courseId,
  courseTitle,
  skills,
}: {
  courseSlug: string;
  courseId: string;
  courseTitle: string;
  skills: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [experienceLevel, setExperienceLevel] = React.useState<DiagnosticExperienceLevel | "">("");
  const [confidenceRating, setConfidenceRating] = React.useState<number>(3);
  const [skillRatings, setSkillRatings] = React.useState<Record<string, DiagnosticSkillRating>>({});
  const [submitting, setSubmitting] = React.useState(false);

  const allSkillsRated = skills.every((s) => Boolean(skillRatings[s.id]));
  const canSubmit = experienceLevel !== "" && allSkillsRated;

  async function submit() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/diagnostic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, experienceLevel, confidenceRating, skillRatings }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(typeof data?.error === "string" ? data.error : "Something went wrong.");
      }
      toast.success("Your starting point is ready");
      router.push(`/courses/${courseSlug}/learn`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <p className="text-micro font-semibold uppercase tracking-wide text-accent-600">Entry diagnostic</p>
        <h1 className="font-heading text-h3 font-semibold">Where are you starting from in {courseTitle}?</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Two minutes, honest answers. This only guides which modules we flag for review or extra
          practice — you always have access to the full curriculum either way.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your overall experience</CardTitle>
          <CardDescription>Closest fit for how you&rsquo;d describe yourself with this subject.</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={experienceLevel}
            onValueChange={(v) => setExperienceLevel(v as DiagnosticExperienceLevel)}
            className="gap-3"
          >
            {EXPERIENCE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 text-sm transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary-50/40"
              >
                <RadioGroupItem value={opt.value} className="mt-0.5" />
                <span>
                  <span className="block font-medium">{opt.label}</span>
                  <span className="text-muted-foreground">{opt.hint}</span>
                </span>
              </label>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Confidence right now</CardTitle>
          <CardDescription>1 = not confident at all, 5 = very confident.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setConfidenceRating(n)}
                className={
                  "flex size-10 items-center justify-center rounded-full border text-sm font-semibold transition-colors " +
                  (confidenceRating === n
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input hover:bg-muted")
                }
                aria-pressed={confidenceRating === n}
              >
                {n}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {skills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rate yourself on what this course teaches</CardTitle>
            <CardDescription>
              We only flag a module for review or extra practice when you rate a skill it actually teaches.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {skills.map((skill) => (
              <div key={skill.id}>
                <Label className="text-sm font-medium">{skill.name}</Label>
                <RadioGroup
                  value={skillRatings[skill.id] ?? ""}
                  onValueChange={(v) =>
                    setSkillRatings((prev) => ({ ...prev, [skill.id]: v as DiagnosticSkillRating }))
                  }
                  className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4"
                >
                  {SKILL_RATING_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary-50/40"
                    >
                      <RadioGroupItem value={opt.value} />
                      {opt.label}
                    </label>
                  ))}
                </RadioGroup>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-3">
        <Button variant="accent" onClick={submit} disabled={!canSubmit || submitting} className="gap-1.5">
          <Sparkles className="size-4" />
          {submitting ? "Scoring your answers…" : "Get my starting point"}
          {!submitting && <ArrowRight className="size-4" />}
        </Button>
        <Button variant="ghost" onClick={() => router.push(`/courses/${courseSlug}/learn`)}>
          Skip for now
        </Button>
      </div>
    </div>
  );
}
