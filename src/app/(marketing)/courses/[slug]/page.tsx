import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, Lock } from "lucide-react";

import { Container, Section } from "@/components/shared/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { CourseRow, ModuleRow } from "@/types/db";

export const revalidate = 3600;

const EXAMPLE_RETAINERS = [
  { size: "₹15,000 / month", clients: "1 client" },
  { size: "₹15,000 / month", clients: "3 clients" },
  { size: "₹25,000 / month", clients: "3 clients" },
];

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props) {
  const supabase = supabaseAdmin();
  const { data } = await supabase.from("courses").select("title, description").eq("slug", params.slug).maybeSingle();
  const course = data as Pick<CourseRow, "title" | "description"> | null;
  if (!course) return { title: "Course" };
  return { title: course.title, description: course.description ?? undefined };
}

export default async function CourseDetailPage({ params }: Props) {
  const supabase = supabaseAdmin();

  const { data: courseData } = await supabase.from("courses").select("*").eq("slug", params.slug).maybeSingle();
  const course = courseData as CourseRow | null;

  if (!course) notFound();

  const { data: moduleData } = await supabase
    .from("modules")
    .select("*")
    .eq("course_id", course.id)
    .order("order_index", { ascending: true });
  const modules = (moduleData ?? []) as ModuleRow[];

  return (
    <div>
      <Section className="bg-primary bg-mesh-hero bg-noise pb-14 text-primary-foreground">
        <Container className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-start">
          <div className="flex flex-col gap-5">
            {course.track && (
              <Badge variant="accent" className="w-fit capitalize">
                {course.track.replace(/-/g, " ")}
              </Badge>
            )}
            <h1 className="text-balance font-heading text-h1 font-bold">{course.title}</h1>
            <p className="max-w-xl text-body-lg text-white/75">{course.description}</p>
          </div>

          <Card className="border-white/10 bg-white text-card-foreground shadow-lifted">
            <CardHeader>
              <CardTitle className="text-base text-muted-foreground">Course price</CardTitle>
              <p className="font-heading text-h2 font-bold">
                ₹{Number(course.price).toLocaleString("en-IN")}
              </p>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Button asChild size="lg" variant="accent" className="w-full">
                <Link href={`/checkout/${course.slug}`}>
                  Enroll now <ArrowRight className="size-4" />
                </Link>
              </Button>
              <p className="text-center text-micro text-muted-foreground">
                One-time payment. Lifetime access to this track.
              </p>
            </CardContent>
          </Card>
        </Container>
      </Section>

      <Section>
        <Container className="grid gap-12 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <h2 className="mb-5 font-heading text-h3 font-bold">What&rsquo;s inside this track</h2>
            {modules.length === 0 ? (
              <p className="text-muted-foreground">Module details are being finalized for this track.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {modules.map((module, i) => (
                  <li
                    key={module.id}
                    className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3.5"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary-700">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm font-medium">{module.title}</span>
                    <Lock className="size-4 shrink-0 text-muted-foreground" />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="font-heading text-h4 font-bold">What you get</h2>
            {[
              "Structured, hands-on modules",
              "Templates and playbooks to reuse with clients",
              "AI mentor support inside the portal",
              "Community access alongside other students",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2.5 text-sm">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="bg-muted/40">
        <Container>
          <div className="mb-8 max-w-2xl">
            <h2 className="font-heading text-h3 font-bold">Earnings potential</h2>
            <p className="mt-2 text-muted-foreground">
              A simple illustration of how freelancers commonly structure retainer pricing once they&rsquo;re
              taking on client work.
            </p>
          </div>
          <Card className="max-w-xl">
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Example retainer size</TableHead>
                    <TableHead>Clients</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {EXAMPLE_RETAINERS.map((row) => (
                    <TableRow key={`${row.size}-${row.clients}`}>
                      <TableCell>{row.size}</TableCell>
                      <TableCell>{row.clients}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableCaption>Illustrative example — your results will vary.</TableCaption>
              </Table>
            </CardContent>
          </Card>
        </Container>
      </Section>
    </div>
  );
}
