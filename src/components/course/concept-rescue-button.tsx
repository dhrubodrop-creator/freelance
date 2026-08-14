"use client";

import { useState } from "react";
import { HelpCircle, Loader2, Lightbulb, Eye, Puzzle, Code2, Dumbbell } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ConceptRescueRequestRow } from "@/types/db";

export function ConceptRescueButton({ moduleId, exerciseId }: { moduleId: string; exerciseId?: string | null }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState("");
  const [rescue, setRescue] = useState<ConceptRescueRequestRow | null>(null);

  async function requestRescue() {
    setLoading(true);
    try {
      const res = await fetch("/api/concept-rescue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId, exerciseId: exerciseId ?? null, question: question || null }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRescue(data.rescue);
    } catch {
      toast.error("Couldn't generate an explanation right now. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setRescue(null);
          setQuestion("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <HelpCircle className="size-4" />
          I don&rsquo;t understand
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Concept rescue</DialogTitle>
          <DialogDescription>Grounded in this exact module&rsquo;s content — not a generic answer.</DialogDescription>
        </DialogHeader>

        {!rescue ? (
          <div className="flex flex-col gap-3">
            <Textarea
              placeholder="Optional: say specifically what's confusing you..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
            />
            <Button onClick={requestRescue} disabled={loading} className="w-fit">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <HelpCircle className="size-4" />}
              Get unstuck
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 text-sm">
            <RescueSection icon={Lightbulb} title="Simple explanation" body={rescue.simple_explanation} />
            <RescueSection icon={Eye} title="Visual example" body={rescue.visual_example} />
            <RescueSection icon={Puzzle} title="Analogy" body={rescue.analogy} />
            {rescue.code_example && <RescueSection icon={Code2} title="Code example" body={rescue.code_example} mono />}
            <RescueSection icon={Dumbbell} title="5-minute practice" body={rescue.five_minute_practice} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function RescueSection({
  icon: Icon,
  title,
  body,
  mono,
}: {
  icon: typeof Lightbulb;
  title: string;
  body: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="flex items-center gap-1.5 text-micro font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="size-3.5" />
        {title}
      </p>
      <p className={mono ? "whitespace-pre-wrap rounded-lg bg-muted p-3 font-mono text-xs" : "text-foreground"}>{body}</p>
    </div>
  );
}
