-- Adds data for three more Pro features: multiple alert recipients,
-- white-label public status pages, and personal API keys.

alter table public.users
  add column if not exists alert_recipients text[],
  add column if not exists brand_name text,
  add column if not exists api_key text unique;

create index if not exists users_api_key_idx on public.users (api_key);
