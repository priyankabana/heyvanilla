-- ============================================================================
-- HeyVanilla — Supabase schema
-- don't melt, Vanilla. you got this.
--
-- Paste this whole file into the Supabase SQL editor and run it once.
-- Every table has Row Level Security ON and a policy that locks each row to
-- its owner (user_id = auth.uid()). There is no way to read another user's
-- data, even with direct database access.
-- ============================================================================

-- Helpful enums ---------------------------------------------------------------
do $$ begin
  create type frequency_type as enum ('daily', 'weekly', 'custom');
exception when duplicate_object then null; end $$;

do $$ begin
  create type task_priority as enum ('low', 'medium', 'high');
exception when duplicate_object then null; end $$;

do $$ begin
  create type journal_type as enum ('gratitude', 'reflection', 'free');
exception when duplicate_object then null; end $$;

do $$ begin
  create type media_type as enum ('movie', 'show', 'book');
exception when duplicate_object then null; end $$;

do $$ begin
  create type wishlist_type as enum ('wish', 'bucket');
exception when duplicate_object then null; end $$;

-- ============================================================================
-- 1. users_profile  (extends auth.users)
-- ============================================================================
create table if not exists public.users_profile (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  avatar_url text,
  timezone text default 'Asia/Kolkata',
  theme text not null default 'auto' check (theme in ('light', 'dark', 'auto')),
  aesthetic text not null default 'princess-barbie',
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users_profile (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', null));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- 2. habits  +  habit_logs
-- ============================================================================
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  icon text,
  color text,
  frequency_type frequency_type not null default 'daily',
  frequency_days int[] default '{}',          -- 0=Sun .. 6=Sat for weekly/custom
  reminder_time time,
  start_date date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  habit_id uuid not null references public.habits (id) on delete cascade,
  date date not null,
  completed boolean not null default true,
  unique (habit_id, date)
);

-- ============================================================================
-- 3. tasks
-- ============================================================================
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  due_date date,
  priority task_priority not null default 'medium',
  category text,
  completed boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 4. journal_entries
-- ============================================================================
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type journal_type not null default 'free',
  content jsonb not null default '{}'::jsonb,
  mood text,
  tags text[] default '{}',
  photo_url text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 5. notes
-- ============================================================================
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  content text not null default '',
  color text,
  pinned boolean not null default false,
  checklist boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 6. finance  (bills / income / expenses)
-- ============================================================================
create table if not exists public.finance_bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  amount numeric(12, 2) not null default 0,
  due_date date,
  status text not null default 'pending',
  recurring boolean not null default false,
  frequency text
);

create table if not exists public.finance_income (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  source text not null,
  amount numeric(12, 2) not null default 0,
  date date not null default current_date,
  category text
);

create table if not exists public.finance_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null,
  amount numeric(12, 2) not null default 0,
  date date not null default current_date,
  note text
);

-- ============================================================================
-- 7. goals
-- ============================================================================
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  deadline date,
  progress_percent int not null default 0 check (progress_percent between 0 and 100),
  why_matters text,
  subtasks jsonb not null default '[]'::jsonb,
  completed boolean not null default false
);

-- ============================================================================
-- 8. wishlist  (wishes + bucket list)
-- ============================================================================
create table if not exists public.wishlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  price numeric(12, 2),
  link text,
  image_url text,
  priority text,
  purchased boolean not null default false,
  type wishlist_type not null default 'wish'
);

-- ============================================================================
-- 9. media  (movies / shows / books)
-- ============================================================================
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  type media_type not null,
  status text,
  rating int check (rating between 1 and 5),
  review text,
  poster_url text,
  progress int,
  author text
);

-- ============================================================================
-- 10. health  (water / sleep / diet)
-- ============================================================================
create table if not exists public.health_water (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null default current_date,
  amount_ml int not null default 0,
  goal_ml int not null default 2500,
  unique (user_id, date)
);

create table if not exists public.health_sleep (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null default current_date,
  bedtime time,
  wake_time time,
  quality int check (quality between 1 and 5)
);

create table if not exists public.health_diet (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null default current_date,
  meal_type text,
  food_name text,
  photo_url text
);

-- ============================================================================
-- 11. study_sessions
-- ============================================================================
create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject text not null,
  duration_mins int not null default 0,
  topic text,
  date date not null default current_date
);

-- ============================================================================
-- 12. vision_board
-- ============================================================================
create table if not exists public.vision_board (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  image_url text not null,
  caption text,
  position jsonb not null default '{}'::jsonb,
  board_name text not null default 'My Vision'
);

-- ============================================================================
-- 13. mood_log
-- ============================================================================
create table if not exists public.mood_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null default current_date,
  mood text not null check (mood in ('happy', 'mid', 'sad', 'anxious', 'blessed')),
  note text,
  unique (user_id, date)
);

-- ============================================================================
-- 14. achievements
-- ============================================================================
create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  badge_key text not null,
  unlocked_at timestamptz not null default now(),
  unique (user_id, badge_key)
);

-- ============================================================================
-- 15. widget_layout
-- ============================================================================
create table if not exists public.widget_layout (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade unique,
  layout jsonb not null default '[]'::jsonb
);

-- ============================================================================
-- Indexes for the queries the app actually runs
-- ============================================================================
create index if not exists idx_habits_user on public.habits (user_id);
create index if not exists idx_habit_logs_user_date on public.habit_logs (user_id, date);
create index if not exists idx_tasks_user_due on public.tasks (user_id, due_date);
create index if not exists idx_journal_user_created on public.journal_entries (user_id, created_at);
create index if not exists idx_notes_user on public.notes (user_id);
create index if not exists idx_expenses_user_date on public.finance_expenses (user_id, date);
create index if not exists idx_mood_user_date on public.mood_log (user_id, date);

-- ============================================================================
-- Row Level Security — turn it on everywhere, then add owner-only policies.
-- Done in a loop so we never forget a table.
-- ============================================================================
do $$
declare
  t text;
  owned_tables text[] := array[
    'users_profile','habits','habit_logs','tasks','journal_entries','notes',
    'finance_bills','finance_income','finance_expenses','goals','wishlist',
    'media','health_water','health_sleep','health_diet','study_sessions',
    'vision_board','mood_log','achievements','widget_layout'
  ];
begin
  foreach t in array owned_tables loop
    execute format('alter table public.%I enable row level security;', t);

    -- users_profile keys on id; everything else on user_id.
    if t = 'users_profile' then
      execute format($f$
        drop policy if exists "own_select" on public.%1$I;
        drop policy if exists "own_insert" on public.%1$I;
        drop policy if exists "own_update" on public.%1$I;
        drop policy if exists "own_delete" on public.%1$I;
        create policy "own_select" on public.%1$I for select using (auth.uid() = id);
        create policy "own_insert" on public.%1$I for insert with check (auth.uid() = id);
        create policy "own_update" on public.%1$I for update using (auth.uid() = id) with check (auth.uid() = id);
        create policy "own_delete" on public.%1$I for delete using (auth.uid() = id);
      $f$, t);
    else
      execute format($f$
        drop policy if exists "own_select" on public.%1$I;
        drop policy if exists "own_insert" on public.%1$I;
        drop policy if exists "own_update" on public.%1$I;
        drop policy if exists "own_delete" on public.%1$I;
        create policy "own_select" on public.%1$I for select using (auth.uid() = user_id);
        create policy "own_insert" on public.%1$I for insert with check (auth.uid() = user_id);
        create policy "own_update" on public.%1$I for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
        create policy "own_delete" on public.%1$I for delete using (auth.uid() = user_id);
      $f$, t);
    end if;
  end loop;
end $$;

-- ============================================================================
-- Realtime — broadcast changes on the tables the app subscribes to.
-- ============================================================================
do $$
begin
  alter publication supabase_realtime add table public.habit_logs;
  alter publication supabase_realtime add table public.tasks;
  alter publication supabase_realtime add table public.widget_layout;
  alter publication supabase_realtime add table public.health_water;
exception when duplicate_object then null; end $$;

-- ============================================================================
-- Storage bucket for uploads (avatars, vision board, journal photos).
-- Files are namespaced by user id; policies keep each user in their folder.
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', false)
on conflict (id) do nothing;

drop policy if exists "uploads_own_read" on storage.objects;
drop policy if exists "uploads_own_write" on storage.objects;
drop policy if exists "uploads_own_delete" on storage.objects;

create policy "uploads_own_read" on storage.objects
  for select using (
    bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "uploads_own_write" on storage.objects
  for insert with check (
    bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "uploads_own_delete" on storage.objects
  for delete using (
    bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text
  );
