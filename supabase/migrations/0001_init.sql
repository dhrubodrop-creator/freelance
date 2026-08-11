-- Ropes platform — initial schema
-- Auth identity lives in Clerk, not Supabase Auth. Clerk is configured as a
-- Supabase third-party auth provider, so `auth.jwt() ->> 'sub'` carries the
-- Clerk user id on any request made with a Clerk session token. Admin writes
-- (webhooks, payment capture, AI recommendation writes, /admin CRUD) go
-- through Next.js API routes using the service-role key, which bypasses RLS
-- entirely — the policies below are the defense-in-depth layer for any
-- direct client-side reads.

create extension if not exists "pgcrypto";
create extension if not exists "vector";

-- ── Helper functions ────────────────────────────────────────────────────

create or replace function public.current_clerk_id()
returns text
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claims', true)::json ->> 'sub', '')
$$;

-- ── Tables ──────────────────────────────────────────────────────────────
-- (public.users must exist before current_user_id()/is_admin() below, since
-- Postgres validates the body of `language sql` functions against the
-- catalog at CREATE FUNCTION time — unlike plpgsql, it isn't fully deferred.)

create table public.users (
  id uuid primary key default gen_random_uuid(),
  clerk_id text not null unique,
  name text,
  email text,
  phone text,
  role text not null default 'student' check (role in ('student', 'admin')),
  profile_completed boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.current_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.users where clerk_id = public.current_clerk_id()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where clerk_id = public.current_clerk_id() and role = 'admin'
  )
$$;

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  occupation text,
  years_experience integer,
  industry text,
  career_goal text check (career_goal in ('freelance_income', 'career_switch', 'side_income')),
  hours_per_week integer,
  cv_file_url text,
  created_at timestamptz not null default now()
);
create index profiles_user_id_idx on public.profiles (user_id);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text not null,
  phone text,
  source text,
  created_at timestamptz not null default now()
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  price numeric(10, 2) not null default 0,
  description text,
  track text,
  created_at timestamptz not null default now()
);

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null,
  video_url text,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);
create index modules_course_id_idx on public.modules (course_id);

create table public.recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  course_id uuid references public.courses (id) on delete set null,
  rationale text,
  created_at timestamptz not null default now()
);
create index recommendations_user_id_idx on public.recommendations (user_id);

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  payment_id text,
  status text not null default 'pending' check (status in ('pending', 'active', 'cancelled', 'refunded')),
  created_at timestamptz not null default now(),
  unique (user_id, course_id)
);
create index enrollments_user_id_idx on public.enrollments (user_id);
create index enrollments_course_id_idx on public.enrollments (course_id);

create table public.progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  module_id uuid not null references public.modules (id) on delete cascade,
  completed_at timestamptz,
  unique (user_id, module_id)
);
create index progress_user_id_idx on public.progress (user_id);

create table public.templates (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules (id) on delete cascade,
  file_url text not null,
  title text not null
);
create index templates_module_id_idx on public.templates (module_id);

create table public.playbooks (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  file_url text not null,
  title text not null
);
create index playbooks_course_id_idx on public.playbooks (course_id);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  calendly_event_id text,
  scheduled_at timestamptz,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);
create index sessions_user_id_idx on public.sessions (user_id);

create table public.case_studies (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text,
  image_url text,
  created_at timestamptz not null default now()
);

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  message text not null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved')),
  created_at timestamptz not null default now()
);
create index support_tickets_user_id_idx on public.support_tickets (user_id);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

-- Not in the original SRS table list, added to back the AI mentor's RAG
-- retrieval over course transcripts/playbooks/templates (see DECISIONS.md).
create table public.content_chunks (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses (id) on delete cascade,
  module_id uuid references public.modules (id) on delete cascade,
  source_type text not null check (source_type in ('transcript', 'playbook', 'template', 'faq')),
  content text not null,
  search_vector tsvector generated always as (to_tsvector('english', content)) stored,
  embedding vector(384),
  created_at timestamptz not null default now()
);
create index content_chunks_search_idx on public.content_chunks using gin (search_vector);
create index content_chunks_course_id_idx on public.content_chunks (course_id);

create or replace function public.match_content_chunks(query_text text, p_course_id uuid, match_count integer default 5)
returns table (id uuid, content text, source_type text, rank real)
language sql
stable
as $$
  select id, content, source_type, ts_rank(search_vector, websearch_to_tsquery('english', query_text)) as rank
  from public.content_chunks
  where (p_course_id is null or course_id = p_course_id)
    and search_vector @@ websearch_to_tsquery('english', query_text)
  order by rank desc
  limit match_count
$$;

-- ── Row Level Security ─────────────────────────────────────────────────

alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.courses enable row level security;
alter table public.modules enable row level security;
alter table public.recommendations enable row level security;
alter table public.enrollments enable row level security;
alter table public.progress enable row level security;
alter table public.templates enable row level security;
alter table public.playbooks enable row level security;
alter table public.sessions enable row level security;
alter table public.case_studies enable row level security;
alter table public.support_tickets enable row level security;
alter table public.announcements enable row level security;
alter table public.content_chunks enable row level security;

-- users: read/update own row; admin reads all
create policy "users_select_own_or_admin" on public.users
  for select using (clerk_id = public.current_clerk_id() or public.is_admin());
create policy "users_update_own_or_admin" on public.users
  for update using (clerk_id = public.current_clerk_id() or public.is_admin());
create policy "users_insert_admin" on public.users
  for insert with check (public.is_admin());

-- profiles: owner + admin
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (user_id = public.current_user_id() or public.is_admin());
create policy "profiles_insert_own_or_admin" on public.profiles
  for insert with check (user_id = public.current_user_id() or public.is_admin());
create policy "profiles_update_own_or_admin" on public.profiles
  for update using (user_id = public.current_user_id() or public.is_admin());

-- leads: anyone can register (public webinar form); only admin reads
create policy "leads_insert_public" on public.leads
  for insert with check (true);
create policy "leads_select_admin" on public.leads
  for select using (public.is_admin());

-- courses: public catalog
create policy "courses_select_public" on public.courses
  for select using (true);
create policy "courses_write_admin" on public.courses
  for all using (public.is_admin()) with check (public.is_admin());

-- modules: gated behind an active enrollment (this is the paid content)
create policy "modules_select_enrolled_or_admin" on public.modules
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.enrollments e
      where e.course_id = modules.course_id
        and e.user_id = public.current_user_id()
        and e.status = 'active'
    )
  );
create policy "modules_write_admin" on public.modules
  for all using (public.is_admin()) with check (public.is_admin());

-- recommendations: owner + admin
create policy "recommendations_select_own_or_admin" on public.recommendations
  for select using (user_id = public.current_user_id() or public.is_admin());
create policy "recommendations_write_admin" on public.recommendations
  for all using (public.is_admin()) with check (public.is_admin());

-- enrollments: owner reads own; admin full access
create policy "enrollments_select_own_or_admin" on public.enrollments
  for select using (user_id = public.current_user_id() or public.is_admin());
create policy "enrollments_write_admin" on public.enrollments
  for all using (public.is_admin()) with check (public.is_admin());

-- progress: owner manages own progress; admin reads all
create policy "progress_select_own_or_admin" on public.progress
  for select using (user_id = public.current_user_id() or public.is_admin());
create policy "progress_insert_own" on public.progress
  for insert with check (user_id = public.current_user_id());
create policy "progress_update_own_or_admin" on public.progress
  for update using (user_id = public.current_user_id() or public.is_admin());

-- templates / playbooks: gated behind the parent course's active enrollment
create policy "templates_select_enrolled_or_admin" on public.templates
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.modules m
      join public.enrollments e on e.course_id = m.course_id
      where m.id = templates.module_id
        and e.user_id = public.current_user_id()
        and e.status = 'active'
    )
  );
create policy "templates_write_admin" on public.templates
  for all using (public.is_admin()) with check (public.is_admin());

create policy "playbooks_select_enrolled_or_admin" on public.playbooks
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.enrollments e
      where e.course_id = playbooks.course_id
        and e.user_id = public.current_user_id()
        and e.status = 'active'
    )
  );
create policy "playbooks_write_admin" on public.playbooks
  for all using (public.is_admin()) with check (public.is_admin());

-- sessions: owner + admin
create policy "sessions_select_own_or_admin" on public.sessions
  for select using (user_id = public.current_user_id() or public.is_admin());
create policy "sessions_write_admin" on public.sessions
  for all using (public.is_admin()) with check (public.is_admin());

-- case studies: public marketing content
create policy "case_studies_select_public" on public.case_studies
  for select using (true);
create policy "case_studies_write_admin" on public.case_studies
  for all using (public.is_admin()) with check (public.is_admin());

-- support tickets: owner creates/reads own; admin manages all
create policy "support_tickets_select_own_or_admin" on public.support_tickets
  for select using (user_id = public.current_user_id() or public.is_admin());
create policy "support_tickets_insert_own" on public.support_tickets
  for insert with check (user_id = public.current_user_id());
create policy "support_tickets_update_admin" on public.support_tickets
  for update using (public.is_admin());

-- announcements: readable by any enrolled student (community tier) + admin
create policy "announcements_select_enrolled_or_admin" on public.announcements
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.enrollments e
      where e.user_id = public.current_user_id() and e.status = 'active'
    )
  );
create policy "announcements_write_admin" on public.announcements
  for all using (public.is_admin()) with check (public.is_admin());

-- content_chunks: internal RAG source data, admin + service role only
create policy "content_chunks_select_admin" on public.content_chunks
  for select using (public.is_admin());
create policy "content_chunks_write_admin" on public.content_chunks
  for all using (public.is_admin()) with check (public.is_admin());
