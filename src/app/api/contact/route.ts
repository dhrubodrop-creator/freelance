import { NextResponse } from "next/server";
import { z } from "zod";

import { resend, FROM_EMAIL, ADMIN_ALERT_EMAIL } from "@/lib/resend";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Enter a valid email"),
  message: z.string().min(10, "Tell us a bit more").max(4000),
});

/** Public, unauthenticated endpoint — forwards the contact form to the admin inbox. No DB table for this. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, email, message } = parsed.data;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_ALERT_EMAIL,
      replyTo: email,
      subject: `New contact form message from ${name}`,
      html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Message:</strong></p><p>${message.replace(/\n/g, "<br />")}</p>`,
    });
  } catch (err) {
    console.error("Failed to send contact form email", err);
  }

  return NextResponse.json({ ok: true });
}
