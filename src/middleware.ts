import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/onboarding(.*)",
  "/community(.*)",
  "/sessions(.*)",
  "/profile(.*)",
  "/skills(.*)",
  "/portfolio(.*)",
  "/market-pulse(.*)",
  "/opportunities(.*)",
  "/checkout(.*)",
  "/courses/(.*)/learn(.*)",
  "/proof(.*)",
  "/admin(.*)",
  "/api/profile(.*)",
  "/api/skills(.*)",
  "/api/portfolio(.*)",
  "/api/monetisation(.*)",
  "/api/notifications(.*)",
  "/api/recommend(.*)",
  "/api/mentor(.*)",
  "/api/sessions(.*)",
  "/api/support(.*)",
  "/api/admin(.*)",
  "/api/enroll(.*)",
  "/api/progress(.*)",
  "/api/payments/create-order(.*)",
  "/api/payments/verify(.*)",
  "/api/diagnostic(.*)",
  "/api/capstone(.*)",
  "/api/decisions(.*)",
  "/api/exercises(.*)",
  "/api/daily-mission(.*)",
  "/api/resume-state(.*)",
  "/api/concept-rescue(.*)",
  "/api/catchup-plan(.*)",
  "/api/idea-plan(.*)",
  "/api/github/connect(.*)",
  "/api/github/callback(.*)",
  "/api/github/disconnect(.*)",
  "/api/github/link-repo(.*)",
  "/api/coach(.*)",
  "/api/code-review(.*)",
  "/api/architecture-check(.*)",
  "/api/ai-code-defense(.*)",
  "/api/acceptance-checks(.*)",
  "/api/test-generator(.*)",
  "/api/quality-labs(.*)",
  "/api/ai-evaluation(.*)",
  "/api/simulations(.*)",
  "/simulations(.*)",
  "/api/proof(.*)",
  "/growth(.*)",
]);
const isAuthRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

const authMiddleware = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect();
});

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  if (["www.ropes.buzz", "ropes-three.vercel.app"].includes(req.nextUrl.hostname)) {
    const canonicalUrl = req.nextUrl.clone();
    canonicalUrl.protocol = "https";
    canonicalUrl.host = "ropes.buzz";
    return NextResponse.redirect(canonicalUrl, 308);
  }

  if (isProtectedRoute(req) || isAuthRoute(req)) {
    return authMiddleware(req, event);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"],
};
