"use client";

import { Plus, Pencil } from "lucide-react";

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EntityFormDialog, type EntityField } from "@/components/admin/entity-form-dialog";
import { DeleteButton } from "@/components/admin/delete-button";
import type { OpportunityRow, SkillCategoryRow } from "@/types/db";

function fields(categories: SkillCategoryRow[]): EntityField[] {
  return [
    { name: "title", label: "Title", type: "text", required: true },
    {
      name: "type",
      label: "Type",
      type: "select",
      required: true,
      options: [
        { value: "job", label: "Job" },
        { value: "freelance", label: "Freelance" },
        { value: "consulting", label: "Consulting" },
        { value: "training", label: "Training" },
        { value: "partnership", label: "Partnership" },
        { value: "business_lead", label: "Business lead" },
      ],
    },
    { name: "description", label: "Description", type: "textarea" },
    {
      name: "category_id",
      label: "Skill category",
      type: "select",
      options: categories.map((c) => ({ value: c.id, label: c.name })),
    },
    { name: "location", label: "Location", type: "text" },
    {
      name: "is_remote",
      label: "Remote?",
      type: "select",
      options: [
        { value: "true", label: "Remote" },
        { value: "false", label: "On-site / hybrid" },
      ],
    },
    { name: "compensation_range", label: "Compensation range", type: "text", placeholder: "e.g. ₹40,000–₹80,000/month" },
    { name: "source_url", label: "Source URL", type: "text" },
  ];
}

export function OpportunitiesTable({
  opportunities,
  categories,
}: {
  opportunities: OpportunityRow[];
  categories: SkillCategoryRow[];
}) {
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const opportunityFields = fields(categories);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-h3 font-semibold">Opportunities</h2>
          <p className="text-sm text-muted-foreground">
            {opportunities.length} curated · no external feed connected yet
          </p>
        </div>
        <EntityFormDialog
          trigger={
            <Button>
              <Plus className="size-4" /> New opportunity
            </Button>
          }
          title="New opportunity"
          fields={opportunityFields}
          endpoint="/api/admin/opportunities"
          method="POST"
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Location</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {opportunities.map((opp) => (
            <TableRow key={opp.id}>
              <TableCell className="font-medium">{opp.title}</TableCell>
              <TableCell>
                <Badge variant="outline">{opp.type.replace("_", " ")}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {opp.category_id ? categoryById.get(opp.category_id)?.name ?? "—" : "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {opp.is_remote ? "Remote" : opp.location ?? "—"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <EntityFormDialog
                    trigger={
                      <Button variant="ghost" size="icon-sm" aria-label="Edit opportunity">
                        <Pencil className="size-4" />
                      </Button>
                    }
                    title="Edit opportunity"
                    fields={opportunityFields}
                    initialValues={opp}
                    endpoint={`/api/admin/opportunities/${opp.id}`}
                    method="PATCH"
                  />
                  <DeleteButton
                    endpoint={`/api/admin/opportunities/${opp.id}`}
                    confirmMessage={`Delete "${opp.title}"? This cannot be undone.`}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
          {opportunities.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No opportunities curated yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
