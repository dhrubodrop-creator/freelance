import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminUser } from "@/lib/current-user";
import { supabaseAdmin } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/audit-log";

const announcementUpdateSchema = z.object({
  title: z.string().min(1, "Title is required").max(300).optional(),
  body: z.string().min(1, "Body is required").max(8000).optional(),
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
  const parsed = announcementUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { error } = await supabaseAdmin().from("announcements").update(parsed.data).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAdminAction(admin.id, "update", "announcement", params.id, parsed.data);

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

  const { error } = await supabaseAdmin().from("announcements").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAdminAction(admin.id, "delete", "announcement", params.id);

  return NextResponse.json({ ok: true });
}
