-- Career-E schema (Supabase Auth + app tables)
-- Run once in the Supabase SQL Editor after creating the project.
-- Auth passwords/sessions live in auth.users (managed by Supabase).

-- ── App profile (1:1 with auth.users) — no passwords here ───────────────────
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  search_count int not null default 0,
  search_period_start timestamptz not null default now(),
  search_limit int not null default 20,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── personality (1:1) ───────────────────────────────────────────────────────
create table if not exists public.personality (
  user_id uuid primary key references public.users(id) on delete cascade,
  profile jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ── engagement (1:N) — newsletter / focusGroup / demo opt-ins ───────────────
create table if not exists public.engagement (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  kind text not null,
  opted_in boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, kind)
);

create index if not exists engagement_user_id_idx on public.engagement(user_id);
create index if not exists engagement_kind_idx on public.engagement(kind);

-- ── favourites (1:N) ────────────────────────────────────────────────────────
create table if not exists public.favourites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  career_id text not null,
  career jsonb not null,
  saved_at timestamptz not null default now(),
  unique (user_id, career_id)
);

create index if not exists favourites_user_id_idx on public.favourites(user_id);

-- ── recent_searches (1:N) ───────────────────────────────────────────────────
create table if not exists public.recent_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  provider text not null,
  confidence_percent int,
  active_variables text,
  generation_time_ms int,
  careers jsonb not null default '[]'::jsonb,
  payload jsonb not null default '{}'::jsonb
);

create index if not exists recent_searches_user_created_idx
  on public.recent_searches (user_id, created_at desc);

-- ── Auto-create profile + personality + engagement on Auth signup ───────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', '')
  );

  insert into public.personality (user_id, profile)
  values (new.id, '{}'::jsonb);

  insert into public.engagement (user_id, kind, opted_in)
  select
    new.id,
    value,
    true
  from jsonb_array_elements_text(
    coalesce(new.raw_user_meta_data->'engagement', '[]'::jsonb)
  ) as t(value)
  on conflict (user_id, kind) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.users enable row level security;
alter table public.personality enable row level security;
alter table public.engagement enable row level security;
alter table public.favourites enable row level security;
alter table public.recent_searches enable row level security;

drop policy if exists "users_select_own" on public.users;
drop policy if exists "users_update_own" on public.users;
drop policy if exists "personality_select_own" on public.personality;
drop policy if exists "personality_insert_own" on public.personality;
drop policy if exists "personality_update_own" on public.personality;
drop policy if exists "engagement_all_own" on public.engagement;
drop policy if exists "favourites_all_own" on public.favourites;
drop policy if exists "recent_searches_all_own" on public.recent_searches;

create policy "users_select_own" on public.users
  for select using (auth.uid() = id);
create policy "users_update_own" on public.users
  for update using (auth.uid() = id);

create policy "personality_select_own" on public.personality
  for select using (auth.uid() = user_id);
create policy "personality_insert_own" on public.personality
  for insert with check (auth.uid() = user_id);
create policy "personality_update_own" on public.personality
  for update using (auth.uid() = user_id);

create policy "engagement_all_own" on public.engagement
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "favourites_all_own" on public.favourites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "recent_searches_all_own" on public.recent_searches
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
