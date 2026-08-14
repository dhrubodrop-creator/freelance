import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";

import { supabaseAdmin } from "@/lib/supabase/server";
import { exchangeCodeForAccessToken, fetchGitHubUsername, isGitHubConfigured, saveGitHubConnection } from "@/lib/github";

const STATE_COOKIE = "gh_oauth_state";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.redirect(new URL("/sign-in", req.url));

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;
  if (!isGitHubConfigured()) {
    return NextResponse.redirect(new URL("/portfolio?github=not_configured", site));
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(STATE_COOKIE)?.value;
  cookieStore.delete(STATE_COOKIE);

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL("/portfolio?github=error", site));
  }

  const accessToken = await exchangeCodeForAccessToken(code);
  if (!accessToken) return NextResponse.redirect(new URL("/portfolio?github=error", site));

  const githubUsername = await fetchGitHubUsername(accessToken);
  if (!githubUsername) return NextResponse.redirect(new URL("/portfolio?github=error", site));

  const supabase = supabaseAdmin();
  const { data: user } = await supabase.from("users").select("id").eq("clerk_id", userId).maybeSingle();
  if (!user) return NextResponse.redirect(new URL("/portfolio?github=error", site));

  const ok = await saveGitHubConnection(user.id, accessToken, githubUsername);
  return NextResponse.redirect(new URL(ok ? "/portfolio?github=connected" : "/portfolio?github=error", site));
}
