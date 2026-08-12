"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileText, Loader2, UploadCloud } from "lucide-react";

export function CvUpload({ hasCv }: { hasCv: boolean }) {
  const router = useRouter();
  const [uploading, setUploading] = React.useState(false);

  async function handleFile(file: File | null) {
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("CV must be a PDF");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.set("cv", file);
      const res = await fetch("/api/profile/cv", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(typeof data?.error === "string" ? data.error : "Upload failed.");
      }
      toast.success("CV updated");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor="cv-upload"
        className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-input bg-background px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-ring"
      >
        {uploading ? (
          <Loader2 className="size-4 shrink-0 animate-spin" />
        ) : hasCv ? (
          <FileText className="size-4 shrink-0" />
        ) : (
          <UploadCloud className="size-4 shrink-0" />
        )}
        {uploading ? "Uploading…" : hasCv ? "CV on file — click to replace" : "Upload your CV (PDF)"}
      </label>
      <input
        id="cv-upload"
        type="file"
        accept="application/pdf"
        className="hidden"
        disabled={uploading}
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
