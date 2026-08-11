"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function MarkCompleteButton({
  moduleId,
  nextHref,
  completed,
}: {
  moduleId: string;
  nextHref: string | null;
  completed: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId }),
      });
      if (!res.ok) throw new Error();
      if (nextHref) {
        router.push(nextHref);
      } else {
        toast.success("Course complete — nice work.");
        router.refresh();
      }
    } catch {
      toast.error("Couldn't save your progress. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (completed) {
    return (
      <Button variant="outline" disabled className="gap-2">
        <CheckCircle2 className="size-4 text-success" />
        Completed
      </Button>
    );
  }

  return (
    <Button variant="accent" onClick={handleClick} disabled={loading}>
      {loading ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
      Mark complete{nextHref ? " & continue" : ""}
    </Button>
  );
}
