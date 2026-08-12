import { supabaseAdmin } from "@/lib/supabase/server";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { AdminAuditLogRow, UserRow } from "@/types/db";

export default async function AdminAuditLogsPage() {
  const supabase = supabaseAdmin();
  const { data: logs } = await supabase
    .from("admin_audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = (logs ?? []) as AdminAuditLogRow[];
  const actorIds = Array.from(new Set(rows.map((r) => r.actor_user_id).filter((id): id is string => Boolean(id))));
  const { data: actors } = actorIds.length
    ? await supabase.from("users").select("id, name, email").in("id", actorIds)
    : { data: [] };
  const actorById = new Map(((actors ?? []) as Pick<UserRow, "id" | "name" | "email">[]).map((a) => [a.id, a]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-h3 font-semibold">Audit logs</h2>
        <p className="text-sm text-muted-foreground">Last 100 admin actions. Never includes passwords or payment secrets.</p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>When</TableHead>
            <TableHead>Actor</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Target</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((log) => {
            const actor = log.actor_user_id ? actorById.get(log.actor_user_id) : null;
            return (
              <TableRow key={log.id}>
                <TableCell className="whitespace-nowrap text-micro text-muted-foreground">
                  {new Date(log.created_at).toLocaleString("en-IN")}
                </TableCell>
                <TableCell className="text-sm">{actor?.name ?? actor?.email ?? "Unknown"}</TableCell>
                <TableCell>
                  <Badge variant="outline">{log.action}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {log.target_type}
                  {log.target_id ? ` · ${log.target_id.slice(0, 8)}…` : ""}
                </TableCell>
              </TableRow>
            );
          })}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                No admin actions logged yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
