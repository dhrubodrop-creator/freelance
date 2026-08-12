import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminUser } from "@/lib/current-user";
import { supabaseAdmin } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/audit-log";

const opportunitySchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  type: z.enum(["job", "freelance", "consulting", "training", "partnership", "business_lead"]),
  description: z.string().max(4000).optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  source_url: z.string().url().max(500).optional().nullable().or(z.literal("")),
  location: z.string().max(200).optional().nullable(),
  is_remote: z
    .union([z.boolean(), z.string()])
    .transform((v) => (typeof v === "string" ? v === "true" : v))
    .optional()
    .default(false),
  compensation_range: z.string().max(200).optional().nullable(),
});

export async function POST(req: Request) {
  let admin;
  try {
    admin = await requireAdminUser();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Forbidden";
    return NextResponse.json({ error: message }, { status: message === "Not authenticated" ? 401 : 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = opportunitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { source_url, ...rest } = parsed.data;
  const { data, error } = await supabaseAdmin()
    .from("opportunities")
    .insert({ ...rest, source_url: source_url || null, source: "curated" })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAdminAction(admin.id, "create", "opportunity", data.id, { title: parsed.data.title });

  return NextResponse.json({ ok: true }, { status: 201 });
}
