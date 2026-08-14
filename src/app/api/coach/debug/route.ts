import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabase/server";
import { debugThis } from "@/lib/code-coach";

const bodySchema = z.object({
  errorMessage: z.string().min(1).max(4000),
  stackTrace: z.string().max(8000).nullable().optional(),
  logs: z.string().max(8000).nullable().optional(),
  repoFullName: z.string().regex(/^[\w.-]+\/[\w.-]+$/).nullable().optional(),
  filePath: z.string().max(500).nullable().optional(),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const supabase = supabaseAdmin();
  const { data: user } = await supabase.from("users").select("id").eq("clerk_id", userId).maybeSingle();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const result = await debugThis({ userId: user.id, ...parsed.data });
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result);
}
