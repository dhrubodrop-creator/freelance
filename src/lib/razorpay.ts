import "server-only";
import Razorpay from "razorpay";
import crypto from "node:crypto";

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET as string,
});

/**
 * `crypto.timingSafeEqual` throws (rather than returning false) when the two
 * buffers differ in length, so a malformed/truncated signature header would
 * otherwise crash the request handler with an unhandled 500 instead of
 * cleanly rejecting it. Length-check first, still using a constant-time
 * comparison whenever lengths do match.
 */
function safeEqual(expectedHex: string, actualHex: string): boolean {
  const expected = Buffer.from(expectedHex);
  let actual: Buffer;
  try {
    actual = Buffer.from(actualHex);
  } catch {
    return false;
  }
  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
}

export function verifyRazorpaySignature(body: string, signature: string, secret: string) {
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return safeEqual(expected, signature);
}

export function verifyRazorpayPaymentSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
    .update(`${params.orderId}|${params.paymentId}`)
    .digest("hex");
  return safeEqual(expected, params.signature);
}
