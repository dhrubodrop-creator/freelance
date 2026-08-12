"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { WorkExperienceRow } from "@/types/db";

function splitTags(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Create/edit dialog for a work_experiences row. Not built on the generic
 * EntityFormDialog because achievements/skills_used are arrays — stored here
 * as comma-separated input, split into a real string[] on submit.
 */
export function ExperienceFormDialog({
  trigger,
  title,
  initial,
}: {
  trigger: React.ReactNode;
  title: string;
  initial?: WorkExperienceRow;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [company, setCompany] = React.useState(initial?.company ?? "");
  const [role, setRole] = React.useState(initial?.role ?? "");
  const [startDate, setStartDate] = React.useState(initial?.start_date ?? "");
  const [endDate, setEndDate] = React.useState(initial?.end_date ?? "");
  const [description, setDescription] = React.useState(initial?.description ?? "");
  const [achievements, setAchievements] = React.useState((initial?.achievements ?? []).join(", "));
  const [skillsUsed, setSkillsUsed] = React.useState((initial?.skills_used ?? []).join(", "));

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const endpoint = initial ? `/api/profile/experience/${initial.id}` : "/api/profile/experience";
      const method = initial ? "PATCH" : "POST";
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company,
          role,
          start_date: startDate || null,
          end_date: endDate || null,
          description: description || null,
          achievements: splitTags(achievements),
          skills_used: splitTags(skillsUsed),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(typeof data?.error === "string" ? data.error : "Something went wrong.");
      }
      toast.success(initial ? "Saved changes" : "Experience added");
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="exp-company">Company</Label>
              <Input id="exp-company" required value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="exp-role">Role</Label>
              <Input id="exp-role" required value={role} onChange={(e) => setRole(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="exp-start">Start date</Label>
              <Input
                id="exp-start"
                type="date"
                value={startDate ?? ""}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="exp-end">End date (leave blank if current)</Label>
              <Input id="exp-end" type="date" value={endDate ?? ""} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="exp-description">What did you do?</Label>
            <Textarea
              id="exp-description"
              value={description ?? ""}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="exp-achievements">Achievements (comma-separated)</Label>
            <Input
              id="exp-achievements"
              placeholder="e.g. Grew pipeline 30%, Led a team of 4"
              value={achievements}
              onChange={(e) => setAchievements(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="exp-skills">Skills used (comma-separated)</Label>
            <Input
              id="exp-skills"
              placeholder="e.g. CRM, Client discovery, Excel"
              value={skillsUsed}
              onChange={(e) => setSkillsUsed(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
