-- Run in Supabase: SQL Editor > New query > Run
-- Safe to run more than once.
create table if not exists public.letters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('me','friend')),
  recipient_name text,
  recipient_email text,
  body text not null,
  emailed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.letters enable row level security;

-- Each person can only see and manage their own letters
drop policy if exists "read own letters" on public.letters;
create policy "read own letters" on public.letters for select using (auth.uid() = user_id);

drop policy if exists "insert own letters" on public.letters;
create policy "insert own letters" on public.letters for insert with check (auth.uid() = user_id);

drop policy if exists "delete own letters" on public.letters;
create policy "delete own letters" on public.letters for delete using (auth.uid() = user_id);

drop policy if exists "update email status own" on public.letters;
create policy "update email status own" on public.letters for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- The Edge Function only needs to set delivery metadata, not edit letter contents.
revoke update on public.letters from authenticated;
grant update (emailed_at) on public.letters to authenticated;

-- Faster archive listing (newest first, per user)
create index if not exists letters_user_created_idx
  on public.letters (user_id, created_at desc);
