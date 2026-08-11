# Codex Handover — Ropes visual upgrade

**Read this whole file before touching anything.** It exists so you (or any agent) can pick up
exactly where this left off without re-learning the codebase from scratch or breaking something
that already works and is live in production.

## What this is, right now

**Ropes** ("Learn the ropes. Go independent.") is a complete, live, working Next.js 14 platform —
marketing site, Clerk auth, AI path recommendation (Cerebras), Razorpay checkout, a gated course
portal with an AI mentor (RAG over Postgres), Calendly booking, and an admin back office. It is
**not a prototype** — it's deployed, wired to a real Supabase database, and the signed-in flows
work with real credentials (except Razorpay, intentionally left on placeholder keys until the
owner is ready to test payments).

- **Live site**: https://ropes-three.vercel.app
- **GitHub**: https://github.com/dhrubodrop-creator/freelance (branch `main`) — pushing to `main`
  auto-deploys to production via the Vercel↔GitHub integration. There is no separate deploy step.
- **Vercel project**: `free-9bf0/ropes`, linked locally via `vercel link` (see `.vercel/` — do not
  delete it, it's how `vercel` CLI commands know which project to target).
- **Supabase project**: `wkdwquibcjxbxdrjqjri` (Mumbai region), fully migrated and seeded.
- **Local repo**: `/Users/dhrubojyotigangopadhyay/ropes`
- **Local env**: `.env.local` has real working credentials for Clerk, Supabase, Resend, Cerebras,
  Calendly. Razorpay is still on placeholder values by the owner's explicit choice. This file is
  gitignored — never commit it, never print its full contents into a PR description or commit
  message.
- Full architecture, schema, and every judgment call made while building this is documented in
  **`DECISIONS.md`** and **`README.md`** at the repo root — read those too, they're not filler.

## Your task: make it look like the wow-factor, cinematic, trust-building version

The owner's own words: **"wow images and 3d cinematic website trust-building all indian context
images that it look so powerful."** Translated into an actual brief:

- Replace the current abstract-gradient-only visual treatment (mesh-gradient hero backgrounds,
  no photography, no illustration) with something that has real visual weight — cinematic
  imagery, dimensional/3D elements, richer hero compositions.
- **Indian context**: imagery, people, settings, and cultural cues should read as authentically
  Indian — this is a platform for Indian working professionals going independent. Not generic
  Western stock-photo "diverse team in a bright office" — think specific: a home office in a
  Tier-2 Indian city, a laptop open at a kitchen table in the evening, a phone screen showing a
  UPI payment notification, someone on a video call with a client, textures and light that feel
  like India, not a template.
- **Trust-building**: this app is asking strangers to pay real money (Razorpay, INR) and hand
  over a CV. Every added visual should reinforce credibility — polish, specificity, confidence —
  never gimmicky or hype-driven.
- **"So powerful"**: the owner wants visual ambition. Interpret that as: strong hero compositions,
  maybe a subtle 3D/parallax element, confident motion — but see the constraints below before you
  reach for a heavy 3D library, because there's a real performance/bundle-size tradeoff to weigh
  against a Next.js app that currently ships a clean, fast, mostly-static marketing site.

### Follow-up direction from the owner (verbatim, then interpreted)

Owner's exact words, second round: **"it will not change color just remove placeholder all ui ux
and give dynamic cinematic trust exp with wow photos very related and memorable and customer must
hook like theme."**

What that means concretely:

- **Do not change the color system at all.** Same navy/gold/ink tokens, same CSS variables, same
  `tailwind.config.ts` color scale. This round is imagery, motion, and compositional richness —
  not a rebrand. If you're touching a `bg-`/`text-`/`border-` color class anywhere, stop — that's
  out of scope unless you're literally just applying an *existing* token you weren't using before.
- **Remove every placeholder-looking UI element, not just the testimonial images.** Audit for and
  replace/upgrade: the "Course catalog is unavailable right now" empty-state text on the homepage,
  the "Video coming soon" placeholder box on the course player, the flat gradient-only card headers
  standing in for photos on `/case-studies`, and any other spot that currently reads as "this part
  isn't finished yet." The one exception is the literal `[TESTIMONIAL PLACEHOLDER — replace with
  real student quote]` *text marker* — keep that specific honesty mechanism (don't invent a fake
  named student with a fake photo pretending to be real), but the *visual container* around it
  should look intentional and polished, not like an empty box waiting for content.
- **"Dynamic cinematic trust experience"**: this should feel like one coherent theme/story running
  through the whole visitor journey — homepage → course detail → webinar → checkout — not one nice
  hero image and then flat pages after it. Carry the visual language (imagery style, motion
  language, compositional grammar) through every page listed under "Where to actually work" below,
  not just the homepage.
- **"Wow photos very related and memorable"**: imagery has to connect specifically to what Ropes
  actually sells (AI no-code systems, outreach agents, automation, going independent) and to who
  it's for (Indian working professionals), not generic "success" or "laptop" stock imagery. Every
  image should earn its place by reinforcing a specific claim on that section of the page.
- **"Customer must hook like theme"**: the visual/emotional arc should function like a hook — the
  hero should land an emotional beat in the first viewport (not just a headline), and that same
  thread (imagery style, color-in-photos, motion) should recur enough that a returning visitor
  recognizes "this is Ropes" instantly, the way a strong brand identity should feel.

### Where to actually work

Everything visual lives under these paths — this is the complete list of what's in scope:

- `src/app/(marketing)/page.tsx` — the homepage. Highest priority. Hero section, "story/credibility"
  section, offer cards, testimonials, closing CTA. Also has an empty-state string, `"Course
  catalog is unavailable right now — check back shortly"`, that only ever shows if Supabase
  returns zero courses — low priority to redesign, but don't leave it looking broken if you touch
  that section.
- `src/app/(marketing)/courses/[slug]/page.tsx` — course detail hero + earnings table.
- `src/app/(marketing)/webinar/page.tsx` — webinar landing hero.
- `src/app/(marketing)/case-studies/page.tsx` — testimonial cards (currently abstract gradient
  placeholders where a photo would go — see `image_url` handling, currently null for all seed
  rows).
- `src/app/courses/[slug]/learn/[moduleId]/page.tsx` — the course player. Has a literal "Video
  coming soon" gray-box placeholder (renders whenever a module has no `video_url` set) — this is
  inside the gated portal, lower priority than the public marketing pages, but flagged since it's
  one of the placeholder-looking spots the owner means.
- `src/app/checkout/[slug]/page.tsx` — trust markers near payment (currently text + lucide icons
  only — SRS explicitly wants a "Razorpay badge" / visible security signal here).
- `src/components/shared/auth-shell.tsx` — the dark split-panel next to sign-in/sign-up forms.
- `src/components/shared/site-header.tsx`, `src/components/shared/site-footer.tsx` — logo/brand
  touches only, don't restructure these; they're shared across every page including the gated
  portal.
- New image/3D assets go in `public/` (create subfolders as needed, e.g. `public/images/`,
  `public/models/`). Anything referenced from code should go through `next/image` (already used
  nowhere yet in this codebase — you'll be introducing it fresh, so get the `sizes`/responsive
  props right).

### Design system you must match (do not invent a new one)

Read `tailwind.config.ts` and `src/app/globals.css` in full before writing any visual code. Summary:

- **Colors**: deep-navy `primary` (near-black blue, used for dark sections/hero), warm
  rope-gold `accent` (CTAs, highlights), a cool blue-tinted `ink` neutral scale (backgrounds/text),
  `success`/`destructive` for status. No default Tailwind blue/indigo, no cream+terracotta,
  no pure black+neon.
- **Type**: `font-heading` = Sora (headings), `font-sans` = Inter (body), `font-mono` = JetBrains
  Mono. Custom fluid type scale (`text-h1`…`text-h4`, `text-display`, `text-display-lg`,
  `text-body-lg`) already uses `clamp()` for mobile-safe scaling — **use these classes, don't
  introduce new fixed-px heading sizes** (a fixed-px hero heading already caused a real overflow
  bug at 375px width once; see `DECISIONS.md` for the story).
- **Existing hero treatment**: `bg-primary bg-mesh-hero bg-noise text-primary-foreground` — a
  radial-gradient mesh (`backgroundImage.mesh-hero` in `tailwind.config.ts`) plus a subtle grain
  overlay (`.bg-noise` utility in `globals.css`). You can layer imagery on top of or instead of
  this, but keep it in mind as the "brand default" dark surface treatment other pages still use.
- **Icons**: `lucide-react` only, everywhere, already imported throughout. Never emoji in actual
  UI.

## Hard constraints — read twice

1. **Do not touch business logic, period.** That means: everything under `src/app/api/`,
   `src/lib/` (except purely presentational helpers if any), `src/middleware.ts`,
   `supabase/migrations/`, `src/types/db.ts`, the Clerk/Supabase/Razorpay/Resend/Cerebras client
   setup files, and any `getCurrentUser`/`auth()`/RLS-related code. If a page file mixes a
   server-side data fetch with JSX (most of them do — e.g. `page.tsx` files call
   `supabaseAdmin()` directly), **only touch the JSX/className parts**, leave every data-fetching
   line, every `await`, every type import exactly as it is. When in doubt, don't touch that line.
2. **Do not change page routes, file names, or component prop signatures.** Other components import
   these by exact path/name.
3. **Tailwind is v3.4, not v4.** This bit the previous build hard — the shadcn CLI's default
   output targets v4-only syntax and silently breaks. Never introduce: `in-data-*`, `not-*`
   variants, arbitrary-var spacing like `px-(--foo)`, bare `data-open:`/`data-active:` shorthand
   (use `data-[state=open]:` instead), or `has-data-[x]:` shorthand.
4. **`cn()` / `tailwind-merge` gotcha**: `src/lib/utils.ts` uses `extendTailwindMerge()` with this
   project's custom color tokens and `bg-mesh-hero`/`bg-noise` registered as their own class
   groups — this was added after stock `tailwind-merge` silently dropped `bg-primary` on five
   pages (real bug, see `DECISIONS.md`). If you add new custom background/color utilities to
   `tailwind.config.ts`, **register them in `src/lib/utils.ts`'s `extendTailwindMerge` config too**,
   or you'll reintroduce that exact invisible-hero bug.
5. **ESLint will fail the build on raw apostrophes** in JSX text (`react/no-unescaped-entities`) —
   use `&rsquo;`/`&apos;` or restructure the string. This has bitten every round of content work
   on this project so far.
6. **No fabricated stats, no fake testimonials presented as real.** The existing seed data uses
   literal `[TESTIMONIAL PLACEHOLDER — replace with real student quote]` markers — if you add
   testimonial imagery, it must visually read as a placeholder/example (e.g. paired with that
   existing marker text), not as a real endorsement with a stock photo pretending to be a real
   student.
7. **Licensing**: no copyrighted stock photography, no scraped images. Use original illustration,
   AI-generated imagery you have rights to, or well-composed abstract/3D compositions built in
   code (SVG, CSS, Three.js/WebGL primitives, etc.). If you generate images, keep the source
   prompts/generation method documented somewhere (a comment or a short note in `DECISIONS.md`)
   so it's clear they're not stock photos.
8. **Performance**: this currently ships a fast, mostly-static marketing site (check the route
   sizes in a `npm run build` output — most marketing pages are a few kB). If you add a 3D
   library (Three.js/R3F, Spline embed, Lottie, etc.), lazy-load it (`next/dynamic` with
   `ssr: false`), keep it off the critical path, and respect `prefers-reduced-motion` (there's
   already a global reduced-motion rule in `globals.css` — extend it, don't bypass it). Don't
   let a hero animation block first paint or push Core Web Vitals into the red.
9. **Mobile-first, tested down to 375px.** This is explicit in the original SRS and already
   caused one real bug (see `DECISIONS.md`). Any new hero imagery/3D element must degrade
   gracefully at mobile width — don't assume desktop viewport.
10. **Don't touch `.env.local`, `.vercel/`, `supabase/migrations/`, or any file under
    `src/lib/supabase/`, `src/lib/razorpay.ts`, `src/lib/cerebras.ts`, `src/lib/resend.ts`,
    `src/lib/mentor.ts`, `src/lib/recommend.ts`, `src/lib/enrollment.ts`,
    `src/lib/course-access.ts`, `src/lib/current-user.ts`.** None of these are visual.

## How to verify you haven't broken anything

```bash
cd /Users/dhrubojyotigangopadhyay/ropes
npm run build          # must exit 0 — type errors and eslint errors both fail this
npx eslint . --quiet   # must print nothing
npm run dev            # visually check http://localhost:3000 at both desktop and 375px width
```

Before considering the work done, diff `git diff --stat` and sanity-check that nothing under
`src/app/api/`, `src/lib/`, `supabase/`, or `src/middleware.ts` shows up changed. If it does,
you've gone out of scope — revert that part.

Deploying is just `git push origin main` (or ask the owner to review first, their call) — Vercel
picks it up automatically. Don't run `vercel --prod` yourself unless explicitly asked; that
bypasses the GitHub-triggered deploy the owner is already using.

## Known open items (not your job unless asked)

- Razorpay is intentionally still on placeholder keys — don't touch `NEXT_PUBLIC_RAZORPAY_KEY_ID`
  or anything payment-related.
- `CALENDLY_WEBHOOK_SIGNING_KEY` is still a placeholder — booking works, but session records won't
  sync to the DB via webhook yet.
- Clerk is currently configured for email+password rather than email+OTP (a dashboard toggle, not
  code) — not your concern for this task.
