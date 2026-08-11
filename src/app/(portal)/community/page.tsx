import { redirect } from "next/navigation";
import { Megaphone, Sparkles } from "lucide-react";

import { getCurrentUser } from "@/lib/current-user";
import { supabaseAdmin } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RetainerSubscribeButton } from "@/components/portal/retainer-subscribe-button";
import { ENABLE_RETAINER_SUBSCRIPTIONS } from "@/lib/constants";
import type { AnnouncementRow } from "@/types/db";

export default async function CommunityPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const supabase = supabaseAdmin();
  const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
  const announcements = (data ?? []) as AnnouncementRow[];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading text-h2 font-bold">Community</h1>
        <p className="text-muted-foreground">Weekly live sessions, resource drops, and updates.</p>
      </div>

      <Card className="border-accent/40 bg-gradient-to-br from-accent-50 to-background">
        <CardHeader>
          <Badge variant="accent" className="w-fit gap-1">
            <Sparkles className="size-3" />
            Retainer tier
          </Badge>
          <CardTitle className="text-h4">Stay accountable with an ongoing retainer</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Monthly group calls, priority mentor access, and first look at new templates as they&rsquo;re added.
          </p>
          {ENABLE_RETAINER_SUBSCRIPTIONS ? (
            <RetainerSubscribeButton />
          ) : (
            <p className="text-sm text-muted-foreground">
              {/* TODO: enable once a live Razorpay business account and retainer plan are configured */}
              Retainer subscriptions open soon — you&rsquo;ll see an option here once they do.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        {announcements.length === 0 && (
          <p className="text-sm text-muted-foreground">No announcements yet — check back soon.</p>
        )}
        {announcements.map((a) => (
          <Card key={a.id}>
            <CardContent className="flex items-start gap-3 py-5">
              <Megaphone className="mt-0.5 size-4 shrink-0 text-primary-700" />
              <div>
                <p className="font-heading text-sm font-semibold">{a.title}</p>
                <p className="text-sm text-muted-foreground">{a.body}</p>
                <p className="mt-1 text-micro text-muted-foreground/70">
                  {new Date(a.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
