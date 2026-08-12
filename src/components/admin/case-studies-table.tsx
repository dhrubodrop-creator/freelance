"use client";

import { Plus, Pencil } from "lucide-react";

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { EntityFormDialog, type EntityField } from "@/components/admin/entity-form-dialog";
import { DeleteButton } from "@/components/admin/delete-button";
import type { CaseStudyRow } from "@/types/db";

const CASE_STUDY_FIELDS: EntityField[] = [
  { name: "title", label: "Title", type: "text", required: true },
  { name: "summary", label: "Summary", type: "textarea" },
  { name: "image_url", label: "Image URL", type: "text" },
];

export function CaseStudiesTable({ caseStudies }: { caseStudies: CaseStudyRow[] }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-h3 font-semibold">Case studies</h2>
          <p className="text-sm text-muted-foreground">{caseStudies.length} total</p>
        </div>
        <EntityFormDialog
          trigger={
            <Button>
              <Plus className="size-4" /> New case study
            </Button>
          }
          title="New case study"
          fields={CASE_STUDY_FIELDS}
          endpoint="/api/admin/case-studies"
          method="POST"
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Summary</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {caseStudies.map((caseStudy) => (
            <TableRow key={caseStudy.id}>
              <TableCell className="font-medium">{caseStudy.title}</TableCell>
              <TableCell className="max-w-md truncate text-muted-foreground">
                {caseStudy.summary ?? "—"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <EntityFormDialog
                    trigger={
                      <Button variant="ghost" size="icon-sm" aria-label="Edit case study">
                        <Pencil className="size-4" />
                      </Button>
                    }
                    title="Edit case study"
                    fields={CASE_STUDY_FIELDS}
                    initialValues={caseStudy}
                    endpoint={`/api/admin/case-studies/${caseStudy.id}`}
                    method="PATCH"
                  />
                  <DeleteButton
                    endpoint={`/api/admin/case-studies/${caseStudy.id}`}
                    confirmMessage={`Delete "${caseStudy.title}"? This cannot be undone.`}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
          {caseStudies.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                No case studies yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
