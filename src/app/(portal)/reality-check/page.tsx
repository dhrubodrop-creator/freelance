import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, HelpCircle, XCircle } from "lucide-react";

import { getCurrentUser } from "@/lib/current-user";
import { runRealityCheck } from "@/lib/reality-check";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function RealityCheckPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const { overall, dimensions, thingsToFix } = await runRealityCheck(user.id);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-heading text-h2 font-bold">Reality Check</h1>
        <p className="mt-1 text-muted-foreground">Not &ldquo;did you finish the course&rdquo; — can you actually do the work.</p>
      </div>

      <Card className={overall === "READY" ? "border-success/40 bg-success/5" : "border-accent/40 bg-accent-50/30"}>
        <CardContent className="py-6 text-center">
          <p className="font-heading text-3xl font-bold">{overall === "READY" ? "READY" : "NOT READY"}</p>
        </CardContent>
      </Card>

      {overall !== "READY" && thingsToFix.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">3 things to fix</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {thingsToFix.map((f) => (
              <Button key={f.label} asChild variant="outline" size="sm" className="w-fit">
                <Link href={f.href}>{f.label}</Link>
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Capability breakdown</CardTitle>
          <CardDescription>Only scored where real evidence exists — everything else is marked, not guessed.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {dimensions.map((d) => (
            <div key={d.key} className="flex items-start gap-2.5 rounded-lg border border-border p-2.5 text-sm">
              {d.status === "ready" ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
              ) : d.status === "not_ready" ? (
                <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
              ) : (
                <HelpCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">{d.label}</p>
                <p className="text-micro text-muted-foreground">{d.evidence}</p>
              </div>
              {d.status === "not_available" && (
                <Badge variant="outline" className="ml-auto shrink-0 text-micro">
                  not tracked yet
                </Badge>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
