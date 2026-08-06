import { pool } from '../db/pool';
import { checkSslExpiry } from './sslCheck';
import { checkDomainExpiry } from './whoisCheck';
import { sendExpiryAlert } from './email';
import { sendWebhookAlert } from './webhook';
import { daysRemaining, unsentCrossedThresholds, DEFAULT_ALERT_THRESHOLDS_DAYS } from './thresholds';

export interface TrackedDomainRow {
  id: string;
  domain: string;
  user_id: string;
  email: string;
  subscription_status: string;
  webhook_url: string | null;
  alert_thresholds: number[] | null;
  alert_recipients: string[] | null;
}

async function getAlreadySentThresholds(domainId: string, alertType: 'ssl' | 'domain'): Promise<Set<number>> {
  const { rows } = await pool.query(
    `select threshold_days from public.sent_alerts where domain_id = $1 and alert_type = $2`,
    [domainId, alertType]
  );
  return new Set(rows.map((r) => r.threshold_days));
}

async function recordAlertSent(domainId: string, alertType: 'ssl' | 'domain', thresholdDays: number) {
  await pool.query(
    `insert into public.sent_alerts (domain_id, alert_type, threshold_days)
     values ($1, $2, $3)
     on conflict (domain_id, alert_type, threshold_days) do nothing`,
    [domainId, alertType, thresholdDays]
  );
}

async function maybeAlert(domain: TrackedDomainRow, alertType: 'ssl' | 'domain', expiryDate: Date | null) {
  if (!expiryDate) return;

  // Custom thresholds and extra recipients are Pro perks -- free-tier users
  // (or Pro users who haven't set any) fall back to the default 30/14/7/1
  // schedule and just the account owner's email.
  const isPro = domain.subscription_status === 'active';
  const thresholds =
    isPro && domain.alert_thresholds && domain.alert_thresholds.length > 0
      ? domain.alert_thresholds
      : DEFAULT_ALERT_THRESHOLDS_DAYS;
  const recipients =
    isPro && domain.alert_recipients && domain.alert_recipients.length > 0
      ? [domain.email, ...domain.alert_recipients]
      : [domain.email];

  const days = daysRemaining(expiryDate);
  const alreadySent = await getAlreadySentThresholds(domain.id, alertType);
  const toSend = unsentCrossedThresholds(days, alreadySent, thresholds);

  for (const thresholdDays of toSend) {
    for (const to of recipients) {
      await sendExpiryAlert({
        to,
        domain: domain.domain,
        kind: alertType,
        expiryDate,
        daysRemaining: days,
        thresholdDays,
      });
    }

    if (isPro && domain.webhook_url) {
      try {
        await sendWebhookAlert({
          url: domain.webhook_url,
          domain: domain.domain,
          kind: alertType,
          expiryDate,
          daysRemaining: days,
          thresholdDays,
        });
      } catch (err) {
        // A broken webhook shouldn't stop the email alert (already sent
        // above) from being recorded -- log and move on.
        console.error(`[check] webhook failed for ${domain.domain}:`, err);
      }
    }

    await recordAlertSent(domain.id, alertType, thresholdDays);
  }
}

export async function checkOneDomain(domain: TrackedDomainRow): Promise<void> {
  const [ssl, whois] = await Promise.all([checkSslExpiry(domain.domain), checkDomainExpiry(domain.domain)]);

  await pool.query(
    `insert into public.check_results
       (domain_id, ssl_expiry_date, domain_expiry_date, ssl_status, domain_status)
     values ($1, $2, $3, $4, $5)`,
    [domain.id, ssl.expiryDate, whois.expiryDate, ssl.status, whois.status]
  );

  await maybeAlert(domain, 'ssl', ssl.expiryDate);
  await maybeAlert(domain, 'domain', whois.expiryDate);
}
