"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { Loader2, ShieldCheck, Tag } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export function RazorpayCheckoutButton({
  courseSlug,
  courseTitle,
}: {
  courseSlug: string;
  courseTitle: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoCode, setPromoCode] = useState("");

  async function handlePay() {
    setLoading(true);
    const code = promoCode.trim();

    try {
      if (code) {
        const freeRes = await fetch("/api/enroll/free", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseSlug, promoCode: code }),
        });
        if (freeRes.ok) {
          toast.success("Promo code applied — you're enrolled.");
          router.push(`/courses/${courseSlug}/learn`);
          return;
        }
        // Not the free-enrollment code — fall through to normal checkout.
      }

      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseSlug }),
      });
      if (!orderRes.ok) throw new Error("Could not start checkout");
      const order = await orderRes.json();

      const razorpay = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "Ropes",
        description: courseTitle,
        theme: { color: "#141e33" },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          const verifyRes = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...response, courseId: order.courseId }),
          });
          if (verifyRes.ok) {
            toast.success("Payment confirmed — welcome in!");
            router.push(`/courses/${courseSlug}/learn`);
          } else {
            toast.error("We received your payment but couldn't confirm it automatically. Contact support.");
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      });
      razorpay.open();
    } catch {
      toast.error("Something went wrong starting checkout. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" onReady={() => setScriptReady(true)} />

      {promoOpen ? (
        <div className="flex gap-2">
          <Input
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            placeholder="Promo code"
            className="uppercase"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setPromoOpen(true)}
          className="flex w-fit items-center gap-1.5 text-micro text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          <Tag className="size-3.5" />
          Have a promo code?
        </button>
      )}

      <Button
        size="lg"
        variant="accent"
        className="w-full"
        onClick={handlePay}
        disabled={loading || !scriptReady}
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
        {promoCode.trim() ? "Apply & continue" : "Pay securely with Razorpay"}
      </Button>
    </div>
  );
}
