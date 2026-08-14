import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabase/server";
import { generateConceptRescue } from "@/lib/concept-rescue";

const bodySchema = z.object({
  moduleId: z.string().uuid(),
  exerciseId: z.string().uuid().nullable().optional(),
  question: z.string().max(2000).nullable().optional(),
});

/** "I don't understand" — generates a grounded 5-part rescue explanation via the central AI router. */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const supabase = supabaseAdmin();
  const { data: user } = await supabase.from("users").select("id").eq("clerk_id", userId).maybeSingle();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const rescue = await generateConceptRescue({ userId: user.id, ...parsed.data });
  if (!rescue) return NextResponse.json({ error: "Could not generate a rescue for that module" }, { status: 400 });
  return NextResponse.json({ rescue });
}
