"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FolderGit2, Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function GitHubRepoLink({ portfolioItemId, repoFullName }: { portfolioItemId: string; repoFullName: string | null }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(repoFullName ?? "");
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/github/link-repo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portfolioItemId, repoFullName: value }),
      });
      if (!res.ok) throw new Error();
      setEditing(false);
      toast.success("Your project code is now linked");
      router.refresh();
    } catch {
      toast.error("Couldn't link that repo — use the owner/repo format.");
    } finally {
      setSaving(false);
    }
  }

  async function createRepo() {
    setCreating(true);
    try {
      const res = await fetch(`/api/portfolio/${portfolioItemId}/create-repo`, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (res.status === 501) {
        toast.info(data?.detail ?? "GitHub isn't set up for this site yet — the owner needs to configure it first.");
        return;
      }
      if (data?.requiresConnection) {
        toast.info(data.error);
        return;
      }
      if (!res.ok) throw new Error(data?.error ?? "Couldn't create a repository.");
      toast.success(`Created ${data.repoFullName} on GitHub`);
      if (data.warning) toast.info(data.warning);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't create a repository.");
    } finally {
      setCreating(false);
    }
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex items-center gap-1.5 text-micro text-muted-foreground hover:text-foreground"
        >
          <FolderGit2 className="size-3.5" />
          {repoFullName ?? "Link a GitHub repo"}
        </button>
        {!repoFullName && (
          <button
            type="button"
            onClick={createRepo}
            disabled={creating}
            className="flex items-center gap-1.5 text-micro text-accent-600 hover:underline"
          >
            {creating ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
            Create a new one for this project
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="owner/repo" className="h-8 text-sm" />
      <Button size="sm" onClick={save} disabled={saving}>
        Save
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
        Cancel
      </Button>
    </div>
  );
}
