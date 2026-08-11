import { redirect } from "next/navigation";
import { CalendarClock } from "lucide-react";

import { getCurrentUser } from "@/lib/current-user";
import { supabaseAdmin } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendlyEmbed } from "@/components/portal/calendly-embed";
import type { SessionRow } from "@/types/db";

export default async function SessionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const supabase = supabaseAdmin();
  const { data } = await supabase
    .from("sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("scheduled_at", { ascending: true });
  const sessions = (data ?? []) as SessionRow[];

  const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading text-h2 font-bold">1:1 sessions</h1>
        <p className="text-muted-foreground">Book time with a mentor whenever you&rsquo;re stuck or want a review.</p>
      </div>

      {sessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your bookings</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm"
              >
                <span className="flex items-center gap-2">
                  <CalendarClock className="size-4 text-muted-foreground" />
                  {session.scheduled_at
                    ? new Date(session.scheduled_at).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "Pending confirmation"}
                </span>
                <Badge variant={session.status === "cancelled" ? "destructive" : "success"} className="capitalize">
                  {session.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Book a new session</CardTitle>
          <CardDescription>Pick a time that works — you&rsquo;ll get a confirmation email from Calendly.</CardDescription>
        </CardHeader>
        <CardContent>
          {calendlyUrl ? (
            <CalendlyEmbed url={calendlyUrl} />
          ) : (
            <p className="text-sm text-muted-foreground">Booking is temporarily unavailable.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
