"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCcw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function RegenerateRecommendationButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/recommend", { method: "POST" });
      if (!res.ok) throw new Error();
      startTransition(() => router.refresh());
    } catch {
      toast.error("Couldn't regenerate your recommendation. Try again shortly.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleClick} disabled={loading || pending}>
      <RefreshCcw className={`size-3.5 ${loading || pending ? "animate-spin" : ""}`} />
      Regenerate
    </Button>
  );
}
