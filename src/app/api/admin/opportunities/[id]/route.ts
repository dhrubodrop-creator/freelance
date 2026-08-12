import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminUser } from "@/lib/current-user";
import { supabaseAdmin } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/audit-log";

const opportunityUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  type: z.enum(["job", "freelance", "consulting", "training", "partnership", "business_lead"]).optional(),
  description: z.string().max(4000).optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  source_url: z.string().url().max(500).optional().nullable().or(z.literal("")),
  location: z.string().max(200).optional().nullable(),
  is_remote: z
    .union([z.boolean(), z.string()])
    .transform((v) => (typeof v === "string" ? v === "true" : v))
    .optional(),
  compensation_range: z.string().max(200).optional().nullable(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let admin;
  try {
    admin = await requireAdminUser();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Forbidden";
    return NextResponse.json({ error: message }, { status: message === "Not authenticated" ? 401 : 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = opportunityUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { source_url, ...rest } = parsed.data;
  const payload = { ...rest, ...(source_url !== undefined ? { source_url: source_url || null } : {}) };

  const { error } = await supabaseAdmin().from("opportunities").update(payload).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAdminAction(admin.id, "update", "opportunity", id, payload);

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  let admin;
  try {
    admin = await requireAdminUser();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Forbidden";
    return NextResponse.json({ error: message }, { status: message === "Not authenticated" ? 401 : 403 });
  }

  const { id } = await params;
  const { error } = await supabaseAdmin().from("opportunities").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAdminAction(admin.id, "delete", "opportunity", id);

  return NextResponse.json({ ok: true });
}
