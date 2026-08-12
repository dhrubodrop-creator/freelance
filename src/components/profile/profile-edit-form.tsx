"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ProfileRow, WorkPreference } from "@/types/db";

const WORK_PREFERENCE_OPTIONS: { value: WorkPreference; label: string }[] = [
  { value: "full_time", label: "Full-time employment" },
  { value: "contract", label: "Contract work" },
  { value: "freelance", label: "Freelance projects" },
  { value: "consulting", label: "Consulting" },
  { value: "remote_only", label: "Remote only" },
];

export function ProfileEditForm({ profile }: { profile: ProfileRow | null }) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [bio, setBio] = React.useState(profile?.bio ?? "");
  const [location, setLocation] = React.useState(profile?.location ?? "");
  const [preferredLanguage, setPreferredLanguage] = React.useState(profile?.preferred_language ?? "");
  const [incomeGoal, setIncomeGoal] = React.useState(
    profile?.income_goal_inr != null ? String(profile.income_goal_inr) : ""
  );
  const [workPreference, setWorkPreference] = React.useState<WorkPreference | "">(
    profile?.work_preference ?? ""
  );
  const [linkedinUrl, setLinkedinUrl] = React.useState(profile?.linkedin_url ?? "");
  const [portfolioUrl, setPortfolioUrl] = React.useState(profile?.portfolio_url ?? "");
  const [githubUrl, setGithubUrl] = React.useState(profile?.github_url ?? "");
  const [websiteUrl, setWebsiteUrl] = React.useState(profile?.website_url ?? "");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: bio || null,
          location: location || null,
          preferredLanguage: preferredLanguage || null,
          incomeGoalInr: incomeGoal === "" ? null : Number(incomeGoal),
          workPreference: workPreference || null,
          linkedinUrl,
          portfolioUrl,
          githubUrl,
          websiteUrl,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(typeof data?.error === "string" ? data.error : "Something went wrong.");
      }
      toast.success("Profile updated");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Basic
        </h3>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            placeholder="A short line about who you are and what you're building toward."
            value={bio ?? ""}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="location">Location</Label>
            <Input id="location" placeholder="e.g. Bengaluru, India" value={location ?? ""} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="preferredLanguage">Preferred language</Label>
            <Input
              id="preferredLanguage"
              placeholder="e.g. English"
              value={preferredLanguage ?? ""}
              onChange={(e) => setPreferredLanguage(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Professional
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="incomeGoal">Income goal (₹/month)</Label>
            <Input
              id="incomeGoal"
              type="number"
              min={0}
              placeholder="e.g. 50000"
              value={incomeGoal}
              onChange={(e) => setIncomeGoal(e.target.value)}
            />
            <p className="text-micro text-muted-foreground">
              A target, not a promise — used to shape monetisation suggestions later.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Work preference</Label>
            <Select value={workPreference} onValueChange={(v) => setWorkPreference(v as WorkPreference)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose one" />
              </SelectTrigger>
              <SelectContent>
                {WORK_PREFERENCE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Links
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="linkedinUrl">LinkedIn</Label>
            <Input id="linkedinUrl" placeholder="https://linkedin.com/in/…" value={linkedinUrl ?? ""} onChange={(e) => setLinkedinUrl(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="portfolioUrl">Portfolio</Label>
            <Input id="portfolioUrl" placeholder="https://…" value={portfolioUrl ?? ""} onChange={(e) => setPortfolioUrl(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="githubUrl">GitHub</Label>
            <Input id="githubUrl" placeholder="https://github.com/…" value={githubUrl ?? ""} onChange={(e) => setGithubUrl(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="websiteUrl">Website</Label>
            <Input id="websiteUrl" placeholder="https://…" value={websiteUrl ?? ""} onChange={(e) => setWebsiteUrl(e.target.value)} />
          </div>
        </div>
      </div>

      <Button type="submit" disabled={submitting} className="w-fit">
        {submitting ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
