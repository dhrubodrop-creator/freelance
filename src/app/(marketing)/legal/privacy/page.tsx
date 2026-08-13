import { Container, Section } from "@/components/shared/container";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "Privacy Policy", description: "How Ropes handles account, profile, course, payment, support, and platform usage data.", path: "/legal/privacy" });

export default function PrivacyPage() {
  return (
    <Section>
      <Container className="max-w-3xl">
        <h1 className="font-heading text-h1 font-bold">Privacy Policy</h1>
        <p className="mt-3 text-sm text-muted-foreground">Last updated: 11 August 2026</p>

        <div className="mt-10 flex flex-col gap-10">
          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-h4 font-semibold">1. What we collect</h2>
            <p className="max-w-prose text-muted-foreground">
              We collect information you provide directly — your name, email address, and phone number
              when you register for a webinar, sign up, or contact us — along with occupation, industry,
              and career-goal details and an optional CV file when you complete your learner profile.
              We also collect basic usage data, such as which pages and course modules you visit, to
              operate and improve the platform.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-h4 font-semibold">2. How we use it</h2>
            <p className="max-w-prose text-muted-foreground">
              We use this information to create and manage your account, personalize your course
              recommendation, process payments, respond to support requests, and send transactional
              emails such as webinar confirmations and enrollment receipts. We do not sell your personal
              data.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-h4 font-semibold">3. Third parties we work with</h2>
            <p className="max-w-prose text-muted-foreground">
              We rely on a small set of service providers to run Ropes, and your data may pass through
              them as part of normal platform operation:
            </p>
            <ul className="mt-1 flex max-w-prose flex-col gap-2 text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">Clerk</span> — authentication and account
                management.
              </li>
              <li>
                <span className="font-medium text-foreground">Supabase</span> — database and file
                storage (including CV uploads).
              </li>
              <li>
                <span className="font-medium text-foreground">Razorpay</span> — payment processing for
                course purchases.
              </li>
              <li>
                <span className="font-medium text-foreground">Resend</span> — transactional email
                delivery.
              </li>
              <li>
                <span className="font-medium text-foreground">Cerebras</span> — AI inference used to
                generate your course recommendation and AI mentor responses.
              </li>
            </ul>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-h4 font-semibold">4. Your rights</h2>
            <p className="max-w-prose text-muted-foreground">
              You can request access to, correction of, or deletion of your personal data at any time by
              contacting us. Where required by applicable law, we will honor these requests within a
              reasonable timeframe, subject to any records we are legally required to retain.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-h4 font-semibold">5. Contact</h2>
            <p className="max-w-prose text-muted-foreground">
              For any privacy questions or requests, reach us through our{" "}
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
