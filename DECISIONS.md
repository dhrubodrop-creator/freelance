# Decisions

Ambiguous or judgment calls made while building Ropes, and why.

## Cinematic visual system

The marketing journey uses four original AI-generated editorial images under `public/images/ropes/`,
created with OpenAI's built-in image generation tool and converted locally to WebP. The prompt set
specified authentic contemporary Indian home-work settings, practical AI automation workflows,
deep-navy blue-hour light, warm rope-gold practical light, natural skin/material texture, and no
logos, readable UI, watermarks, luxury fantasy, or generic Western stock-office cues. The assets are:

- `hero-independent.webp`: an Indian professional on a client call while building an automation.
- `course-builder.webp`: an Indian professional learning through a hands-on workflow project.
- `webinar-live.webp`: an Indian instructor leading a live workflow demonstration.
- `proof-workbench.webp`: a non-identifying editorial still life of client notes, chai, automation,
  and a payment signal, used when a real student portrait is unavailable so no stock person is
  presented as an actual testimonial.

The images use `next/image`, responsive `sizes`, and small WebP sources (about 60–95 KB each). Motion
is CSS-only, non-blocking, and inherits the global `prefers-reduced-motion` shutdown rule.

The course catalog uses 19 additional original WebP illustrations under `public/images/courses/`,
keyed by course slug in `src/components/marketing/course-visual.ts`. Each prompt describes the
actual subject—agent graphs, retrieval chains, model operations, cloud AI architecture, testing,
security, product management, or data workflows—while keeping one coherent navy-and-rope-gold
editorial system. Prompts explicitly excluded readable text, third-party logos, trademarks, and
watermarks. This avoids presenting one generic laptop image as evidence for unrelated courses.

The earlier perspective tilt and continuous image drift were removed. In Safari, the transformed
containers created visible trapezoid seams and triangular background gaps at section boundaries;
the depth now comes from framing, overlays, and shadow without changing layout geometry.

## Real end-to-end verification pass

Beyond `npm run build`, this was verified against a **real** local Postgres (via Postgres.app)
running the actual migration files, fronted by a real PostgREST instance (a faithful stand-in for
Supabase's REST layer) and exercised through the real `@supabase/supabase-js` client — plus a real
browser (Clerk temporarily stubbed client-side only, since no real Clerk instance is available in
this environment) rendering the actual pages at both desktop and 375px mobile width, including a
real form submission that landed a row in the real `leads` table. This found and fixed three real
bugs that `npm run build` could never catch:

1. **Migration bootstrap order** (`0001_init.sql`): `current_user_id()`/`is_admin()` referenced
   `public.users` before that table existed. Postgres validates `language sql` function bodies
   against the catalog at `CREATE FUNCTION` time (unlike `plpgsql`, which defers), so the migration
   failed outright on a real database. Fixed by moving those two functions after the `users` table.
2. **Hero/heading text overflow at 375px**: `text-display`/`text-h1`/etc. were fixed-px sizes with
   no responsive scale-down, so "Go independent." ran off the right edge of a real mobile viewport.
   Fixed by converting the whole display/heading scale in `tailwind.config.ts` to fluid `clamp()`
   values.
3. **Silently invisible hero sections** (5 pages: home closing CTA, webinar, course detail, case
   studies, onboarding loading state): `cn()` → `twMerge()` was dropping `bg-primary` and
   `bg-mesh-hero`, leaving only `bg-noise`, because stock `tailwind-merge` doesn't know this
   project's custom theme and buckets *any* `bg-<word>` it doesn't recognize into one generic
   "background color" conflict group — keeping only the last of the three and rendering white text
   on a white background. Fixed by switching `cn()` to `extendTailwindMerge()` with this project's
   custom color tokens and background-image utilities registered as their own class groups
   (`src/lib/utils.ts`).

What this pass did **not** cover: the signed-in flows (onboarding → recommendation → checkout →
course portal → mentor chat → admin) need a real Clerk instance to exercise — `auth()` correctly
throws without real `clerkMiddleware()` context, which is itself a good sign (it fails loud, not
open), but it means those flows are verified by code review and type-checking, not a live click-
through, in this environment specifically.

## Stack & tooling

- **Next.js 14, not 16.** `create-next-app@latest` scaffolds Next 16 with Tailwind v4 by default. The SRS asks for "Next.js 14+" and a `tailwind.config.ts`-driven token system, and Next 14 + Tailwind v3 is the best-supported combination for Clerk (`@clerk/nextjs`) and the broader shadcn/ui ecosystem today. Repinned to Next 14 and classic Tailwind v3.
- **Hand-rewrote the shadcn/ui component set.** The current `shadcn` CLI (v4.16) generates components against Tailwind v4-only syntax (`in-data-*`, `not-*`, arbitrary-var spacing like `px-(--x)`, bare `data-open:` shorthand, `has-data-[x]:` shorthand) regardless of the project's installed Tailwind version. Those don't compile under Tailwind v3.4. Every primitive in `src/components/ui/` was rewritten by hand against the classic Radix + `hsl(var(--x))` CSS-variable pattern, using the `radix-ui` unified package for primitives, and re-themed to the brand tokens in the same pass (never left at generic shadcn defaults).
- **Supabase client is untyped** (`createClient(url, key)`, no `Database` generic). The hand-written `Database` type in `src/types/db.ts` didn't satisfy `@supabase/supabase-js`'s generic table constraints (it wants a `Relationships` field per table we don't hand-maintain), which made every `.select()` infer `never`. Query results are cast to the individual `Row` types from `src/types/db.ts` at each call site instead — see `src/lib/supabase/server.ts` for the rationale in context.
- **Zod v4** was installed (latest on npm). `z.enum(...)`'s error-message param is `error`, not the v3 `required_error`. For number fields bound to `react-hook-form`, `z.coerce.number()` created an input/output type mismatch against the resolver's generic — server-side routes (parsing `FormData`, always strings) use `z.coerce.number()`; client-side forms use plain `z.number()` with `register(field, { valueAsNumber: true })` instead.

## Data model additions (beyond the literal SRS table list)

- **`content_chunks`** — backs the AI mentor's RAG retrieval over course transcripts/playbooks/templates. Retrieval currently uses **Postgres full-text search** (`tsvector` + `ts_rank`, via the `match_content_chunks` SQL function) rather than true vector similarity — Cerebras (the specified LLM) doesn't expose an embeddings endpoint, and no embedding provider was specified in the SRS. The table also provisions a `pgvector` `embedding` column for a future upgrade once an embedding provider is chosen; swapping `match_content_chunks` to a `<->` similarity query is a small, isolated change at that point.
- **`mentor_messages`** — chat history and the AI mentor's rate limit both need somewhere to live. Rate limiting counts `mentor_messages` rows in the trailing 60 seconds per user (max 8/minute) rather than using Redis/Upstash, since neither is in the specified free-tier stack.
- **`courses.slug`** and **`courses.track`** — needed for clean routing (`/courses/[slug]`) and for the AI recommendation engine to map a student's profile to a specific track programmatically.

## Feature-level calls

- **Weekly live session info block** (SRS: "admin-editable via a simple internal table") reuses the existing `announcements` table — shown as a pinned card on the dashboard sourced from the latest announcement — rather than adding a dedicated table the admin CRUD scope didn't otherwise call for.
- **Enrollment activation is idempotent across two paths**: the client-side Razorpay checkout `handler` calls `/api/payments/verify` (fast path, signature-verified) and the `/api/webhooks/razorpay` route independently does the same upsert (durable path, in case the buyer closes the tab before the client call completes). Both funnel through `activateEnrollment()` so a race between them is a no-op, not a double-charge or duplicate email.
- **Retainer subscriptions**: the full Razorpay Subscriptions code path is implemented (`/api/payments/create-subscription`, `RetainerSubscribeButton`) but gated behind `NEXT_PUBLIC_ENABLE_RETAINER_SUBSCRIPTIONS` (default `false`), per the SRS's explicit allowance — Razorpay recurring billing needs a live (non-test) business account to activate a plan. No dedicated `subscriptions` table was added while the feature ships off by default; that's the next piece of schema work once a real plan ID exists.
- **Course content access control**: `playbooks` and `templates` files live in a **private** Supabase Storage bucket (`course-content`), served through `/api/downloads/[type]/[id]`, which checks the requester has an active enrollment for the parent course before minting a 60-second signed URL. CV uploads go to a separate private bucket (`cv-uploads`), one folder per Clerk user ID.
- **Sequential module unlock**: a module is unlocked once the previous module has a `progress` row with `completed_at` set (first module is always unlocked). Enforced both in the UI (`ModuleSidebar`) and server-side (the `[moduleId]` page redirects away from a locked module).
- **AI recommendation resilience**: if the Cerebras call fails or returns unparseable output, `generateRecommendation()` falls back to a deterministic keyword match on industry/occupation (sales-ish → outreach track, ops-ish → automation track, else → foundations) so onboarding never hard-fails on an LLM hiccup — relevant in this environment specifically, since it's running against placeholder API keys.
- **Admin bypass**: all admin mutations go through Next.js API routes under `/api/admin/*` using the Supabase **service-role** key after an explicit `requireAdminUser()` check, rather than relying on RLS JWT-claim policies for writes (RLS policies still exist as the defense-in-depth read layer — see `supabase/migrations/0001_init.sql`).

## Repo / delivery

- **Not pushed to `github.com/dhruboshop/freelancer-`.** That repo doesn't exist yet, and the `dhruboshop` GitHub account has no valid credentials on this machine (`gh auth status` shows an invalid/expired token for it, alongside two other unrelated working accounts). Per the user's explicit choice mid-build, this was built and committed locally with normal incremental commits; pushing is left to the user once they've sorted out access to that account/repo.

## Industry Snapshot (per-course researched content)

- **`src/lib/industry-data.ts`** holds real, cited research for all 19 courses — current tools/frameworks, market-signal facts (each with a named source), named-company case studies, and 4-6 free/official external resources per course, gathered via live web research across four parallel research passes (Aug 2026). Every fact carries a `source` field and is rendered on the course detail page with the citation visible (`src/components/marketing/industry-snapshot.tsx`) — nothing here is a fabricated stat or invented testimonial. Numbers the research couldn't trace to a primary source were excluded rather than estimated (e.g. specific Upwork/Toptal rate cards were consistently blocked/unavailable, so no freelance-rate figures are quoted anywhere in this data).
- **Azure AI course content correction**: the research surfaced that Microsoft retired the AI-102 ("Azure AI Engineer Associate") certification on June 30, 2026 and renamed "Azure AI Foundry" to "Microsoft Foundry" on Nov 18, 2025 — both confirmed directly on Microsoft's own pages. The existing `azure-ai` course (seeded before this research pass) still targeted the retired AI-102 exam and the old "Azure AI Studio" name. Rather than re-run the full `seed-ai-courses.mjs` script (which deletes and reinserts every module across all 19 courses — too large a blast radius against a database with real, paying enrollments), the two affected module rows and the course description were updated directly via a targeted Supabase update, preserving module IDs (and therefore any existing user progress/template/playbook references). `scripts/seed-ai-courses.mjs` was also updated to match, so a future full reseed doesn't regress this fix.
- **PDF playbooks regenerated with the same Industry Snapshot research** (`scripts/generate_playbooks.py`) — a new page per playbook mirrors the web course page's Tools / Market Signal (with sources) / Go Deeper / Certification sections. Found and fixed a real, pre-existing bug while doing this: ReportLab's `Paragraph` parses its text as a small XML dialect, so any literal `&` (e.g. "ATT&CK", "W&B", "Data & ML", a `?a=1&b=2` resource URL) silently corrupted the rendered text — this affected the original AI Operations and Data & ML track PDFs too, not just the new content. Added an `esc()` helper and applied it to every dynamic string inserted into a `Paragraph` call. All 19 PDFs regenerated and spot-verified via real signed-URL fetch (`%PDF` magic bytes, `application/pdf` content-type, correct byte counts).

## Special-discount pricing (₹49–₹99)

- **`SPECIAL_PRICE_INR`** (`src/lib/pricing.ts`) replaces the flat 70%-off calculation with an explicit per-course sale price, tiered in six steps (₹49/59/69/79/89/99) by each course's original list price/depth — not identical across all 19 courses. `getDiscountedPrice(price, slug)` looks up this map first and falls back to the standing 70%-off math for any course not in it (defensive; all 19 are currently mapped).
- **Discount-percent badge is computed, not hardcoded**, and is floored + capped at 99 (`getDiscountPercent`). At a ₹49 sale price against a ₹12,999+ list price, a naive `Math.round` landed on a literal "100% off" badge — which would read as the unrelated unified 100%-off master promo code the user explicitly said never to write as "100% disc" anywhere in UI copy. Caught in browser verification before shipping; fixed by flooring and capping at 99.
- Server-side charge amount (`/api/payments/create-order`) uses the same `getDiscountedPrice(price, slug)`, so the Razorpay order total always matches the displayed price.

## Phase 0 — Webhook signature hardening (skill-to-income platform evolution, security fix first)

- **Calendly webhook fail-open bug, fixed.** `src/app/api/webhooks/calendly/route.ts` previously had `if (secret && !verify(...))` — when `CALENDLY_WEBHOOK_SIGNING_KEY` is unset, the whole condition short-circuits false and the webhook silently processes an **unsigned** request. Fixed to unconditionally reject (500) when the secret isn't configured, matching the existing Clerk/Razorpay webhook convention. Also wrapped `JSON.parse` in a try/catch (was previously an unhandled throw on a malformed body → raw framework 500 instead of a clean 400).
- **Found and fixed a second, unrelated bug while verifying the above**: `crypto.timingSafeEqual` throws (rather than returning `false`) when its two buffer arguments differ in length. All three signature verifiers in the codebase (`verifyCalendlySignature`, and `verifyRazorpaySignature`/`verifyRazorpayPaymentSignature` in `src/lib/razorpay.ts`) called it directly on attacker-controlled input with no length check first — a malformed/truncated signature header would crash the request handler with an unhandled 500 instead of cleanly rejecting with 400. Caught via behavioral testing (curl against a real dev server with a deliberately short `v1=deadbeef` value), not by code review alone. Fixed all three by comparing buffer lengths before calling `timingSafeEqual`.
- Verified behaviorally (no test framework exists in this repo — followed the existing convention of scratch Node/curl verification scripts rather than introducing one as a side effect of a security fix): secret-unset → 500, no-signature → 400, malformed-signature → 400 (previously crashed to 500), correctly-signed → 200 processed. Razorpay signature functions regression-tested in isolation (valid/tampered/wrong-length/empty inputs) since payments are live.

## Phase 1 — Ongoing professional profile (skill-to-income platform evolution)

- **New `/profile` page** (`src/app/(portal)/profile/page.tsx`) — the onboarding form is no longer the user's entire profile. Extends `profiles` (`supabase/migrations/0005_profile_extension.sql`: `location`, `bio`, `preferred_language`, `income_goal_inr`, `work_preference`, `linkedin_url`, `portfolio_url`, `github_url`, `website_url`) and adds two new owner-RLS'd tables, `work_experiences` and `education`, following the exact same owner-or-admin RLS pattern as every other user-owned table. **Deliberately did not add a photo field** — Clerk already owns avatar data via its own UI; duplicating it would just create two out-of-sync sources of truth for the same thing.
- **Profile completion score is a real, honest checklist** (`src/lib/profile-completion.ts`), not a synthetic engagement metric — 8 equally-weighted, individually-checkable items (bio, location, income goal, work preference, ≥1 experience, ≥1 education, ≥1 link, CV on file). `missing` lists exactly which ones, in the same order shown to the user.
- **CV re-upload is a separate route** (`POST /api/profile/cv`) rather than reusing the onboarding `POST /api/profile` — the onboarding route requires resubmitting occupation/industry/career_goal/hours_per_week and always regenerates an AI recommendation as a side effect; swapping a CV file shouldn't force either.
- **Critical pre-existing bug found and fixed while verifying this phase, unrelated to the new code**: `profiles.user_id` never had a unique constraint — only a plain (non-unique) index (`profiles_user_id_idx`). Postgres requires a real unique/exclusion constraint for `ON CONFLICT (user_id)` to resolve, so the **already-shipped onboarding route's** `.upsert({...}, {onConflict: "user_id"})` call has been failing with "no unique or exclusion constraint matching the ON CONFLICT specification" on every single onboarding submission since launch. That route never checked the upsert's `error`, so onboarding *appeared* to succeed (the recommendation is generated from the submitted form data directly, not a DB re-read, so it still worked) while the actual `profiles` row was silently never written. Confirmed directly: `select count(*) from public.profiles` returned **0 rows** in production prior to the fix, despite real completed enrollments existing. Fixed via `supabase/migrations/0006_profiles_unique_user_id.sql` (adds `profiles_user_id_key unique (user_id)`, safe since zero existing rows means no conflict to resolve first) and by adding proper error-checking to the onboarding route (`src/app/api/profile/route.ts`) so a future failure surfaces as a real 500 instead of silently discarding the submission. **This means no real user's pre-Phase-1 profile data (occupation/industry/career goal/hours-per-week/CV) was ever actually persisted — it cannot be retroactively recovered, since it was never written in the first place.** Existing users will need to re-fill their profile going forward; new submissions now save correctly.
- **Verification approach**: full CRUD cycle (insert/update-with-ownership-check/update-with-wrong-owner-should-no-op/delete) tested directly against production Supabase via a scratch script, including the onboarding-style upsert, the new profile-fields upsert, and confirming a resubmit doesn't clobber unrelated fields (verified before *and* after the unique-constraint fix, which is what surfaced the bug in the first place). Route-level auth gating verified behaviorally: `/profile` redirects to sign-in exactly like every other protected portal route. Full authenticated click-through (add experience, edit profile, watch the completion score change) was **not** performed — no credentials exist for a real signed-in test account in this environment, the same limitation already noted elsewhere in this file for other signed-in flows.

## Phase 2 — Skills taxonomy + Portfolio/proof (skill-to-income platform evolution)

- **Skills taxonomy is curated, not free-text** (`supabase/migrations/0007_skills_taxonomy.sql`): `skill_categories` and `skills` are admin-managed (public read, admin write, same RLS pattern as `courses`); users pick from the existing list via `user_skills` rather than typing arbitrary names. This is the deliberate mechanism against the taxonomy fragmenting into thousands of near-duplicate entries. `user_skills.self_level` is explicitly self-assessed only — course-derived and assessment-based confidence signals are a later phase, and the product must not conflate "the user says" with "the system verified."
- **Seeded skills are distilled from real content already in the database, not invented.** Queried every `modules.topics` value across all 19 live courses first, then condensed lesson-topic sentences (e.g. "Conditional routing and cycles") into clean, nameable competencies (e.g. "n8n Workflow Design") grouped into 10 categories — the 9 existing course tracks plus a "Business & Client Skills" category drawn from the playbook/monetisation content each track already has (client discovery, pricing, proposals). 41 skills seeded and verified via direct query after migration.
- **Portfolio proof uses a proper many-to-many join table** (`portfolio_item_skills`), not a `text[]` array of skill names on `portfolio_items` — keeps "skills this project demonstrates" referentially tied to the real taxonomy instead of free text that could drift out of sync with it. Deleting a portfolio item cascades to remove its skill links (`on delete cascade`), verified directly.
- **Merged "project submissions" into `portfolio_items`** rather than adding a separate table for it, per the same "don't introduce unnecessary tables" instruction the spec itself gives — a portfolio item optionally referencing `course_id` already covers "this is what I built for module X," without a redundant parallel table.
- **Verification**: full CRUD cycle tested directly against production Supabase — add/update/duplicate-add (upsert, not error) skill with a real unique constraint from the start this time (`user_skills` had `unique (user_id, skill_id)` in its original migration, learned from the Phase 1 bug), wrong-owner update/delete correctly no-op, portfolio item + skill links insert/read, and cascade delete of join rows on portfolio item deletion. Route-level auth gating verified behaviorally for both `/skills` and `/portfolio` — same sign-in redirect pattern as every other protected route. Full authenticated click-through not performed, same limitation as Phase 1.

## Phase 3 — Skill-gap engine + personalised monetisation + dashboard integration

- **Skill gap is plain deterministic code, not an AI call** (`src/lib/skill-gap.ts`) — comparing "skills in the recommended track's category" against "skills the user has" is a set difference, not reasoning, so it stays out of the LLM per this project's existing AI/non-AI split. Same principle applied to the **readiness score** (`computeReadinessScore` in `src/lib/monetisation.ts`): a transparent, explainable weighted sum (skills 25pt / portfolio-proof 30pt, weighted highest since proof is what makes a path credible / profile completeness 25pt / stated goals 20pt), not an LLM-generated number — verified at both bounds (all-zero inputs → 0, maxed inputs → 100).
- **`generateMonetisationPlan`** (`src/lib/monetisation.ts`) mirrors `generateRecommendation`'s exact existing pattern — same strict-JSON-only system prompt style, same try/catch-into-deterministic-fallback structure — extending the established AI approach rather than introducing a new one. System prompt explicitly bans income/job guarantees ("use language like 'based on your profile', 'potential', 'suggested' — never promise a specific income or guarantee a job/client") and instructs 1-3 paths only, not padding to a fixed count. **Verified with a real live Cerebras call** (not just a mock) — produced genuinely personalised, sensible output (e.g. "Freelance No-Code Automation Consultant" reasoning tied to the specific skills/portfolio project given as input).
- **`monetisation_plans` is one-row-per-user (`unique(user_id)`), regenerable** — same "cached, not recomputed every page load" pattern as `recommendations`, updated via upsert rather than an ever-growing history table. `monetisation_actions` (the checkable 4-week plan) has no `user_id` of its own; ownership is verified through the parent plan via an `!inner` join in the API route, and RLS policies use an `exists (...)` subquery against the parent for the same reason — the join-through-parent pattern from `portfolio_item_skills`, reused.
- **Dashboard extended, not redesigned** — added a compact 4-tile Career Progress row (profile %, skills count, portfolio count, readiness score, each linking to its page) and the `MonetisationInsightCard` (generate/regenerate button, readiness score + breakdown, suggested paths with skills-present/skills-needed badges, checkable weekly actions) directly above the existing recommendation card. Left the existing "Continue learning" / "Browse all tracks" sections untouched.
- **Caught and fixed my own mistake while writing this phase**: initially wrote `new Date(0).toISOString()` as a placeholder timestamp with a followup `.rpc("noop_unused")` workaround, incorrectly carrying over a *workflow-scripting-tool-specific* restriction on `new Date()` into regular Next.js application code, where no such restriction exists. Caught on review before it shipped; replaced with a plain, correct `new Date().toISOString()`.
- **Verification**: full DB cycle tested directly against production Supabase — plan upsert, actions insert, ownership-join resolution (mirroring exactly what the API route's authorization check does), action toggle, regenerate-replaces-not-duplicates (confirmed exactly one plan row survives a second upsert), and cascade delete of actions when a plan is deleted. Confirmed the modified `/dashboard` route still compiles and redirects correctly (no runtime crash from the new code) via a real dev server.
