import { Container, Section } from "@/components/shared/container";

export const metadata = {
  title: "Refund Policy",
};

export default function RefundPage() {
  return (
    <Section>
      <Container className="max-w-3xl">
        <h1 className="font-heading text-h1 font-bold">Refund Policy</h1>
        <p className="mt-3 text-sm text-muted-foreground">Last updated: 11 August 2026</p>

        <div className="mt-10 flex flex-col gap-10">
          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-h4 font-semibold">1. Refund window</h2>
            <p className="max-w-prose text-muted-foreground">
              You may request a full refund on a course purchase within 7 days of the original
              enrollment date, provided the conditions below are met.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-h4 font-semibold">2. Conditions</h2>
            <p className="max-w-prose text-muted-foreground">
              Refund requests within the window are granted as long as course progress remains limited —
              generally, no more than one module completed. Refund requests made after the 7-day window,
              or after substantial course progress has been made, are evaluated on a case-by-case basis
              and are not guaranteed.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-h4 font-semibold">3. How to request a refund</h2>
            <p className="max-w-prose text-muted-foreground">
              Contact us through our{" "}
              <a href="/contact" className="text-primary underline underline-offset-4">
                contact page
              </a>{" "}
              or WhatsApp with your registered email and course name. Approved refunds are processed
              back to the original payment method via Razorpay, typically within 7–10 business days.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-h4 font-semibold">4. Non-refundable items</h2>
            <p className="max-w-prose text-muted-foreground">
              One-on-one mentor sessions that have already taken place, and any billing cycle of a
              retainer-style subscription that has already been delivered, are not eligible for refund.
            </p>
          </section>
        </div>
      </Container>
    </Section>
  );
}
