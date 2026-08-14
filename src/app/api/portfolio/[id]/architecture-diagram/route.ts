import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabase/server";
import { generateArchitectureDiagram } from "@/lib/architecture-diagram";

const bodySchema = z.object({ repoFullName: z.string().regex(/^[\w.-]+\/[\w.-]+$/).nullable().optional() });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const supabase = supabaseAdmin();
  const { data: user } = await supabase.from("users").select("id").eq("clerk_id", userId).maybeSingle();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const result = await generateArchitectureDiagram({ userId: user.id, portfolioItemId: id, repoFullName: parsed.data.repoFullName });
  if (typeof result !== "string") return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ mermaid: result });
}
