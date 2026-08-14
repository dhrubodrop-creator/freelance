import "server-only";

import { callAI } from "@/lib/ai/router";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getRawAccessToken } from "@/lib/github";

/** Section 36 — reads the project's real architecture text + (if connected) real file tree, generates a Mermaid diagram reflecting the actual system, never an invented one. */

const SYSTEM_PROMPT = `You generate a Mermaid diagram (graph TD syntax) reflecting a real project's architecture. You will
be given the architecture description and, if available, the real current file list. Only diagram what's actually
described/present — never invent services, databases, or integrations that weren't mentioned. Respond with ONLY the
Mermaid code, no markdown fences, no explanation, starting with "graph TD".`;

export async function generateArchitectureDiagram(input: {
  userId: string;
  portfolioItemId: string;
  repoFullName?: string | null;
}): Promise<string | { error: string }> {
  const supabase = supabaseAdmin();
  const { data: item } = await supabase
    .from("portfolio_items")
    .select("architecture_note")
    .eq("id", input.portfolioItemId)
    .eq("user_id", input.userId)
    .maybeSingle();
  if (!item) return { error: "Project not found." };

  let architecture = item.architecture_note;
  if (!architecture) {
    const { data: plan } = await supabase
      .from("project_idea_plans")
      .select("architecture_proposal")
      .eq("portfolio_item_id", input.portfolioItemId)
      .maybeSingle();
    architecture = plan?.architecture_proposal ?? null;
  }
  if (!architecture) return { error: "No architecture is recorded for this project yet — add one first." };

  let fileList: string[] = [];
  if (input.repoFullName) {
    const token = await getRawAccessToken(input.userId);
    if (token) {
      const treeRes = await fetch(`https://api.github.com/repos/${input.repoFullName}/git/trees/HEAD?recursive=1`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
      });
      if (treeRes.ok) {
        const treeData = (await treeRes.json()) as { tree?: { path: string; type: string }[] };
        fileList = (treeData.tree ?? []).filter((t) => t.type === "blob").map((t) => t.path).slice(0, 300);
      }
    }
  }

  const result = await callAI({
    task: "architecture_diagram_generation",
    userId: input.userId,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: JSON.stringify({ architecture, fileList }) },
    ],
  });
  if (!result) return { error: "Diagram generator unavailable right now." };

  const mermaid = result.content.trim().replace(/^```mermaid\n?/, "").replace(/```$/, "").trim();
  if (!mermaid.startsWith("graph")) return { error: "Couldn't generate a valid diagram. Try again." };

  const { error } = await supabase
    .from("portfolio_items")
    .update({ architecture_diagram_mermaid: mermaid, architecture_diagram_generated_at: new Date().toISOString() })
    .eq("id", input.portfolioItemId)
    .eq("user_id", input.userId);
  if (error) return { error: "Couldn't save the diagram." };

  return mermaid;
}
