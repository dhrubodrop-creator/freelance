# ROPES ORGANIC DISCOVERY & SEARCH INTELLIGENCE WORK BOUNDARY

## Purpose
This document defines the strict isolation boundaries for the Search Intelligence & Organic Discovery implementation to ensure **zero interference** with Claude Code's ongoing core product development on Ropes.

---

## 1. FILES & SYSTEMS MUST NOT BE MODIFIED (CLAUDE'S WORK)
The following core product components are actively being developed by Claude Code and MUST NOT be edited, refactored, deleted, or reorganized:

- **Authentication & Security**: `src/middleware.ts`, `src/lib/current-user.ts`, `src/lib/user-provisioning.ts`, `src/app/api/webhooks/clerk/route.ts`, `src/app/sign-in/**`, `src/app/sign-up/**`
- **Learner UX & Dashboard**: `src/app/(portal)/**`, `src/components/profile/**`, `src/components/dashboard/**`
- **Payments & Checkout**: `src/app/checkout/**`, `src/app/api/payments/**`, Razorpay integration
- **AI Core & Engine**: `src/lib/ai/**`, `src/app/api/mentor/**`, `src/app/api/coach/**`, `src/app/api/diagnostic/**`, `src/app/api/concept-rescue/**`
- **Verification & QA**: `src/app/api/verification/**`, `src/app/api/quality-labs/**`, `src/app/api/ai-code-defense/**`
- **GitHub Integration**: `src/app/api/github/**`, OAuth flows
- **Course Learning Engine & Capstone**: `src/app/courses/[slug]/learn/**`, `src/app/api/capstone/**`
- **Proof & Portfolio Engine**: `src/app/api/proof/**`, `src/app/p/**`, `src/app/api/portfolio/**`

---

## 2. ISOLATED / ADDITIVE AREAS (ALLOWED FOR DISCOVERY WORK)
The following areas are dedicated to organic discovery and may be safely expanded or created without impacting core learner features:

- **Public Marketing & Acquisition Routes**: `src/app/(marketing)/**`
- **New Free Interactive Discovery Tools**: `src/app/(marketing)/tools/**` (e.g. AI project readiness, AI freelancing readiness, skill gap calculators, etc.)
- **Structured Data & SEO Utilities**: `src/lib/seo.ts`, `src/lib/structured-data.ts`
- **Sitemap & Robots Infrastructure**: `src/app/sitemap.ts`, `src/app/robots.ts`, `src/lib/indexing.ts`
- **Search Intelligence Admin View**: `src/app/admin/search-visibility/page.tsx` (Read-only metadata & status view)
- **Automated Regression Scripts**: `scripts/seo-regression-test.mjs`
- **Search Documentation**: `SEARCH_INTENT_MAP.md`, `COMPETITOR_SEARCH_GAPS.md`, `SEO_BLOCKERS.md`

---

## 3. CONFLICT PROTOCOL
If any search optimization requirement appears to depend on a file inside Claude's domain:
1. **DO NOT** edit Claude's file.
2. Abstract the capability into a new standalone discovery helper or utility module under `src/lib/seo/`.
3. Record the dependency in `SEO_BLOCKERS.md`.
4. Proceed with isolated additive routes and tools.

---

## 4. PUSH GATE GUARANTEE
- **No force-resets, git stashes, or git cleans** will be executed in the main worktree.
- Uncommitted files in the workspace belong to Claude and must remain untouched.
- No code will be committed, pushed to remote, or deployed to Vercel until all verification passes and explicit user confirmation is given.
