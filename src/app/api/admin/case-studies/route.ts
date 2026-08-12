import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminUser } from "@/lib/current-user";
import { supabaseAdmin } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/audit-log";

const caseStudySchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  summary: z.string().max(4000).optional().nullable(),
  image_url: z.string().max(1000).optional().nullable(),
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
  const parsed = caseStudySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin().from("case_studies").insert(parsed.data).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAdminAction(admin.id, "create", "case_study", data.id, { title: parsed.data.title });

  return NextResponse.json({ ok: true }, { status: 201 });
}
