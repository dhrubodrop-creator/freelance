"use client";

import { FolderGit2, Unplug } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlainTerm } from "@/components/shared/plain-term";

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
        <CardDescription>Where your project code is safely stored.</CardDescription>
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
          <div className="flex w-full flex-col gap-2">
            <p className="text-muted-foreground">
              Not connected yet. Connecting lets Ropes save real code for your projects and check it
              automatically — you don&rsquo;t need to know how GitHub works to use this.
            </p>
            <div className="flex items-center justify-between gap-3">
              <PlainTerm term="github" className="text-micro" />
              <Button size="sm" onClick={connect} className="w-fit gap-1.5">
                <FolderGit2 className="size-3.5" /> Connect GitHub
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
