import { MessageCircle } from "lucide-react";

import { Container, Section } from "@/components/shared/container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ContactForm } from "@/components/marketing/contact-form";
import { WHATSAPP_LINK } from "@/lib/constants";
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

          <Card className="border-accent/30 bg-accent-50">
            <CardHeader>
              <CardTitle className="text-base">Prefer to chat?</CardTitle>
              <CardDescription>Message us directly on WhatsApp for a faster reply.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="accent">
                <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer">
                  <MessageCircle className="size-4" />
                  Chat on WhatsApp
                </a>
              </Button>
            </CardContent>
          </Card>
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
