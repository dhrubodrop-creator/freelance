import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { supabaseAdmin } from "@/lib/supabase/server";
import { createProjectRepository, getRawAccessToken, isGitHubConfigured, linkRepoToProject } from "@/lib/github";

/**
 * Real repository creation (Phase 6). Gated by isGitHubConfigured() the same way every other
 * GitHub entry point in this app is — returns 501 with an explicit setup message rather than
 * pretending to work when the owner hasn't registered a GitHub OAuth App yet.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isGitHubConfigured()) {
    return NextResponse.json(
      {
        error: "GitHub isn't set up for this site yet.",
        requiresSetup: true,
        detail: "The Ropes owner needs to register a GitHub OAuth App and set GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET.",
      },
      { status: 501 }
    );
  }

  const { id } = await params;
  const supabase = supabaseAdmin();
  const { data: user } = await supabase.from("users").select("id").eq("clerk_id", userId).maybeSingle();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { data: item } = await supabase
    .from("portfolio_items")
    .select("id, title, build_deliverable")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!item) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const { data: existingLink } = await supabase.from("github_repo_links").select("id").eq("portfolio_item_id", id).maybeSingle();
  if (existingLink) return NextResponse.json({ error: "This project already has a linked repository." }, { status: 400 });

  const accessToken = await getRawAccessToken(user.id);
  if (!accessToken) {
    return NextResponse.json(
      {
        error: "GitHub isn't connected yet. Connect GitHub once and Ropes can create your project workspace automatically.",
        requiresConnection: true,
      },
      { status: 400 }
    );
  }

  const result = await createProjectRepository({
    accessToken,
    projectTitle: item.title,
    description: item.build_deliverable ?? null,
  });

  if (!result.ok || !result.repoFullName) {
    return NextResponse.json({ error: result.error ?? "Couldn't create a repository on GitHub." }, { status: 502 });
  }

  const linked = await linkRepoToProject(user.id, id, result.repoFullName);
  if (!linked) {
    // The repo exists on GitHub even though the internal link failed — report both facts, don't hide either.
    return NextResponse.json(
      { error: "Repository was created on GitHub, but couldn't be linked to this project. Link it manually.", repoFullName: result.repoFullName, htmlUrl: result.htmlUrl },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    repoFullName: result.repoFullName,
    htmlUrl: result.htmlUrl,
    defaultBranch: result.defaultBranch,
    warning: result.error ?? null, // e.g. "repo created but a starter file failed" — still a success, just not perfect
  });
}
