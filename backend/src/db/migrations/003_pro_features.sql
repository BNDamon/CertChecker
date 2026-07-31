-- Adds the data needed for Pro-tier features: custom alert thresholds,
-- webhook/Slack notifications, and shareable public status pages.

alter table public.users
  add column if not exists webhook_url text,
  add column if not exists alert_thresholds integer[];

alter table public.tracked_domains
  add column if not exists share_token uuid unique;

create index if not exists tracked_domains_share_token_idx on public.tracked_domains (share_token);

-- sent_alerts.threshold_days was locked to the fixed default thresholds
-- (30/14/7/1). Pro users can pick their own days-out values now, so replace
-- the fixed-list check with a sane range instead.
alter table public.sent_alerts drop constraint if exists sent_alerts_threshold_days_check;
alter table public.sent_alerts add constraint sent_alerts_threshold_days_check
  check (threshold_days > 0 and threshold_days <= 365);
