import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabase/server";
import { runAccessibilityAudit, runPerformanceCheck, runSecurityScan, runVisualQA } from "@/lib/quality-labs";

const bodySchema = z.object({
  checkType: z.enum(["visual_qa", "accessibility", "security", "performance"]),
  portfolioItemId: z.string().uuid(),
  targetUrl: z.string().url().nullable().optional(),
  repoFullName: z.string().regex(/^[\w.-]+\/[\w.-]+$/).nullable().optional(),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const supabase = supabaseAdmin();
  const { data: user } = await supabase.from("users").select("id").eq("clerk_id", userId).maybeSingle();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { checkType, portfolioItemId, targetUrl, repoFullName } = parsed.data;
  let result;
  if (checkType === "visual_qa") {
    if (!targetUrl) return NextResponse.json({ error: "targetUrl is required" }, { status: 400 });
    result = await runVisualQA({ userId: user.id, portfolioItemId, targetUrl });
  } else if (checkType === "accessibility") {
    if (!targetUrl) return NextResponse.json({ error: "targetUrl is required" }, { status: 400 });
    result = await runAccessibilityAudit({ userId: user.id, portfolioItemId, targetUrl });
  } else if (checkType === "security") {
    result = await runSecurityScan({ userId: user.id, portfolioItemId, targetUrl, repoFullName });
  } else {
    if (!targetUrl) return NextResponse.json({ error: "targetUrl is required" }, { status: 400 });
    result = await runPerformanceCheck({ userId: user.id, portfolioItemId, targetUrl });
  }

  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ result });
}
