import Link from "next/link";
import { Users, GraduationCap, LifeBuoy, BookOpen, ArrowRight } from "lucide-react";

import { supabaseAdmin } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { LeadRow } from "@/types/db";

export default async function AdminOverviewPage() {
  const supabase = supabaseAdmin();

  const [
    { count: leadsCount },
    { count: enrollmentsCount },
    { count: ticketsCount },
    { count: coursesCount },
    { data: recentLeadsData },
  ] = await Promise.all([
    supabase.from("leads").select("*", { count: "exact", head: true }),
    supabase.from("enrollments").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("courses").select("*", { count: "exact", head: true }),
    supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(5),
  ]);

  const recentLeads = (recentLeadsData ?? []) as LeadRow[];

  const stats = [
    { label: "Total leads", value: leadsCount ?? 0, icon: Users },
    { label: "Active enrollments", value: enrollmentsCount ?? 0, icon: GraduationCap },
    { label: "Open support tickets", value: ticketsCount ?? 0, icon: LifeBuoy },
    { label: "Total courses", value: coursesCount ?? 0, icon: BookOpen },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardDescription>{stat.label}</CardDescription>
              <stat.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="font-heading text-h3 font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent leads</CardTitle>
            <CardDescription>The latest 5 leads captured.</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/leads">
              View all <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-border">
          {recentLeads.length === 0 && <p className="py-4 text-sm text-muted-foreground">No leads yet.</p>}
          {recentLeads.map((lead) => (
            <div key={lead.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium">{lead.name ?? "Unnamed"}</p>
                <p className="text-sm text-muted-foreground">{lead.email}</p>
              </div>
              <span className="text-micro text-muted-foreground">
                {new Date(lead.created_at).toLocaleDateString("en-IN")}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
