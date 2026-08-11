"use client";

import { Plus, Pencil } from "lucide-react";

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { EntityFormDialog, type EntityField } from "@/components/admin/entity-form-dialog";
import { DeleteButton } from "@/components/admin/delete-button";
import type { AnnouncementRow } from "@/types/db";

const ANNOUNCEMENT_FIELDS: EntityField[] = [
  { name: "title", label: "Title", type: "text", required: true },
  { name: "body", label: "Body", type: "textarea", required: true },
];

export function AnnouncementsTable({ announcements }: { announcements: AnnouncementRow[] }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-h3 font-semibold">Announcements</h2>
          <p className="text-sm text-muted-foreground">{announcements.length} total</p>
        </div>
        <EntityFormDialog
          trigger={
            <Button>
              <Plus className="size-4" /> New announcement
            </Button>
          }
          title="New announcement"
          fields={ANNOUNCEMENT_FIELDS}
          endpoint="/api/admin/announcements"
          method="POST"
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Body</TableHead>
            <TableHead>Posted</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {announcements.map((announcement) => (
            <TableRow key={announcement.id}>
              <TableCell className="font-medium">{announcement.title}</TableCell>
              <TableCell className="max-w-md truncate text-muted-foreground">{announcement.body}</TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(announcement.created_at).toLocaleDateString("en-IN")}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <EntityFormDialog
                    trigger={
                      <Button variant="ghost" size="icon-sm" aria-label="Edit announcement">
                        <Pencil className="size-4" />
                      </Button>
                    }
                    title="Edit announcement"
                    fields={ANNOUNCEMENT_FIELDS}
                    initialValues={announcement}
                    endpoint={`/api/admin/announcements/${announcement.id}`}
                    method="PATCH"
                  />
                  <DeleteButton
                    endpoint={`/api/admin/announcements/${announcement.id}`}
                    confirmMessage={`Delete "${announcement.title}"? This cannot be undone.`}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
          {announcements.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                No announcements yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
