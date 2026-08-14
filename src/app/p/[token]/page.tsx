import { notFound } from "next/navigation";
import { Award, ExternalLink, Sparkles, Trophy } from "lucide-react";

import { getPublicProofByToken } from "@/lib/proof-share";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function PublicProofPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const proof = await getPublicProofByToken(token);
  if (!proof) notFound();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-12">
      <div>
        <h1 className="font-heading text-h2 font-bold">{proof.name ?? "Verified Proof Profile"}</h1>
        <p className="mt-1 text-muted-foreground">
          Verified via Ropes — every skill and score here is backed by real evidence, not self-reported claims.
        </p>
      </div>

      {proof.skills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4 text-accent-600" /> Verified skills
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {proof.skills.map((s) => (
              <Badge key={s.name} variant={s.level === "strong" ? "accent" : "success"}>
                {s.name} — {s.level}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      {proof.capstones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="size-4 text-accent-600" /> Capstones
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {proof.capstones.map((c) => (
              <div key={c.title} className="flex items-center justify-between rounded-lg border border-border px-3.5 py-2.5 text-sm">
                <span>{c.title}</span>
                {c.avgScore !== null && <Badge variant="accent">{c.avgScore}/100</Badge>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {proof.projects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="size-4 text-accent-600" /> Projects
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {proof.projects.map((p) => (
              <div key={p.title} className="rounded-lg border border-border p-3.5 text-sm">
                <p className="font-medium">{p.title}</p>
                {p.description && <p className="mt-1 text-muted-foreground">{p.description}</p>}
                {p.caseStudy && <p className="mt-1 text-muted-foreground">{p.caseStudy}</p>}
                {p.liveUrl && (
                  <a href={p.liveUrl} target="_blank" rel="noreferrer noopener" className="mt-1 flex items-center gap-1.5 text-accent-600 hover:underline">
                    <ExternalLink className="size-3.5" /> {p.liveUrl}
                  </a>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
