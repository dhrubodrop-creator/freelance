import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminUser } from "@/lib/current-user";
import { supabaseAdmin } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/audit-log";

const moduleSchema = z.object({
  course_id: z.string().uuid("A valid course_id is required"),
  title: z.string().min(1, "Title is required").max(200),
  video_url: z.string().max(1000).optional().nullable(),
  order_index: z.coerce.number().int().min(0),
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
  const parsed = moduleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin().from("modules").insert(parsed.data).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAdminAction(admin.id, "create", "module", data.id, { title: parsed.data.title, course_id: parsed.data.course_id });

  return NextResponse.json({ ok: true }, { status: 201 });
}
