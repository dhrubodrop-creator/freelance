-- Critical bug fix, found while verifying Phase 1: `profiles` never had a
-- unique constraint on user_id — only a plain (non-unique) index. Postgres
-- requires a real unique/exclusion constraint for `ON CONFLICT (user_id)` to
-- resolve, so every `.upsert({...}, {onConflict: "user_id"})` call — including
-- the one in the already-shipped onboarding POST /api/profile route — has
-- been failing with "no unique or exclusion constraint matching the ON
-- CONFLICT specification" since launch. The error was never checked in that
-- route, so onboarding appeared to succeed (profile_completed set true,
-- recommendation generated from the submitted form data directly) while the
-- profiles row itself was silently never written. Confirmed via direct query:
-- `select count(*) from public.profiles` returned 0 rows in production prior
-- to this fix, despite real completed enrollments existing.
--
-- Safe to add now: zero existing rows means no duplicate-user_id conflict to
-- resolve first.

alter table public.profiles add constraint profiles_user_id_key unique (user_id);

-- The old plain index is now redundant (the unique constraint creates its own
-- backing index), so drop it to avoid maintaining two indexes on the same column.
drop index if exists public.profiles_user_id_idx;
