import { supabaseAdmin } from "@/lib/supabase/server";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import type { LeadRow } from "@/types/db";

export default async function AdminLeadsPage() {
  const { data } = await supabaseAdmin().from("leads").select("*").order("created_at", { ascending: false });
  const leads = (data ?? []) as LeadRow[];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-h3 font-semibold">Leads</h2>
        <p className="text-sm text-muted-foreground">{leads.length} total</p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell className="font-medium">{lead.name ?? "—"}</TableCell>
              <TableCell>{lead.email}</TableCell>
              <TableCell className="text-muted-foreground">{lead.phone ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">{lead.source ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(lead.created_at).toLocaleDateString("en-IN")}
              </TableCell>
            </TableRow>
          ))}
          {leads.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No leads yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
