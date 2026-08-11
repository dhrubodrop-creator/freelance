import { notFound } from "next/navigation";
import { ShieldCheck, Lock, BadgeCheck } from "lucide-react";

import { supabaseAdmin } from "@/lib/supabase/server";
import { Container } from "@/components/shared/container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Logo } from "@/components/shared/logo";
import { RazorpayCheckoutButton } from "@/components/portal/razorpay-checkout-button";
import type { CourseRow } from "@/types/db";

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = supabaseAdmin();
  const { data: course } = await supabase.from("courses").select("*").eq("slug", slug).maybeSingle();

  if (!course) notFound();
  const typedCourse = course as CourseRow;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-6 py-16">
      <div className="mb-8">
        <Logo />
      </div>
      <Container className="max-w-md p-0">
        <Card>
          <CardHeader>
            <CardTitle className="text-h4">Confirm your enrollment</CardTitle>
            <CardDescription>You&rsquo;re one step away from full course access.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 p-4">
              <div>
                <p className="font-medium">{typedCourse.title}</p>
                <p className="text-sm text-muted-foreground">Lifetime access · 1:1 sessions included</p>
              </div>
              <p className="font-heading text-lg font-semibold">
                ₹{Number(typedCourse.price).toLocaleString("en-IN")}
              </p>
            </div>

            <RazorpayCheckoutButton courseSlug={typedCourse.slug} courseTitle={typedCourse.title} />

            <div className="flex flex-col gap-2 border-t border-border pt-4 text-micro text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-success" />
                Secure payment powered by Razorpay
              </span>
              <span className="flex items-center gap-1.5">
                <Lock className="size-3.5" />
                256-bit encrypted checkout — we never see your card details
              </span>
              <span className="flex items-center gap-1.5">
                <BadgeCheck className="size-3.5" />
                Covered by our{" "}
                <a href="/legal/refund" className="underline underline-offset-2">
                  refund policy
                </a>
              </span>
            </div>
          </CardContent>
        </Card>
      </Container>
    </div>
  );
}
