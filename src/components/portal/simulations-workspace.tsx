"use client";

import * as React from "react";
import { toast } from "sonner";
import { Briefcase, Flame, Loader2, MessagesSquare, Presentation, Siren, Send, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SimulationSessionRow, SimulationType } from "@/types/db";

const TYPE_META: Record<SimulationType, { label: string; icon: typeof MessagesSquare; description: string }> = {
  client: { label: "AI Client Simulator", icon: Briefcase, description: "A realistic prospective client — clarifies, pushes back, rejects weak answers." },
  discovery_call: { label: "Discovery Call", icon: MessagesSquare, description: "Draw out goals, users, constraints, budget, timeline, and success criteria." },
  scope_creep: { label: "Scope Creep Challenge", icon: Flame, description: "Handle 'just one more thing' requests with real scope/timeline/pricing responses." },
  incident: { label: "Incident Simulator", icon: Siren, description: "Investigate and respond to a realistic production incident — simulation only." },
  demo_day: { label: "Mock Demo Day", icon: Presentation, description: "Present your project, then field real audience questions." },
};

export function SimulationsWorkspace({
  sessions: initialSessions,
  portfolioItems,
}: {
  sessions: SimulationSessionRow[];
  portfolioItems: { id: string; title: string }[];
}) {
  const [sessions, setSessions] = React.useState(initialSessions);
  const [activeSession, setActiveSession] = React.useState<SimulationSessionRow | null>(
    initialSessions.find((s) => s.status === "active") ?? null
  );
  const [simulationType, setSimulationType] = React.useState<SimulationType>("client");
  const [projectId, setProjectId] = React.useState<string>("");
  const [starting, setStarting] = React.useState(false);

  async function start() {
    setStarting(true);
    try {
      const res = await fetch("/api/simulations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ simulationType, portfolioItemId: projectId || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActiveSession(data.session);
      setSessions((s) => [data.session, ...s]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't start a simulation.");
    } finally {
      setStarting(false);
    }
  }

  if (activeSession && activeSession.status === "active") {
    return (
      <SimulationChat
        session={activeSession}
        onUpdate={(updated) => {
          setActiveSession(updated);
          setSessions((s) => s.map((x) => (x.id === updated.id ? updated : x)));
        }}
        onExit={() => setActiveSession(null)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Start a simulation</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid gap-2 sm:grid-cols-2">
            {(Object.keys(TYPE_META) as SimulationType[]).map((t) => {
              const meta = TYPE_META[t];
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSimulationType(t)}
                  className={`flex items-start gap-2.5 rounded-lg border p-3 text-left text-sm transition-colors ${simulationType === t ? "border-accent bg-accent-50/40" : "border-border hover:bg-muted"}`}
                >
                  <meta.icon className="mt-0.5 size-4 shrink-0 text-accent-600" />
                  <div>
                    <p className="font-medium">{meta.label}</p>
                    <p className="text-micro text-muted-foreground">{meta.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
          {portfolioItems.length > 0 && (
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Optional: ground this in a real project" />
              </SelectTrigger>
              <SelectContent>
                {portfolioItems.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button onClick={start} disabled={starting} className="w-fit gap-1.5">
            {starting ? <Loader2 className="size-4 animate-spin" /> : "Start"}
          </Button>
        </CardContent>
      </Card>

      {sessions.filter((s) => s.status === "completed").length > 0 && (
        <div>
          <h2 className="mb-3 font-heading text-lg font-semibold">Past sessions</h2>
          <div className="flex flex-col gap-3">
            {sessions
              .filter((s) => s.status === "completed")
              .map((s) => (
                <Card key={s.id}>
                  <CardContent className="flex flex-col gap-2 py-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{TYPE_META[s.simulation_type].label}</span>
                      <span className="text-micro text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</span>
                    </div>
                    {s.evaluation && typeof s.evaluation.overallFeedback === "string" && (
                      <p className="text-muted-foreground">{s.evaluation.overallFeedback}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SimulationChat({
  session,
  onUpdate,
  onExit,
}: {
  session: SimulationSessionRow;
  onUpdate: (s: SimulationSessionRow) => void;
  onExit: () => void;
}) {
  const [message, setMessage] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [completing, setCompleting] = React.useState(false);
  const meta = TYPE_META[session.simulation_type];

  async function send() {
    if (!message.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/simulations/${session.id}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onUpdate(data.session);
      setMessage("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't send that.");
    } finally {
      setSending(false);
    }
  }

  async function complete() {
    setCompleting(true);
    try {
      const res = await fetch(`/api/simulations/${session.id}/complete`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onUpdate(data.session);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't complete this session.");
    } finally {
      setCompleting(false);
    }
  }

  if (session.status === "completed") {
    const evaluation = session.evaluation as { scores?: Record<string, number>; strengths?: string[]; improvements?: string[]; overallFeedback?: string } | null;
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="size-4 text-success" /> {meta.label} — evaluated
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          {evaluation?.scores && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(evaluation.scores).map(([dim, score]) => (
                <Badge key={dim} variant="outline">
                  {dim}: {score}/100
                </Badge>
              ))}
            </div>
          )}
          {evaluation?.overallFeedback && <p>{evaluation.overallFeedback}</p>}
          {evaluation?.strengths && evaluation.strengths.length > 0 && (
            <div>
              <p className="text-micro font-semibold uppercase tracking-wide text-muted-foreground">Strengths</p>
              <ul className="mt-1 list-disc pl-4">
                {evaluation.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          {evaluation?.improvements && evaluation.improvements.length > 0 && (
            <div>
              <p className="text-micro font-semibold uppercase tracking-wide text-muted-foreground">Improvements</p>
              <ul className="mt-1 list-disc pl-4">
                {evaluation.improvements.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={onExit} className="w-fit">
            Back to simulations
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{meta.label}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex max-h-[50vh] flex-col gap-3 overflow-y-auto">
          {session.transcript.map((turn, i) => (
            <div
              key={i}
              className={`max-w-[80%] rounded-lg p-3 text-sm ${turn.role === "assistant" ? "self-start bg-muted" : "self-end bg-accent-50 text-accent-900"}`}
            >
              {turn.content}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Your reply..."
          />
          <Button onClick={send} disabled={sending}>
            {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={complete} disabled={completing || session.transcript.length < 2} className="w-fit">
          {completing ? <Loader2 className="size-4 animate-spin" /> : "End & get evaluated"}
        </Button>
      </CardContent>
    </Card>
  );
}
