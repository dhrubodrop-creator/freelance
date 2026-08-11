import { Container, Section } from "@/components/shared/container";

export const metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <Section>
      <Container className="max-w-3xl">
        <h1 className="font-heading text-h1 font-bold">Terms of Service</h1>
        <p className="mt-3 text-sm text-muted-foreground">Last updated: 11 August 2026</p>

        <div className="mt-10 flex flex-col gap-10">
          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-h4 font-semibold">1. Acceptance of terms</h2>
            <p className="max-w-prose text-muted-foreground">
              By creating an account, registering for a webinar, or purchasing a course on Ropes, you
              agree to these Terms of Service. If you do not agree, do not use the platform.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-h4 font-semibold">2. Course access &amp; license</h2>
            <p className="max-w-prose text-muted-foreground">
              When you purchase a course, we grant you a personal, non-transferable, non-exclusive
              license to access that course&rsquo;s content for your own learning. Course materials,
              templates, and playbooks may not be resold, redistributed, or shared outside your own
              account.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-h4 font-semibold">3. Payment terms</h2>
            <p className="max-w-prose text-muted-foreground">
              Course prices are listed in Indian Rupees (INR) and payments are processed securely by
              Razorpay. Enrollment is confirmed once payment is successfully captured. Recurring or
              retainer-style payments, where offered, are billed on the cycle shown at checkout.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-h4 font-semibold">4. User conduct</h2>
            <p className="max-w-prose text-muted-foreground">
              You agree not to misuse the platform — including attempting to access another user&rsquo;s
              account, scraping or redistributing course content, or using the community or support
              channels to harass other members.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-h4 font-semibold">5. Limitation of liability</h2>
            <p className="max-w-prose text-muted-foreground">
              Ropes provides training and educational content. We do not guarantee any specific income,
              client outcome, or employment result from completing a course. To the maximum extent
              permitted by law, Ropes is not liable for indirect, incidental, or consequential damages
              arising from use of the platform.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-h4 font-semibold">6. Governing law</h2>
            <p className="max-w-prose text-muted-foreground">
              These terms are governed by the laws of India, and any disputes will be subject to the
              exclusive jurisdiction of the courts of India.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-h4 font-semibold">7. Contact</h2>
            <p className="max-w-prose text-muted-foreground">
              Questions about these terms can be sent through our{" "}
              <a href="/contact" className="text-primary underline underline-offset-4">
                contact page
              </a>
              .
            </p>
          </section>
        </div>
      </Container>
    </Section>
  );
}
