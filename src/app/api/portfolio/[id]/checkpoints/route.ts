import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabase/server";
import { createCheckpoint, listCheckpoints } from "@/lib/project-checkpoints";

const bodySchema = z.object({
  label: z.string().min(1).max(200),
  task: z.string().max(500).nullable().optional(),
  learnerNote: z.string().max(1000).nullable().optional(),
  commitSha: z.string().max(40).nullable().optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = supabaseAdmin();
  const { data: user } = await supabase.from("users").select("id").eq("clerk_id", userId).maybeSingle();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const checkpoints = await listCheckpoints(user.id, id);
  return NextResponse.json({ checkpoints });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const supabase = supabaseAdmin();
  const { data: user } = await supabase.from("users").select("id").eq("clerk_id", userId).maybeSingle();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const checkpoint = await createCheckpoint({ userId: user.id, portfolioItemId: id, ...parsed.data });
  if (!checkpoint) return NextResponse.json({ error: "Couldn't create checkpoint" }, { status: 400 });
  return NextResponse.json({ checkpoint }, { status: 201 });
}
