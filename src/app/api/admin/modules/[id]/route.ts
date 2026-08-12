import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminUser } from "@/lib/current-user";
import { supabaseAdmin } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/audit-log";

const moduleUpdateSchema = z.object({
  title: z.string().min(1, "Title is required").max(200).optional(),
  video_url: z.string().max(1000).optional().nullable(),
  order_index: z.coerce.number().int().min(0).optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  let admin;
  try {
    admin = await requireAdminUser();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Forbidden";
    return NextResponse.json({ error: message }, { status: message === "Not authenticated" ? 401 : 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = moduleUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { error } = await supabaseAdmin().from("modules").update(parsed.data).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAdminAction(admin.id, "update", "module", params.id, parsed.data);

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  let admin;
  try {
    admin = await requireAdminUser();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Forbidden";
    return NextResponse.json({ error: message }, { status: message === "Not authenticated" ? 401 : 403 });
  }

  const { error } = await supabaseAdmin().from("modules").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAdminAction(admin.id, "delete", "module", params.id);

  return NextResponse.json({ ok: true });
}
