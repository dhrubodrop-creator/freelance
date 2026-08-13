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
]);

const protectedMiddleware = clerkMiddleware(async (auth) => {
  await auth.protect();
});

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  if (["www.ropes.buzz", "ropes-three.vercel.app"].includes(req.nextUrl.hostname)) {
    const canonicalUrl = req.nextUrl.clone();
    canonicalUrl.protocol = "https";
    canonicalUrl.host = "ropes.buzz";
    return NextResponse.redirect(canonicalUrl, 308);
  }

  if (isProtectedRoute(req)) {
    return protectedMiddleware(req, event);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"],
};
