import { ExternalLink, Wrench, BadgeCheck } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CourseIndustryData } from "@/lib/industry-data";

export function IndustrySnapshot({ data }: { data: CourseIndustryData }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-h3 font-bold">Industry snapshot</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Real, sourced research — current tools, market signal, and named case studies, each with a
          citation. Not marketing copy.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wrench className="size-4 text-accent-600" />
              Tools you&rsquo;ll actually see in the field
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {data.tools.map((tool) => (
              <div key={tool.name} className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold">{tool.name}</span>
                <span className="text-sm text-muted-foreground">{tool.description}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BadgeCheck className="size-4 text-primary-700" />
              Market signal
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {data.facts.map((fact) => (
              <div key={fact.detail} className="flex flex-col gap-1 border-l-2 border-primary-100 pl-3">
                <span className="text-sm">{fact.detail}</span>
                <span className="text-micro text-muted-foreground">Source: {fact.source}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Go deeper — free, official resources</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {data.resources.map((resource) => (
            <a
              key={resource.url}
              href={resource.url}
              target="_blank"
              rel="noreferrer noopener"
              className="flex items-start gap-2.5 rounded-lg border border-border px-3.5 py-2.5 text-sm transition-colors hover:bg-muted"
            >
              <ExternalLink className="mt-0.5 size-4 shrink-0 text-accent-600" />
              <span className="flex flex-col">
                <span className="font-medium">{resource.title}</span>
                <span className="text-micro text-muted-foreground">{resource.description}</span>
              </span>
            </a>
          ))}
        </CardContent>
      </Card>

      <div className="flex items-start gap-2.5 rounded-lg bg-muted/50 px-4 py-3.5 text-sm">
        <Badge variant="outline" className="mt-0.5 shrink-0">
          Certification
        </Badge>
        <span className="text-muted-foreground">{data.certification}</span>
      </div>
    </div>
  );
}
