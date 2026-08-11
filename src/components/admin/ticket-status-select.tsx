"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SupportTicketStatus } from "@/types/db";

const STATUS_OPTIONS: { value: SupportTicketStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
];

export function TicketStatusSelect({ ticketId, status }: { ticketId: string; status: SupportTicketStatus }) {
  const router = useRouter();
  const [value, setValue] = React.useState<SupportTicketStatus>(status);
  const [pending, setPending] = React.useState(false);

  async function handleChange(nextStatus: string) {
    const previous = value;
    setValue(nextStatus as SupportTicketStatus);
    setPending(true);
    try {
      const res = await fetch(`/api/admin/support/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const message = typeof data?.error === "string" ? data.error : "Could not update status.";
        throw new Error(message);
      }
      toast.success("Status updated");
      router.refresh();
    } catch (err) {
      setValue(previous);
      toast.error(err instanceof Error ? err.message : "Could not update status.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Select value={value} onValueChange={handleChange} disabled={pending}>
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
