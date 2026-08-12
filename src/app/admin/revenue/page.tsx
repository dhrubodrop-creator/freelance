import { supabaseAdmin } from "@/lib/supabase/server";
import { getDiscountedPrice, formatINR } from "@/lib/pricing";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import type { CourseRow, EnrollmentRow } from "@/types/db";

export default async function AdminRevenuePage() {
  const supabase = supabaseAdmin();
  const { data } = await supabase.from("enrollments").select("*, course:courses(*)");
  const enrollments = (data ?? []) as (EnrollmentRow & { course: CourseRow | null })[];

  let gross = 0;
  let refunded = 0;
  const byCourse = new Map<string, { title: string; count: number; revenue: number }>();

  for (const e of enrollments) {
    if (!e.course) continue;
    if (e.status !== "active" && e.status !== "refunded") continue;

    const amount = getDiscountedPrice(Number(e.course.price), e.course.slug);
    gross += amount;
    if (e.status === "refunded") refunded += amount;

    const existing = byCourse.get(e.course.id) ?? { title: e.course.title, count: 0, revenue: 0 };
    existing.count += 1;
    existing.revenue += amount;
    byCourse.set(e.course.id, existing);
  }

  const net = gross - refunded;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-h3 font-semibold">Revenue</h2>
        <p className="text-sm text-muted-foreground">
          Computed from real enrollment records and the actual charged price per course — not an estimate.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Gross revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-h3 font-bold">{formatINR(gross)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Refunded</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-h3 font-bold text-destructive">{formatINR(refunded)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Net revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-h3 font-bold text-success">{formatINR(net)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">By course</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead>Paid enrollments</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from(byCourse.values()).map((c) => (
                <TableRow key={c.title}>
                  <TableCell className="font-medium">{c.title}</TableCell>
                  <TableCell>{c.count}</TableCell>
                  <TableCell className="text-right">{formatINR(c.revenue)}</TableCell>
                </TableRow>
              ))}
              {byCourse.size === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No paid enrollments yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
