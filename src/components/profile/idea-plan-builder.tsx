"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Sparkles, CheckCircle2, FolderPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CourseRow, ProjectIdeaPlanRow } from "@/types/db";

export function IdeaPlanBuilder({ courses }: { courses: CourseRow[] }) {
  const router = useRouter();
  const [form, setForm] = React.useState({
    idea: "",
    targetUser: "",
    problem: "",
    desiredOutcome: "",
    courseId: "",
  });
  const [generating, setGenerating] = React.useState(false);
  const [plan, setPlan] = React.useState<ProjectIdeaPlanRow | null>(null);
  const [approving, setApproving] = React.useState(false);
  const [creating, setCreating] = React.useState(false);

  async function generate() {
    if (!form.idea.trim() || !form.targetUser.trim() || !form.problem.trim() || !form.desiredOutcome.trim()) {
      toast.error("Fill in idea, target user, problem, and outcome.");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/idea-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea: form.idea,
          targetUser: form.targetUser,
          problem: form.problem,
          desiredOutcome: form.desiredOutcome,
          courseId: form.courseId || null,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPlan(data.plan);
    } catch {
      toast.error("Couldn't generate a plan right now. Try again.");
    } finally {
      setGenerating(false);
    }
  }

  async function approve() {
    if (!plan) return;
    setApproving(true);
    try {
      const res = await fetch(`/api/idea-plan/${plan.id}/approve`, { method: "POST" });
      if (!res.ok) throw new Error();
      setPlan({ ...plan, approved: true });
      toast.success("Plan approved.");
    } catch {
      toast.error("Couldn't approve — try again.");
    } finally {
      setApproving(false);
    }
  }

  async function createProject() {
    if (!plan) return;
    setCreating(true);
    try {
      const createRes = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: plan.idea,
          description: plan.prd.slice(0, 4000),
          problem: plan.problem,
          solution: plan.architecture_proposal,
          outcome: plan.desired_outcome,
          course_id: plan.course_id ?? undefined,
        }),
      });
      if (!createRes.ok) throw new Error();
      const { id } = await createRes.json();
      const linkRes = await fetch(`/api/idea-plan/${plan.id}/link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portfolioItemId: id }),
      });
      if (!linkRes.ok) throw new Error();
      toast.success("Project created from your plan.");
      router.push("/portfolio");
    } catch {
      toast.error("Couldn't create the project — try again.");
    } finally {
      setCreating(false);
    }
  }

  if (plan) {
    return (
      <div className="flex flex-col gap-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">PRD</CardTitle>
          </CardHeader>
          <CardContent className="whitespace-pre-wrap text-sm text-muted-foreground">{plan.prd}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">User stories</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {plan.user_stories.map((s, i) => (
              <p key={i}>
                As a <span className="font-medium">{s.role}</span>, I want {s.want}, so that {s.soThat}.
              </p>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Acceptance criteria</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1.5 text-sm">
            {plan.acceptance_criteria.map((c, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                {c}
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Architecture &amp; data model</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
            <p>{plan.architecture_proposal}</p>
            <p>{plan.data_model}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Milestones</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {plan.milestones.map((m, i) => (
              <div key={i}>
                <p className="font-medium">{m.name}</p>
                <p className="text-muted-foreground">{m.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              Workspace template
              <Badge variant="outline" className="text-micro">
                copy this yourself — no repo created automatically
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <p>
              <span className="font-medium">Suggested repo name: </span>
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{plan.suggested_repo_name}</code>
            </p>
            <div>
              <p className="text-micro font-semibold uppercase tracking-wide text-muted-foreground">README.md</p>
              <pre className="mt-1 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-3 font-mono text-xs">
                {plan.readme_content}
              </pre>
            </div>
            <div>
              <p className="text-micro font-semibold uppercase tracking-wide text-muted-foreground">.env.example</p>
              <pre className="mt-1 whitespace-pre-wrap rounded-lg bg-muted p-3 font-mono text-xs">{plan.env_template}</pre>
            </div>
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Branch strategy: </span>
              {plan.branch_strategy}
            </p>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          {!plan.approved ? (
            <Button onClick={approve} disabled={approving} className="gap-1.5">
              {approving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              Approve this plan
            </Button>
          ) : (
            <Button onClick={createProject} disabled={creating} variant="accent" className="gap-1.5">
              {creating ? <Loader2 className="size-4 animate-spin" /> : <FolderPlus className="size-4" />}
              Create project from this plan
            </Button>
          )}
          <Button variant="ghost" onClick={() => setPlan(null)}>
            Start a different idea
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 py-6">
        <div>
          <Label>Your idea</Label>
          <Input value={form.idea} onChange={(e) => setForm((f) => ({ ...f, idea: e.target.value }))} placeholder="e.g. An AI assistant that drafts client proposals" />
        </div>
        <div>
          <Label>Target user</Label>
          <Input value={form.targetUser} onChange={(e) => setForm((f) => ({ ...f, targetUser: e.target.value }))} placeholder="e.g. Solo freelancers pitching new clients" />
        </div>
        <div>
          <Label>Problem</Label>
          <Textarea value={form.problem} onChange={(e) => setForm((f) => ({ ...f, problem: e.target.value }))} rows={3} placeholder="What's broken or slow today?" />
        </div>
        <div>
          <Label>Desired outcome</Label>
          <Textarea value={form.desiredOutcome} onChange={(e) => setForm((f) => ({ ...f, desiredOutcome: e.target.value }))} rows={2} placeholder="What does success look like?" />
        </div>
        {courses.length > 0 && (
          <div>
            <Label>Link to a course (optional)</Label>
            <Select value={form.courseId} onValueChange={(v) => setForm((f) => ({ ...f, courseId: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="No course link" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <Button onClick={generate} disabled={generating} className="w-fit gap-1.5">
          {generating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          Generate plan
        </Button>
      </CardContent>
    </Card>
  );
}
