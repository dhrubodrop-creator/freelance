"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Link2, Loader2, Unlink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function ProofShareLinkCard({ initialToken }: { initialToken: string | null }) {
  const [token, setToken] = useState(initialToken);
  const [loading, setLoading] = useState(false);

  async function createLink() {
    setLoading(true);
    try {
      const res = await fetch("/api/proof/share-link", { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setToken(data.token);
    } catch {
      toast.error("Couldn't create a share link.");
    } finally {
      setLoading(false);
    }
  }

  async function revoke() {
    setLoading(true);
    try {
      const res = await fetch("/api/proof/share-link", { method: "DELETE" });
      if (!res.ok) throw new Error();
      setToken(null);
    } catch {
      toast.error("Couldn't revoke the link.");
    } finally {
      setLoading(false);
    }
  }

  const url = token && typeof window !== "undefined" ? `${window.location.origin}/p/${token}` : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Link2 className="size-4" /> Shareable proof link
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2">
        {token ? (
          <>
            <Input readOnly value={url ?? `/p/${token}`} className="max-w-md" onFocus={(e) => e.target.select()} />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (url) navigator.clipboard.writeText(url);
                toast.success("Copied");
              }}
            >
              Copy
            </Button>
            <Button variant="ghost" size="sm" onClick={revoke} disabled={loading} className="gap-1.5">
              <Unlink className="size-3.5" /> Revoke
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">Create a public link showing your verified skills, capstones, and approved projects — no private data.</p>
            <Button size="sm" onClick={createLink} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Create link"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
