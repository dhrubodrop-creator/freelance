"use client";

import { FolderGit2, Unplug } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function GitHubConnectionCard({
  connection,
}: {
  connection: { githubUsername: string; connectedAt: string } | null;
}) {
  const router = useRouter();
  const [disconnecting, setDisconnecting] = useState(false);

  async function connect() {
    const res = await fetch("/api/github/connect");
    if (res.status === 501) {
      const data = await res.json().catch(() => null);
      toast.info(data?.detail ?? "GitHub isn't connected yet — the site owner needs to set it up first.");
      return;
    }
    window.location.href = "/api/github/connect";
  }

  async function disconnect() {
    setDisconnecting(true);
    try {
      const res = await fetch("/api/github/disconnect", { method: "POST" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      toast.error("Couldn't disconnect — try again.");
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FolderGit2 className="size-4" /> GitHub
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3 text-sm">
        {connection ? (
          <>
            <span className="flex items-center gap-2">
              Connected as <Badge variant="accent">{connection.githubUsername}</Badge>
            </span>
            <Button variant="ghost" size="sm" onClick={disconnect} disabled={disconnecting} className="gap-1.5">
              <Unplug className="size-3.5" /> Disconnect
            </Button>
          </>
        ) : (
          <>
            <span className="text-muted-foreground">Connect GitHub to link real repos to your projects.</span>
            <Button size="sm" onClick={connect} className="gap-1.5">
              <FolderGit2 className="size-3.5" /> Connect
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
