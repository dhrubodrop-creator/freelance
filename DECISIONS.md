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
