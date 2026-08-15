import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock, BadgeCheck } from "lucide-react";

import { supabaseAdmin } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/current-user";
import { Container } from "@/components/shared/container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Logo } from "@/components/shared/logo";
import { PriceTag } from "@/components/shared/price-tag";
import { getCourseVisual } from "@/components/marketing/course-visual";
import { RazorpayCheckoutButton } from "@/components/portal/razorpay-checkout-button";
import { logEvent } from "@/lib/analytics";
import type { CourseRow } from "@/types/db";
import type { Metadata } from "next";

export const metadata: Metadata = { alternates: { canonical: null }, robots: { index: false, follow: false, nocache: true } };

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/sign-in?redirect_url=${encodeURIComponent(`/checkout/${slug}`)}`);

  const supabase = supabaseAdmin();
  const { data: course } = await supabase.from("courses").select("*").eq("slug", slug).maybeSingle();

  if (!course) notFound();
  const typedCourse = course as CourseRow;
  const courseVisual = getCourseVisual(typedCourse.slug);

  // "checkout_viewed" — closes the funnel gap between checkout_started (order-create click)
  // and the actual page render, so drop-off before ever seeing the checkout page is visible too.
  void logEvent(user.id, "checkout_viewed", { courseId: typedCourse.id, courseSlug: typedCourse.slug });

  return (
    <div className="relative flex min-h-screen items-center overflow-hidden bg-muted/30 px-6 py-16">
      <div className="absolute inset-y-0 left-0 hidden w-1/2 bg-primary lg:block">
        <Image src={courseVisual.src} alt={courseVisual.alt} fill priority sizes="50vw" className="object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/35 to-primary" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-transparent to-primary/40" />
      </div>
      <Container className="relative grid max-w-5xl gap-10 p-0 lg:grid-cols-2 lg:items-center">
        <div className="hidden max-w-md flex-col gap-5 text-white lg:flex">
          <Logo dark />
          <h1 className="font-heading text-h2 font-bold">A secure step into your next skill.</h1>
          <p className="text-white/70">One-time enrollment, lifetime course access, and a checkout handled by India&rsquo;s trusted payment infrastructure.</p>
        </div>
        <Card>
          <CardHeader>
            <Link
              href={`/courses/${typedCourse.slug}`}
              className="mb-1 flex w-fit items-center gap-1 text-micro text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" /> Back to course
            </Link>
            <CardTitle className="text-h4">Confirm your enrollment</CardTitle>
            <CardDescription>You&rsquo;re one step away from full course access.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 p-4">
              <div>
                <p className="font-medium">{typedCourse.title}</p>
                <p className="text-sm text-muted-foreground">Lifetime access · 1:1 sessions included</p>
              </div>
              <PriceTag price={Number(typedCourse.price)} slug={typedCourse.slug} />
            </div>

            <RazorpayCheckoutButton courseSlug={typedCourse.slug} courseTitle={typedCourse.title} />

            <div className="flex items-center justify-center gap-3 rounded-lg border border-border bg-primary-50 px-4 py-3 text-primary-700">
              <ShieldCheck className="size-5" />
              <div className="leading-tight">
                <p className="font-heading text-sm font-bold">Secured by Razorpay</p>
                <p className="text-micro text-muted-foreground">PCI DSS compliant payment processing</p>
              </div>
            </div>

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
