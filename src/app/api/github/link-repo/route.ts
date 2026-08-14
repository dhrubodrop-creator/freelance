import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabase/server";
import { linkRepoToProject } from "@/lib/github";

const bodySchema = z.object({
  portfolioItemId: z.string().uuid(),
  repoFullName: z.string().regex(/^[\w.-]+\/[\w.-]+$/, "Expected owner/repo"),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { data: user } = await supabase.from("users").select("id").eq("clerk_id", userId).maybeSingle();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const ok = await linkRepoToProject(user.id, parsed.data.portfolioItemId, parsed.data.repoFullName);
  if (!ok) return NextResponse.json({ error: "Couldn't link that repository" }, { status: 400 });
  return NextResponse.json({ success: true });
}
