import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

import { Container, Section } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page not found",
  alternates: { canonical: null },
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return <Section className="flex min-h-[70vh] items-center bg-primary bg-mesh-hero bg-noise text-primary-foreground"><Container className="text-center"><Compass className="mx-auto size-10 text-accent" /><p className="mt-5 text-micro font-semibold uppercase tracking-wide text-accent">404 · Route not found</p><h1 className="mx-auto mt-3 max-w-2xl font-heading text-h1 font-bold">This path does not exist—or has moved.</h1><p className="mx-auto mt-4 max-w-xl text-white/70">Return to the Ropes resource hub to explore AI freelancing, professional pathways, skills, project briefs, and courses.</p><div className="mt-8 flex flex-wrap justify-center gap-3"><Button asChild variant="accent"><Link href="/resources">Explore resources</Link></Button><Button asChild variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"><Link href="/"><ArrowLeft className="size-4" /> Back home</Link></Button></div></Container></Section>;
}
