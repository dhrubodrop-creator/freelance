import Link from "next/link";
import { redirect } from "next/navigation";
import { Briefcase, CheckCircle2, HelpCircle } from "lucide-react";

import { getCurrentUser } from "@/lib/current-user";
import { buildSellableOffers } from "@/lib/commercial-offers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function WhatCanISellPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const offers = await buildSellableOffers(user.id);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="font-heading text-h2 font-bold">What can I sell?</h1>
        <p className="mt-1 text-muted-foreground">
          Based on what you have actually demonstrated, these are the capabilities you may be able to package into
          professional services.
        </p>
      </div>

      {offers.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Briefcase className="size-8 text-muted-foreground" />
            <p className="font-medium">Nothing sellable yet — and that&rsquo;s an honest answer, not a placeholder.</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              An offer only appears here once you have at least one VERIFIED skill (real evidence, not a
              self-rating). Complete an exercise or attach a project to a skill to start building this.
            </p>
          </CardContent>
        </Card>
      )}

      {offers.map((offer) => (
        <Card key={offer.categoryId}>
          <CardHeader>
            <CardTitle className="text-base">{offer.offerName}</CardTitle>
            <div className="flex items-center gap-2 pt-1">
              <Badge variant={offer.readiness >= 60 ? "success" : "outline"}>Readiness: {offer.readiness}/100</Badge>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <div>
              <p className="text-micro font-semibold uppercase tracking-wide text-muted-foreground">Target buyer</p>
              <p>{offer.targetBuyer}</p>
            </div>
            <div>
              <p className="text-micro font-semibold uppercase tracking-wide text-muted-foreground">Problem solved</p>
              <p>{offer.problem}</p>
            </div>
            <div>
              <p className="text-micro font-semibold uppercase tracking-wide text-muted-foreground">Proposed deliverable</p>
              <p>{offer.deliverable}</p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {offer.verifiedSkills.map((s) => (
                <Badge key={s} variant="success" className="gap-1">
                  <CheckCircle2 className="size-3" /> {s} — Verified
                </Badge>
              ))}
              {offer.selfReportedOnlySkills.map((s) => (
                <Badge key={s} variant="outline" className="gap-1">
                  <HelpCircle className="size-3" /> {s} — Self-reported
                </Badge>
              ))}
            </div>

            {offer.supportingProjects.length > 0 && (
              <div>
                <p className="text-micro font-semibold uppercase tracking-wide text-muted-foreground">Supporting projects</p>
                <ul className="mt-1 list-disc pl-4">
                  {offer.supportingProjects.map((p) => (
                    <li key={p.id}>{p.title}</li>
                  ))}
                </ul>
              </div>
            )}

            {offer.supportingEvidence.length > 0 && (
              <div>
                <p className="text-micro font-semibold uppercase tracking-wide text-muted-foreground">Supporting evidence</p>
                <p>{offer.supportingEvidence.join(" · ")}</p>
              </div>
            )}

            {offer.marketSignal && (
              <p className="text-micro text-muted-foreground">
                Market signal: {offer.marketSignal.signal} — <span className="italic">{offer.marketSignal.source}</span>
              </p>
            )}

            {offer.missingEvidence.length > 0 && (
              <div>
                <p className="text-micro font-semibold uppercase tracking-wide text-muted-foreground">Missing evidence</p>
                <ul className="mt-1 list-disc pl-4 text-muted-foreground">
                  {offer.missingEvidence.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center gap-3 pt-1">
              <Button asChild size="sm" variant="accent">
                <Link href={offer.nextAction.href}>Build this offer</Link>
              </Button>
              <span className="text-micro text-muted-foreground">{offer.nextAction.label}</span>
            </div>
          </CardContent>
        </Card>
      ))}

      {offers.length > 0 && (
        <p className="text-micro text-muted-foreground">
          These are suggested starting points based on your real evidence — not a guarantee of demand, clients, or
          income.
        </p>
      )}
    </div>
  );
}
