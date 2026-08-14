"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Accessibility, Gauge, Loader2, ShieldAlert, ScanEye } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type CheckType = "visual_qa" | "accessibility" | "security" | "performance";

const CONFIG: Record<CheckType, { label: string; icon: typeof ScanEye }> = {
  visual_qa: { label: "Visual QA", icon: ScanEye },
  accessibility: { label: "Accessibility", icon: Accessibility },
  security: { label: "Security", icon: ShieldAlert },
  performance: { label: "Performance", icon: Gauge },
};

export function QualityLabsPanel({ portfolioItemId, repoFullName }: { portfolioItemId: string; repoFullName: string | null }) {
  return (
    <div className="flex flex-wrap gap-2">
      {(Object.keys(CONFIG) as CheckType[]).map((type) => (
        <LabDialog key={type} type={type} portfolioItemId={portfolioItemId} repoFullName={repoFullName} />
      ))}
    </div>
  );
}

function LabDialog({ type, portfolioItemId, repoFullName }: { type: CheckType; portfolioItemId: string; repoFullName: string | null }) {
  const { label, icon: Icon } = CONFIG[type];
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  async function run() {
    if (type !== "security" && !url.trim()) {
      toast.error("Enter your deployed URL first.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/quality-labs/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkType: type, portfolioItemId, targetUrl: url || null, repoFullName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data.result);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't run that check.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Icon className="size-3.5" /> {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          {type !== "security" && (
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://your-deployed-app.vercel.app" />
          )}
          {type === "security" && (
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Optional: deployed URL (checks headers too)" />
          )}
          <Button onClick={run} disabled={loading} className="w-fit">
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Run check"}
          </Button>
          {result && (
            <div className="flex flex-col gap-2 text-sm">
              {Object.entries(result).map(([key, value]) => {
                if (key === "note") return null;
                return (
                  <div key={key} className="flex items-start justify-between gap-3 rounded bg-muted/40 px-2.5 py-1.5">
                    <span className="text-muted-foreground">{key}</span>
                    <span className="text-right font-medium">
                      {Array.isArray(value) ? (value.length ? value.join(", ") : "none") : String(value)}
                    </span>
                  </div>
                );
              })}
              {typeof result.note === "string" && (
                <Badge variant="outline" className="w-fit text-micro">
                  {result.note}
                </Badge>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
