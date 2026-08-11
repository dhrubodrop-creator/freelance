"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function DeleteButton({
  endpoint,
  confirmMessage,
}: {
  endpoint: string;
  confirmMessage: string;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function handleDelete() {
    if (typeof window !== "undefined" && !window.confirm(confirmMessage)) return;

    setPending(true);
    try {
      const res = await fetch(endpoint, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const message = typeof data?.error === "string" ? data.error : "Delete failed. Please try again.";
        throw new Error(message);
      }
      toast.success("Deleted");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label="Delete"
      disabled={pending}
      onClick={handleDelete}
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
