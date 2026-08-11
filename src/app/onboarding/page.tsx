"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Sparkles, UploadCloud } from "lucide-react";

import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const schema = z.object({
  occupation: z.string().min(2, "Tell us your current role"),
  yearsExperience: z.number().min(0).max(60),
  industry: z.string().min(2, "Tell us your industry"),
  careerGoal: z.enum(["freelance_income", "career_switch", "side_income"], {
    error: "Pick what you're aiming for",
  }),
  hoursPerWeek: z.number().min(1).max(80),
});

type FormValues = z.infer<typeof schema>;

const LOADING_STEPS = [
  "Reading your background",
  "Weighing your available hours",
  "Matching you to a track",
  "Writing your rationale",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const careerGoal = watch("careerGoal");

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    setServerError(null);

    const stepTimer = setInterval(() => {
      setLoadingStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1));
    }, 900);

    const formData = new FormData();
    formData.set("occupation", values.occupation);
    formData.set("yearsExperience", String(values.yearsExperience));
    formData.set("industry", values.industry);
    formData.set("careerGoal", values.careerGoal);
    formData.set("hoursPerWeek", String(values.hoursPerWeek));
    if (cvFile) formData.set("cv", cvFile);

    try {
      const res = await fetch("/api/profile", { method: "POST", body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.formErrors?.[0] ?? body?.error ?? "Something went wrong");
      }
      router.push("/dashboard?matched=1");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
      clearInterval(stepTimer);
    }
  }

  if (submitting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-mesh-hero bg-primary">
        <div className="mx-auto flex max-w-sm flex-col items-center gap-6 px-6 text-center">
          <div className="relative flex size-16 items-center justify-center rounded-full bg-white/10">
            <Loader2 className="size-7 animate-spin text-accent" />
          </div>
          <div className="flex flex-col gap-2">
            <p className="font-heading text-h4 font-semibold text-white">Matching your track</p>
            <p className="text-sm text-white/70">{LOADING_STEPS[loadingStep]}…</p>
          </div>
          <div className="flex gap-1.5">
            {LOADING_STEPS.map((step, i) => (
              <span
                key={step}
                className={`h-1 w-8 rounded-full transition-colors ${i <= loadingStep ? "bg-accent" : "bg-white/20"}`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40 py-16">
      <Container className="max-w-2xl">
        <div className="mb-8 flex flex-col gap-2 text-center">
          <span className="mx-auto inline-flex items-center gap-1.5 rounded-full bg-accent-50 px-3 py-1 text-micro font-semibold text-accent-600">
            <Sparkles className="size-3.5" />
            Step 1 of 1
          </span>
          <h1 className="font-heading text-h2 font-bold">Tell us where you&rsquo;re starting from</h1>
          <p className="text-muted-foreground">
            This takes two minutes and shapes the track our AI recommends for you.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your background</CardTitle>
            <CardDescription>Used only to personalize your recommendation and mentor context.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="occupation">Current occupation</Label>
                  <Input id="occupation" placeholder="e.g. Sales executive" {...register("occupation")} />
                  {errors.occupation && <p className="text-micro text-destructive">{errors.occupation.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="industry">Industry</Label>
                  <Input id="industry" placeholder="e.g. B2B SaaS" {...register("industry")} />
                  {errors.industry && <p className="text-micro text-destructive">{errors.industry.message}</p>}
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="yearsExperience">Years of experience</Label>
                  <Input
                    id="yearsExperience"
                    type="number"
                    min={0}
                    max={60}
                    {...register("yearsExperience", { valueAsNumber: true })}
                  />
                  {errors.yearsExperience && (
                    <p className="text-micro text-destructive">{errors.yearsExperience.message}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="hoursPerWeek">Hours available per week</Label>
                  <Input
                    id="hoursPerWeek"
                    type="number"
                    min={1}
                    max={80}
                    {...register("hoursPerWeek", { valueAsNumber: true })}
                  />
                  {errors.hoursPerWeek && <p className="text-micro text-destructive">{errors.hoursPerWeek.message}</p>}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>What are you aiming for?</Label>
                <Select onValueChange={(v) => setValue("careerGoal", v as FormValues["careerGoal"])} value={careerGoal}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a goal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="freelance_income">Replace my income with freelance work</SelectItem>
                    <SelectItem value="career_switch">Switch careers entirely</SelectItem>
                    <SelectItem value="side_income">Build a side income alongside my job</SelectItem>
                  </SelectContent>
                </Select>
                {errors.careerGoal && <p className="text-micro text-destructive">{errors.careerGoal.message}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cv">CV (optional, PDF)</Label>
                <label
                  htmlFor="cv"
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-input bg-background px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-ring"
                >
                  <UploadCloud className="size-4 shrink-0" />
                  {cvFile ? cvFile.name : "Upload a PDF — helps your AI mentor give sharper advice"}
                </label>
                <input
                  id="cv"
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
                />
              </div>

              {serverError && <p className="text-sm text-destructive">{serverError}</p>}

              <Button type="submit" size="lg" variant="accent" className="mt-2">
                Get my recommendation
              </Button>
            </form>
          </CardContent>
        </Card>
      </Container>
    </div>
  );
}
