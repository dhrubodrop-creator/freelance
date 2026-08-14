import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabase/server";
import { createAcceptanceCheck, listAcceptanceChecks } from "@/lib/acceptance-checks";

const bodySchema = z.object({
  description: z.string().min(1).max(500),
  checkType: z.enum(["manual", "http_200", "http_auth_rejects", "deployment_live"]),
  targetUrl: z.string().url().nullable().optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = supabaseAdmin();
  const { data: user } = await supabase.from("users").select("id").eq("clerk_id", userId).maybeSingle();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const checks = await listAcceptanceChecks(user.id, id);
  return NextResponse.json({ checks });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  if (parsed.data.checkType !== "manual" && !parsed.data.targetUrl) {
    return NextResponse.json({ error: "A target URL is required for automated checks" }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { data: user } = await supabase.from("users").select("id").eq("clerk_id", userId).maybeSingle();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const check = await createAcceptanceCheck({ userId: user.id, portfolioItemId: id, ...parsed.data });
  if (!check) return NextResponse.json({ error: "Couldn't create that check" }, { status: 400 });
  return NextResponse.json({ check }, { status: 201 });
}
