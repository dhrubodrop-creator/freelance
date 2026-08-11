"use client";

import Link from "next/link";
import { Plus, Pencil } from "lucide-react";

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { EntityFormDialog, type EntityField } from "@/components/admin/entity-form-dialog";
import { DeleteButton } from "@/components/admin/delete-button";
import type { CourseRow } from "@/types/db";

const COURSE_FIELDS: EntityField[] = [
  { name: "title", label: "Title", type: "text", required: true },
  { name: "slug", label: "Slug", type: "text", required: true, placeholder: "e.g. ai-agency-foundations" },
  { name: "price", label: "Price (INR)", type: "number", required: true },
  { name: "track", label: "Track", type: "text" },
  { name: "description", label: "Description", type: "textarea" },
];

export function CoursesTable({ courses }: { courses: CourseRow[] }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-h3 font-semibold">Courses</h2>
          <p className="text-sm text-muted-foreground">{courses.length} total</p>
        </div>
        <EntityFormDialog
          trigger={
            <Button>
              <Plus className="size-4" /> New course
            </Button>
          }
          title="New course"
          fields={COURSE_FIELDS}
          endpoint="/api/admin/courses"
          method="POST"
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Track</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {courses.map((course) => (
            <TableRow key={course.id}>
              <TableCell>
                <Link href={`/admin/courses/${course.id}`} className="font-medium hover:underline">
                  {course.title}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">{course.slug}</TableCell>
              <TableCell>₹{Number(course.price).toLocaleString("en-IN")}</TableCell>
              <TableCell className="text-muted-foreground">{course.track ?? "—"}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <EntityFormDialog
                    trigger={
                      <Button variant="ghost" size="icon-sm" aria-label="Edit course">
                        <Pencil className="size-4" />
                      </Button>
                    }
                    title="Edit course"
                    fields={COURSE_FIELDS}
                    initialValues={course}
                    endpoint={`/api/admin/courses/${course.id}`}
                    method="PATCH"
                  />
                  <DeleteButton
                    endpoint={`/api/admin/courses/${course.id}`}
                    confirmMessage={`Delete "${course.title}"? This cannot be undone.`}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
          {courses.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No courses yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
