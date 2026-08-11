"use client";

import Link from "next/link";
import { ArrowLeft, Plus, Pencil } from "lucide-react";

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { EntityFormDialog, type EntityField } from "@/components/admin/entity-form-dialog";
import { DeleteButton } from "@/components/admin/delete-button";
import type { ModuleRow } from "@/types/db";

const MODULE_FIELDS: EntityField[] = [
  { name: "title", label: "Title", type: "text", required: true },
  { name: "video_url", label: "Video URL", type: "text" },
  { name: "order_index", label: "Order", type: "number", required: true },
];

export function ModulesTable({ courseId, modules }: { courseId: string; modules: ModuleRow[] }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/courses">
            <ArrowLeft className="size-4" /> Back to courses
          </Link>
        </Button>
        <EntityFormDialog
          trigger={
            <Button>
              <Plus className="size-4" /> New module
            </Button>
          }
          title="New module"
          fields={MODULE_FIELDS}
          endpoint="/api/admin/modules"
          method="POST"
          extraBody={{ course_id: courseId }}
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Video URL</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {modules.map((module) => (
            <TableRow key={module.id}>
              <TableCell>{module.order_index}</TableCell>
              <TableCell className="font-medium">{module.title}</TableCell>
              <TableCell className="text-muted-foreground">{module.video_url ?? "—"}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <EntityFormDialog
                    trigger={
                      <Button variant="ghost" size="icon-sm" aria-label="Edit module">
                        <Pencil className="size-4" />
                      </Button>
                    }
                    title="Edit module"
                    fields={MODULE_FIELDS}
                    initialValues={module}
                    endpoint={`/api/admin/modules/${module.id}`}
                    method="PATCH"
                  />
                  <DeleteButton
                    endpoint={`/api/admin/modules/${module.id}`}
                    confirmMessage={`Delete "${module.title}"? This cannot be undone.`}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
          {modules.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                No modules yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
