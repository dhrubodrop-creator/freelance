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
  // Enrollment includes exactly one 1:1 mentor session (no course_id on this table — it's a
  // per-user entitlement, not per-course). Any non-cancelled booking counts as used.
  const hasUsedSession = sessions.some((s) => s.status !== "cancelled");

  const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading text-h2 font-bold">1:1 session</h1>
        <p className="text-muted-foreground">
          Your enrollment includes one 1:1 mentor session — book it whenever you&rsquo;re stuck or want a review.
        </p>
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

      {hasUsedSession ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your 1:1 session is booked</CardTitle>
            <CardDescription>
              Your enrollment includes one 1:1 mentor session, and you&rsquo;ve already used it. Reach out
              through Support if something came up with your scheduled time.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Book your 1:1 session</CardTitle>
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
      )}
    </div>
  );
}
