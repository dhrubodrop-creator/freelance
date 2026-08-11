import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/onboarding(.*)",
  "/community(.*)",
  "/courses/(.*)/learn(.*)",
  "/admin(.*)",
  "/api/profile(.*)",
  "/api/recommend(.*)",
  "/api/mentor(.*)",
  "/api/sessions(.*)",
  "/api/support(.*)",
  "/api/admin(.*)",
  "/api/enroll(.*)",
  "/api/progress(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"],
};
