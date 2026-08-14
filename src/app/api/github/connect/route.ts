import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import crypto from "crypto";

import { buildGitHubAuthorizeUrl, isGitHubConfigured } from "@/lib/github";

const STATE_COOKIE = "gh_oauth_state";

/** Starts the GitHub OAuth flow. Returns 501 (not redirect) when no OAuth App is registered, so the UI can show an honest message instead of a broken redirect. */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isGitHubConfigured()) {
    return NextResponse.json(
      {
        error: "GitHub integration is not configured yet.",
        requiresSetup: true,
        detail: "The Ropes owner needs to register a GitHub OAuth App and set GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET.",
      },
      { status: 501 }
    );
  }

  const state = crypto.randomBytes(24).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE, state, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600, path: "/" });

  return NextResponse.redirect(buildGitHubAuthorizeUrl(state));
}
