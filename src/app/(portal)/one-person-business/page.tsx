import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Circle, MinusCircle } from "lucide-react";

import { getCurrentUser } from "@/lib/current-user";
import { buildOnePersonBusinessPlan } from "@/lib/one-person-business";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function OnePersonBusinessPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const stages = await buildOnePersonBusinessPlan(user.id);
  const definedCount = stages.filter((s) => s.status === "defined").length;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="font-heading text-h2 font-bold">One-person business</h1>
        <p className="mt-1 text-muted-foreground">
          The 11 things a one-person service business needs, and where you actually stand on each — built from your
          real evidence, not a template.
        </p>
        <p className="mt-2 text-micro font-semibold uppercase tracking-wide text-muted-foreground">
          {definedCount}/{stages.length} stages defined
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {stages.map((stage, i) => (
          <Card key={stage.key}>
            <CardContent className="flex items-start gap-3 py-4">
              <div className="flex flex-col items-center pt-0.5">
                {stage.status === "defined" ? (
                  <CheckCircle2 className="size-5 text-success" />
                ) : stage.status === "not_configured" ? (
                  <MinusCircle className="size-5 text-muted-foreground" />
                ) : (
                  <Circle className="size-5 text-muted-foreground/40" />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-micro font-semibold text-muted-foreground">{i + 1}.</span>
                  <p className="font-medium">{stage.label}</p>
                  <Badge
                    variant={
                      stage.status === "defined" ? "success" : stage.status === "not_configured" ? "outline" : "outline"
                    }
                  >
                    {stage.status === "defined" ? "Defined" : stage.status === "not_configured" ? "Not configured" : "Needs attention"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{stage.evidence}</p>
                {stage.nextAction && (
                  <div className="pt-1">
                    <Button asChild size="sm" variant={stage.status === "not_configured" ? "outline" : "accent"}>
                      <Link href={stage.nextAction.href}>{stage.nextAction.label}</Link>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-micro text-muted-foreground">
        This view is built entirely from your real activity on Ropes. It does not guarantee clients, income, or
        demand — it shows you what a buyer would actually see if they looked.
      </p>
    </div>
  );
}
