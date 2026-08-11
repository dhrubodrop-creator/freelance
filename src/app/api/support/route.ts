import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabase/server";
import { resend, FROM_EMAIL, ADMIN_ALERT_EMAIL } from "@/lib/resend";
import type { UserRow } from "@/types/db";

const bodySchema = z.object({ message: z.string().min(3).max(4000) });

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const supabase = supabaseAdmin();
  const { data: user } = await supabase.from("users").select("*").eq("clerk_id", userId).maybeSingle();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const typedUser = user as UserRow;

  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .insert({ user_id: typedUser.id, message: parsed.data.message })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: "Could not create ticket" }, { status: 500 });

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_ALERT_EMAIL,
      subject: `New support ticket from ${typedUser.name ?? typedUser.email ?? "a student"}`,
      html: `<p><strong>${typedUser.email ?? typedUser.name}</strong> requested human help:</p><p>${parsed.data.message}</p>`,
    });
  } catch {
    // best-effort — the ticket itself is the source of truth
  }

  return NextResponse.json({ ticket });
}
