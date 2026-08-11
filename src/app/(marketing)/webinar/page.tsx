import { CalendarClock, Laptop, MessageCircleQuestion, Wrench } from "lucide-react";

import { Container, Section } from "@/components/shared/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WebinarForm } from "@/components/marketing/webinar-form";

const AGENDA = [
  {
    icon: Wrench,
    title: "What the work actually looks like",
    description: "A walkthrough of the AI no-code systems freelancers build for clients — outreach agents, ops automations, and internal tools.",
  },
  {
    icon: Laptop,
    title: "The tools, live",
    description: "See the no-code and AI tooling in action, not just slides — how a system gets built end to end.",
  },
  {
    icon: MessageCircleQuestion,
    title: "Live Q&A",
    description: "Bring your questions about the path, the time commitment, and whether it fits your background.",
  },
];

export default function WebinarPage() {
  return (
    <div>
      <Section className="bg-primary bg-mesh-hero bg-noise text-primary-foreground">
        <Container className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div className="flex flex-col gap-5">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 px-3.5 py-1.5 text-micro font-semibold uppercase tracking-wide text-white/80">
              <CalendarClock className="size-3.5" />
              Free live webinar
            </span>
            <h1 className="text-balance font-heading text-h1 font-bold">
              See how working professionals build AI systems and go independent
            </h1>
            <p className="max-w-lg text-body-lg text-white/75">
              A free, live session on what it takes to learn AI no-code tooling and start taking on
              client work — no prior technical background required.
            </p>
          </div>

          <Card className="border-white/10 bg-white text-card-foreground shadow-lifted">
            <CardHeader>
              <CardTitle>Reserve your free seat</CardTitle>
            </CardHeader>
            <CardContent>
              <WebinarForm />
            </CardContent>
          </Card>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="mb-10 max-w-xl">
            <h2 className="font-heading text-h2 font-bold">What we&rsquo;ll cover</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {AGENDA.map((item) => (
              <div key={item.title} className="flex flex-col gap-3">
                <div className="flex size-11 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
                  <item.icon className="size-5" />
                </div>
                <h3 className="font-heading text-lg font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>
    </div>
  );
}
