-- Run in Supabase: SQL Editor > New query > Run
create table public.letters (
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
create policy "read own letters"   on public.letters for select using (auth.uid() = user_id);
create policy "insert own letters" on public.letters for insert with check (auth.uid() = user_id);
create policy "delete own letters" on public.letters for delete using (auth.uid() = user_id);
