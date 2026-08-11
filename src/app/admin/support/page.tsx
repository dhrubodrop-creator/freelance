import { supabaseAdmin } from "@/lib/supabase/server";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TicketStatusSelect } from "@/components/admin/ticket-status-select";
import type { SupportTicketRow, SupportTicketStatus } from "@/types/db";

type SupportTicketWithUser = SupportTicketRow & {
  user: { name: string | null; email: string | null } | null;
};

const STATUS_VARIANT: Record<SupportTicketStatus, "outline" | "accent" | "success"> = {
  open: "outline",
  in_progress: "accent",
  resolved: "success",
};

export default async function AdminSupportPage() {
  const { data } = (await supabaseAdmin()
    .from("support_tickets")
    .select("*, user:users(name,email)")
    .order("created_at", { ascending: false })) as unknown as { data: SupportTicketWithUser[] | null };

  const tickets = data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-h3 font-semibold">Support tickets</h2>
        <p className="text-sm text-muted-foreground">{tickets.length} total</p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Message</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Filed</TableHead>
            <TableHead className="text-right">Update</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => (
            <TableRow key={ticket.id}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{ticket.user?.name ?? "Unknown"}</span>
                  <span className="text-sm text-muted-foreground">{ticket.user?.email}</span>
                </div>
              </TableCell>
              <TableCell className="max-w-md text-muted-foreground">{ticket.message}</TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[ticket.status]}>{ticket.status.replace("_", " ")}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(ticket.created_at).toLocaleDateString("en-IN")}
              </TableCell>
              <TableCell className="text-right">
                <TicketStatusSelect ticketId={ticket.id} status={ticket.status} />
              </TableCell>
            </TableRow>
          ))}
          {tickets.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No support tickets yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
