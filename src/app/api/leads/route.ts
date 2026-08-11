import { NextResponse } from "next/server";
import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabase/server";
import { resend, FROM_EMAIL } from "@/lib/resend";

const leadSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(6, "Enter a valid phone number").max(20),
});

/** Public, unauthenticated endpoint — captures free-webinar signups into the `leads` table. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = leadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, email, phone } = parsed.data;
  const supabase = supabaseAdmin();

  const { error } = await supabase.from("leads").insert({
    name,
    email,
    phone,
    source: "webinar",
  });

  if (error) {
    return NextResponse.json({ error: "Could not save your registration. Try again." }, { status: 500 });
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "You're registered for the Ropes free webinar",
      html: `<p>Hi ${name},</p><p>You're registered for the Ropes free webinar. We'll email you the joining link and time shortly.</p><p>— The Ropes team</p>`,
    });
  } catch (err) {
    console.error("Failed to send webinar confirmation email", err);
  }

  return NextResponse.json({ ok: true });
}
