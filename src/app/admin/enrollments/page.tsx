import { supabaseAdmin } from "@/lib/supabase/server";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { EnrollmentRow, EnrollmentStatus } from "@/types/db";

type EnrollmentWithRelations = EnrollmentRow & {
  user: { name: string | null; email: string | null } | null;
  course: { title: string } | null;
};

const STATUS_VARIANT: Record<EnrollmentStatus, "default" | "outline" | "destructive" | "success"> = {
  active: "success",
  pending: "outline",
  cancelled: "destructive",
  refunded: "destructive",
};

export default async function AdminEnrollmentsPage() {
  const { data } = (await supabaseAdmin()
    .from("enrollments")
    .select("*, user:users(name,email), course:courses(title)")
    .order("created_at", { ascending: false })) as unknown as { data: EnrollmentWithRelations[] | null };

  const enrollments = data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-h3 font-semibold">Enrollments</h2>
        <p className="text-sm text-muted-foreground">{enrollments.length} total</p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Course</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Enrolled</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {enrollments.map((enrollment) => (
            <TableRow key={enrollment.id}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{enrollment.user?.name ?? "Unknown"}</span>
                  <span className="text-sm text-muted-foreground">{enrollment.user?.email}</span>
                </div>
              </TableCell>
              <TableCell>{enrollment.course?.title ?? "—"}</TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[enrollment.status]}>{enrollment.status}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(enrollment.created_at).toLocaleDateString("en-IN")}
              </TableCell>
            </TableRow>
          ))}
          {enrollments.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                No enrollments yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
