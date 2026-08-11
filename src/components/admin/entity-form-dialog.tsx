"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type EntityField =
  | { name: string; label: string; type: "text" | "number"; required?: boolean; placeholder?: string }
  | { name: string; label: string; type: "textarea"; required?: boolean; placeholder?: string }
  | { name: string; label: string; type: "select"; required?: boolean; options: { value: string; label: string }[] };

type FieldValue = string | number | null | undefined;

/**
 * Generic create/edit dialog used by every admin CRUD list (courses, modules,
 * case studies, announcements). Renders a form from a `fields` config, POSTs
 * or PATCHes `endpoint` with the collected values as JSON, then refreshes
 * the current route's server data.
 */
export function EntityFormDialog({
  trigger,
  title,
  fields,
  initialValues,
  endpoint,
  method,
  extraBody,
}: {
  trigger: React.ReactNode;
  title: string;
  fields: EntityField[];
  initialValues?: object;
  endpoint: string;
  method: "POST" | "PATCH";
  extraBody?: Record<string, unknown>;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [values, setValues] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (!open) return;
    const source = initialValues as Record<string, FieldValue> | undefined;
    const next: Record<string, string> = {};
    for (const field of fields) {
      const value = source?.[field.name];
      next[field.name] = value === null || value === undefined ? "" : String(value);
    }
    setValues(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, ...extraBody }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const message =
          typeof data?.error === "string" ? data.error : "Something went wrong. Please try again.";
        throw new Error(message);
      }
      toast.success(method === "POST" ? "Created successfully" : "Saved changes");
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {fields.map((field) => (
            <div key={field.name} className="flex flex-col gap-1.5">
              <Label htmlFor={field.name}>{field.label}</Label>
              {field.type === "textarea" ? (
                <Textarea
                  id={field.name}
                  placeholder={field.placeholder}
                  required={field.required}
                  value={values[field.name] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                />
              ) : field.type === "select" ? (
                <Select
                  value={values[field.name] ?? ""}
                  onValueChange={(val) => setValues((v) => ({ ...v, [field.name]: val }))}
                >
                  <SelectTrigger id={field.name}>
                    <SelectValue placeholder={field.label} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={field.name}
                  type={field.type === "number" ? "number" : "text"}
                  placeholder={field.placeholder}
                  required={field.required}
                  value={values[field.name] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                />
              )}
            </div>
          ))}
          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
