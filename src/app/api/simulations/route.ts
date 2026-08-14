import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabase/server";
import { listSimulations, startSimulation } from "@/lib/simulations";

const bodySchema = z.object({
  simulationType: z.enum(["client", "discovery_call", "scope_creep", "incident", "demo_day"]),
  portfolioItemId: z.string().uuid().nullable().optional(),
});

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = supabaseAdmin();
  const { data: user } = await supabase.from("users").select("id").eq("clerk_id", userId).maybeSingle();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const sessions = await listSimulations(user.id);
  return NextResponse.json({ sessions });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const supabase = supabaseAdmin();
  const { data: user } = await supabase.from("users").select("id").eq("clerk_id", userId).maybeSingle();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const session = await startSimulation({ userId: user.id, ...parsed.data });
  if (!session) return NextResponse.json({ error: "Couldn't start a session" }, { status: 500 });
  return NextResponse.json({ session }, { status: 201 });
}
