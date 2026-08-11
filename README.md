# Ropes

**Learn the ropes. Go independent.**

Ropes is a platform that teaches working professionals to build AI no-code systems, then helps them
turn that skill into independent client work. It combines a marketing/enrollment funnel, an
AI path-recommendation engine, a gated course portal with an AI mentor, and an admin back office
in a single Next.js app.

## Stack

| Concern | Tool |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS v3 |
| UI kit | Hand-tuned shadcn/ui-style primitives (`src/components/ui`) + `lucide-react` |
| Hosting | Vercel |
| Auth | Clerk (Google OAuth primary, email/OTP fallback) |
| Database | Supabase (Postgres + Storage + pgvector), RLS on every table |
| Email | Resend |
| LLM | Cerebras (`gpt-oss-120b`) — path recommendation + AI mentor chat, RAG via Postgres full-text search over `content_chunks` |
| Payments | Razorpay Checkout (one-time) + Subscriptions (retainer tier, flagged off by default) |
| Scheduling | Calendly embed + webhook |

See [`DECISIONS.md`](./DECISIONS.md) for why a few things (Next 14 over 16, an untyped Supabase
client, the `content_chunks`/`mentor_messages` tables, etc.) are the way they are.

## Project structure

```
src/app/(marketing)/     public site — home, courses, webinar, case studies, legal, contact
src/app/(portal)/        gated student area — dashboard, community, sessions
src/app/courses/[slug]/learn/   gated course player (module unlock, progress, downloads, AI mentor)
src/app/checkout/[slug]/        Razorpay checkout
src/app/admin/                  admin-only back office
src/app/api/                    route handlers (webhooks, payments, mentor, admin CRUD, ...)
src/components/ui/              hand-tuned UI primitives (Tailwind v3, not shadcn-CLI output — see DECISIONS.md)
src/components/{marketing,portal,course,admin,shared}/   feature components
src/lib/                        Supabase/Clerk/Resend/Cerebras/Razorpay clients + domain helpers
src/types/db.ts                 hand-written row types for every table
supabase/migrations/            schema + RLS, in order
```

## Running locally

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables** — copy the template and fill in real values:

   ```bash
   cp .env.local.example .env.local
   ```

   Every variable in `.env.local.example` has a comment pointing at where to get it (Clerk, Supabase,
   Resend, Cerebras, Razorpay, Calendly).

3. **Set up Supabase** (see the migration section below), then start the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

### Clerk ↔ Supabase

Auth identity lives in Clerk, not Supabase Auth. Two things need wiring on the Clerk side:

- **A JWT template named `supabase`** (Clerk dashboard → Configure → JWT Templates) so client-side
  Supabase calls (`src/lib/supabase/browser.ts`, `useSupabase()`) carry a token Supabase's
  third-party-auth integration will trust. Configure Clerk as a third-party auth provider in the
  Supabase dashboard (Authentication → Sign In / Providers) pointing at your Clerk instance.
- **A webhook** at `{SITE_URL}/api/webhooks/clerk`, subscribed to `user.created`, `user.updated`,
  `user.deleted`, with the signing secret set as `CLERK_WEBHOOK_SECRET`. This is what upserts Clerk
  users into `public.users`.

In practice, almost every server-side mutation in this app goes through the Supabase **service-role**
client (`src/lib/supabase/server.ts`) inside a Next.js API route, not the browser client — RLS is the
defense-in-depth layer for direct reads, not the primary access-control mechanism for writes.

## Running the Supabase migration

```bash
# with the Supabase CLI, from the project root, against a linked project:
supabase db push

# or apply the SQL files directly in order via the Supabase SQL editor / psql:
supabase/migrations/0001_init.sql       # schema + RLS
supabase/migrations/0002_storage.sql    # storage buckets + policies
supabase/migrations/0003_mentor_messages.sql

# optional local dev seed data (sample courses/case studies/announcements):
supabase/seed.sql
```

## Deploying to Vercel

1. Push this repo to GitHub (or your Git provider of choice) and import it in Vercel.
2. Add every variable from `.env.local.example` to the Vercel project's environment variables, with
   real values, and set `NEXT_PUBLIC_SITE_URL` to your production URL.
3. Point the Clerk webhook and Razorpay/Calendly webhooks at your production URL
   (`/api/webhooks/clerk`, `/api/webhooks/razorpay`, `/api/webhooks/calendly`).
4. Deploy. No `vercel.json` is required — this is a stock Next.js App Router deployment.

## What's stubbed / needs a real account to fully light up

- **Retainer subscriptions** — the Razorpay Subscriptions code path is fully implemented
  (`/api/payments/create-subscription`, `RetainerSubscribeButton`) but gated behind
  `NEXT_PUBLIC_ENABLE_RETAINER_SUBSCRIPTIONS` (default `false`) until a live Razorpay business
  account and `RAZORPAY_RETAINER_PLAN_ID` exist.
- **AI mentor RAG** — retrieval currently runs on Postgres full-text search over `content_chunks`
  (populate it with course transcripts/playbook/template text via the admin service-role client or a
  seed script). The table also has a `pgvector` `embedding` column ready for a true-embedding upgrade
  once an embedding provider is chosen.
- **This environment specifically** was built and verified against **placeholder** API keys (see
  `.env.local.example`) — `npm run build` passes and every route statically/dynamically compiles, but
  the live auth flow, payments, AI calls, and emails need real credentials to actually run end to end.
