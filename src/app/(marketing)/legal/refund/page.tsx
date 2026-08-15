import { Container, Section } from "@/components/shared/container";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "Refund Policy", description: "The Ropes course refund policy, eligibility conditions, request process, and payment handling information.", path: "/legal/refund" });

export default function RefundPage() {
  return (
    <Section>
      <Container className="max-w-3xl">
        <h1 className="font-heading text-h1 font-bold">Refund Policy</h1>
        <p className="mt-3 text-sm text-muted-foreground">Last updated: 15 August 2026</p>

        <div className="mt-10 flex flex-col gap-10">
          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-h4 font-semibold">1. All sales are final</h2>
            <p className="max-w-prose text-muted-foreground">
              Course purchases on Ropes are non-refundable. Once your enrollment is confirmed, access to
              the course is granted immediately and in full, so we do not offer refunds, exchanges, or
              cancellations for change of mind, lack of time, dissatisfaction with your own progress, or
              any reason not listed in Section 2 below — regardless of how much of the course you have
              used.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-h4 font-semibold">2. Exceptions required by law</h2>
            <p className="max-w-prose text-muted-foreground">
              This policy does not limit any right you have under Indian consumer protection law that
              cannot be waived by agreement. In particular, we will refund a payment where:
            </p>
            <ul className="ml-5 list-disc max-w-prose text-muted-foreground">
              <li>you were charged more than once for the same enrollment (duplicate payment), or charged
                after a failed or cancelled transaction;</li>
              <li>payment was received but course access was never granted due to a technical or
                processing error on our side; or</li>
              <li>the course, as delivered, is materially different from what was advertised at the time
                of purchase.</li>
            </ul>
            <p className="max-w-prose text-muted-foreground">
              Outside of these cases, all purchases are final. This section does not create a general
              cooling-off period or a right to cancel for convenience.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-h4 font-semibold">3. How to request a refund</h2>
            <p className="max-w-prose text-muted-foreground">
              If you believe your situation falls under Section 2, contact us through our{" "}
              <a href="/contact" className="text-primary underline underline-offset-4">
                contact page
              </a>{" "}
              with your registered email and course name. Approved refunds are processed back to the
              original payment method via Razorpay, typically within 7–10 business days.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-h4 font-semibold">4. 1:1 mentor session and other inclusions</h2>
            <p className="max-w-prose text-muted-foreground">
              Each course enrollment includes one 1:1 mentor session and lifetime access to the course
              content. Once a mentor session has taken place, it is not eligible for refund or
              replacement. Any billing cycle of a retainer-style subscription that has already been
              delivered is likewise not eligible for refund.
            </p>
          </section>
        </div>
      </Container>
    </Section>
  );
}
