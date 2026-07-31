-- Optional per-domain label (e.g. a client/company name) so agencies tracking
-- many domains can tell at a glance whose site is whose.

alter table public.tracked_domains
  add column if not exists label text;
