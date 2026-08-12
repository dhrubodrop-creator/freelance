import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabase/server";

const educationSchema = z.object({
  institution: z.string().min(1, "Institution is required").max(200),
  degree: z.string().max(200).optional().nullable(),
  field: z.string().max(200).optional().nullable(),
  start_date: z.string().max(10).optional().nullable(),
  end_date: z.string().max(10).optional().nullable(),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = educationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { data: user } = await supabase.from("users").select("id").eq("clerk_id", userId).maybeSingle();
  if (!user) return NextResponse.json({ error: "User record not found — try refreshing." }, { status: 404 });

  const { error } = await supabase.from("education").insert({ ...parsed.data, user_id: user.id });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true }, { status: 201 });
}
