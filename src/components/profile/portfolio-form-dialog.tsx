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
import { Checkbox } from "@/components/ui/checkbox";
import type { CourseRow, PortfolioItemRow, SkillRow } from "@/types/db";

function splitTags(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function PortfolioFormDialog({
  trigger,
  title,
  skills,
  courses,
  initial,
  initialSkillIds,
}: {
  trigger: React.ReactNode;
  title: string;
  skills: SkillRow[];
  courses: CourseRow[];
  initial?: PortfolioItemRow;
  initialSkillIds?: string[];
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [itemTitle, setItemTitle] = React.useState(initial?.title ?? "");
  const [description, setDescription] = React.useState(initial?.description ?? "");
  const [problem, setProblem] = React.useState(initial?.problem ?? "");
  const [solution, setSolution] = React.useState(initial?.solution ?? "");
  const [outcome, setOutcome] = React.useState(initial?.outcome ?? "");
  const [courseId, setCourseId] = React.useState(initial?.course_id ?? "");
  const [toolsUsed, setToolsUsed] = React.useState((initial?.tools_used ?? []).join(", "));
  const [links, setLinks] = React.useState((initial?.links ?? []).join(", "));
  const [selectedSkills, setSelectedSkills] = React.useState<Set<string>>(
    new Set(initialSkillIds ?? [])
  );

  function toggleSkill(id: string) {
    setSelectedSkills((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const endpoint = initial ? `/api/portfolio/${initial.id}` : "/api/portfolio";
      const method = initial ? "PATCH" : "POST";
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: itemTitle,
          description: description || null,
          problem: problem || null,
          solution: solution || null,
          outcome: outcome || null,
          course_id: courseId || null,
          tools_used: splitTags(toolsUsed),
          links: splitTags(links),
          skill_ids: Array.from(selectedSkills),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(typeof data?.error === "string" ? data.error : "Something went wrong.");
      }
      toast.success(initial ? "Saved changes" : "Project added");
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
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pf-title">Project title</Label>
            <Input id="pf-title" required value={itemTitle} onChange={(e) => setItemTitle(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pf-course">Ropes course</Label>
            <select
              id="pf-course"
              value={courseId}
              onChange={(event) => setCourseId(event.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Independent / client project</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
            <p className="text-micro text-muted-foreground">Link the build to its course so it can become eligible capstone evidence.</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pf-description">What did you build?</Label>
            <Textarea id="pf-description" value={description ?? ""} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pf-problem">Problem</Label>
              <Textarea id="pf-problem" value={problem ?? ""} onChange={(e) => setProblem(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pf-solution">Solution</Label>
              <Textarea id="pf-solution" value={solution ?? ""} onChange={(e) => setSolution(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pf-outcome">Outcome</Label>
            <Textarea id="pf-outcome" value={outcome ?? ""} onChange={(e) => setOutcome(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pf-tools">Tools used (comma-separated)</Label>
              <Input id="pf-tools" placeholder="e.g. n8n, OpenAI, Airtable" value={toolsUsed} onChange={(e) => setToolsUsed(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pf-links">Links (comma-separated)</Label>
              <Input id="pf-links" placeholder="https://…" value={links} onChange={(e) => setLinks(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Skills this project demonstrates</Label>
            <div className="grid max-h-48 grid-cols-1 gap-2 overflow-y-auto rounded-lg border border-border p-3 sm:grid-cols-2">
              {skills.map((skill) => (
                <label key={skill.id} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={selectedSkills.has(skill.id)} onCheckedChange={() => toggleSkill(skill.id)} />
                  {skill.name}
                </label>
              ))}
            </div>
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
