"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FolderGit2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function GitHubRepoLink({ portfolioItemId, repoFullName }: { portfolioItemId: string; repoFullName: string | null }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(repoFullName ?? "");
  const [saving, setSaving] = useState(false);

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
      toast.success("Repository linked");
      router.refresh();
    } catch {
      toast.error("Couldn't link that repo — use the owner/repo format.");
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="flex items-center gap-1.5 text-micro text-muted-foreground hover:text-foreground"
      >
        <FolderGit2 className="size-3.5" />
        {repoFullName ?? "Link a GitHub repo"}
      </button>
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
