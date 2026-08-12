import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabase/server";
import { logEvent } from "@/lib/analytics";

const addSkillSchema = z.object({
  skillId: z.string().uuid(),
  selfLevel: z.enum(["beginner", "intermediate", "advanced", "expert"]),
});

/** Adds a skill to the requester's profile. Users pick from the curated
 * taxonomy (skillId must reference an existing row) rather than free-typing
 * a name — this is what keeps the taxonomy from fragmenting into duplicates. */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = addSkillSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { data: user } = await supabase.from("users").select("id").eq("clerk_id", userId).maybeSingle();
  if (!user) return NextResponse.json({ error: "User record not found — try refreshing." }, { status: 404 });

  const { data: skill } = await supabase.from("skills").select("id").eq("id", parsed.data.skillId).maybeSingle();
  if (!skill) return NextResponse.json({ error: "Unknown skill" }, { status: 400 });

  const { error } = await supabase.from("user_skills").upsert(
    { user_id: user.id, skill_id: parsed.data.skillId, self_level: parsed.data.selfLevel },
    { onConflict: "user_id,skill_id" }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logEvent(user.id, "skill_added", { skillId: parsed.data.skillId, selfLevel: parsed.data.selfLevel });

  return NextResponse.json({ ok: true }, { status: 201 });
}
