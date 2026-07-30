-- Run this in the Supabase SQL editor (or via `psql $DATABASE_URL -f 001_init.sql`).
-- Requires pgcrypto for gen_random_uuid() -- Supabase projects have this enabled by default.

create extension if not exists pgcrypto;

-- Mirrors auth.users (Supabase-managed). One row per signed-up user.
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  stripe_customer_id text,
  subscription_status text not null default 'free' check (subscription_status in ('free', 'active', 'past_due', 'canceled')),
  created_at timestamptz not null default now()
);

create table if not exists public.tracked_domains (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  domain text not null,
  added_at timestamptz not null default now(),
  unique (user_id, domain)
);

create index if not exists tracked_domains_user_id_idx on public.tracked_domains (user_id);

create table if not exists public.check_results (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid not null references public.tracked_domains (id) on delete cascade,
  checked_at timestamptz not null default now(),
  ssl_expiry_date timestamptz,
  domain_expiry_date timestamptz,
  ssl_status text not null check (ssl_status in ('ok', 'expired', 'error')),
  domain_status text not null check (domain_status in ('ok', 'expired', 'error', 'unknown'))
);

create index if not exists check_results_domain_id_idx on public.check_results (domain_id);
create index if not exists check_results_checked_at_idx on public.check_results (checked_at desc);

-- Tracks which (domain, alert type, threshold) combinations have already been emailed,
-- so the daily job doesn't re-send the same 30/14/7/1-day alert on every run.
create table if not exists public.sent_alerts (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid not null references public.tracked_domains (id) on delete cascade,
  alert_type text not null check (alert_type in ('ssl', 'domain')),
  threshold_days integer not null check (threshold_days in (30, 14, 7, 1)),
  sent_at timestamptz not null default now(),
  unique (domain_id, alert_type, threshold_days)
);

-- Row Level Security: defense in depth. The backend connects with a service-role
-- style connection string and filters by user_id in application code, but enabling
-- RLS means a leaked anon key can never read another user's rows directly from
-- Supabase's auto-generated REST/PostgREST API.
alter table public.users enable row level security;
alter table public.tracked_domains enable row level security;
alter table public.check_results enable row level security;
alter table public.sent_alerts enable row level security;

create policy "Users can view their own row" on public.users
  for select using (auth.uid() = id);

create policy "Users can view their own domains" on public.tracked_domains
  for select using (auth.uid() = user_id);

create policy "Users can view results for their own domains" on public.check_results
  for select using (
    exists (
      select 1 from public.tracked_domains d
      where d.id = check_results.domain_id and d.user_id = auth.uid()
    )
  );
