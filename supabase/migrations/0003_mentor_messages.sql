-- Chat history + per-user rate limiting for the AI mentor. Not in the
-- original SRS table list — added because "rate-limited per user" and a
-- usable chat widget both need somewhere to persist turns (see DECISIONS.md).

create table public.mentor_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  course_id uuid references public.courses (id) on delete set null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);
create index mentor_messages_user_id_idx on public.mentor_messages (user_id, created_at);

alter table public.mentor_messages enable row level security;

create policy "mentor_messages_select_own_or_admin" on public.mentor_messages
  for select using (user_id = public.current_user_id() or public.is_admin());
create policy "mentor_messages_insert_own" on public.mentor_messages
  for insert with check (user_id = public.current_user_id());
