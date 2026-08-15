import { Container, Section } from "@/components/shared/container";
import { ContactForm } from "@/components/marketing/contact-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "Contact Ropes", description: "Ask Ropes about course fit, your professional background, the learning experience, enrollment, or support.", path: "/contact" });

export default function ContactPage() {
  return (
    <Section>
      <Container className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-start">
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="font-heading text-h1 font-bold">Get in touch</h1>
            <p className="mt-3 max-w-md text-body-lg text-muted-foreground">
              Questions about a track, your background, or how the program works — reach out and
              we&rsquo;ll get back to you by email.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Send us a message</CardTitle>
          </CardHeader>
          <CardContent>
            <ContactForm />
          </CardContent>
        </Card>
      </Container>
    </Section>
  );
}
