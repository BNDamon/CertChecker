import cron from 'node-cron';
import { pool } from '../db/pool';
import { env } from '../config/env';
import { checkSslExpiry } from '../services/sslCheck';
import { checkDomainExpiry } from '../services/whoisCheck';
import { sendExpiryAlert } from '../services/email';
import { sendWebhookAlert } from '../services/webhook';
import { daysRemaining, unsentCrossedThresholds, DEFAULT_ALERT_THRESHOLDS_DAYS } from '../services/thresholds';

interface TrackedDomainRow {
  id: string;
  domain: string;
  user_id: string;
  email: string;
  subscription_status: string;
  webhook_url: string | null;
  alert_thresholds: number[] | null;
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

async function maybeAlert(
  domain: TrackedDomainRow,
  alertType: 'ssl' | 'domain',
  expiryDate: Date | null
) {
  if (!expiryDate) return;

  // Custom thresholds are a Pro perk -- free-tier users (or Pro users who
  // haven't set any) fall back to the default 30/14/7/1 schedule.
  const isPro = domain.subscription_status === 'active';
  const thresholds =
    isPro && domain.alert_thresholds && domain.alert_thresholds.length > 0
      ? domain.alert_thresholds
      : DEFAULT_ALERT_THRESHOLDS_DAYS;

  const days = daysRemaining(expiryDate);
  const alreadySent = await getAlreadySentThresholds(domain.id, alertType);
  const toSend = unsentCrossedThresholds(days, alreadySent, thresholds);

  for (const thresholdDays of toSend) {
    await sendExpiryAlert({
      to: domain.email,
      domain: domain.domain,
      kind: alertType,
      expiryDate,
      daysRemaining: days,
      thresholdDays,
    });

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
        console.error(`[dailyCheck] webhook failed for ${domain.domain}:`, err);
      }
    }

    await recordAlertSent(domain.id, alertType, thresholdDays);
  }
}

async function checkOneDomain(domain: TrackedDomainRow): Promise<void> {
  const [ssl, whois] = await Promise.all([
    checkSslExpiry(domain.domain),
    checkDomainExpiry(domain.domain),
  ]);

  await pool.query(
    `insert into public.check_results
       (domain_id, ssl_expiry_date, domain_expiry_date, ssl_status, domain_status)
     values ($1, $2, $3, $4, $5)`,
    [domain.id, ssl.expiryDate, whois.expiryDate, ssl.status, whois.status]
  );

  await maybeAlert(domain, 'ssl', ssl.expiryDate);
  await maybeAlert(domain, 'domain', whois.expiryDate);
}

export async function runDailyCheck(): Promise<void> {
  console.log(`[dailyCheck] starting run at ${new Date().toISOString()}`);

  const { rows } = await pool.query<TrackedDomainRow>(
    `select d.id, d.domain, d.user_id, u.email, u.subscription_status, u.webhook_url, u.alert_thresholds
     from public.tracked_domains d
     join public.users u on u.id = d.user_id`
  );

  console.log(`[dailyCheck] checking ${rows.length} domain(s)`);

  // Sequential on purpose: WHOIS servers commonly rate-limit or block bursts
  // of concurrent queries from a single IP, so we trade run time for not
  // getting the app's IP temporarily blocked.
  for (const domain of rows) {
    try {
      await checkOneDomain(domain);
    } catch (err) {
      console.error(`[dailyCheck] failed for ${domain.domain}:`, err);
    }
  }

  console.log(`[dailyCheck] finished run at ${new Date().toISOString()}`);
}

export function scheduleDailyCheck(): void {
  cron.schedule(env.checkCronSchedule, () => {
    runDailyCheck().catch((err) => console.error('[dailyCheck] unhandled error', err));
  });
  console.log(`[dailyCheck] scheduled with cron "${env.checkCronSchedule}"`);
}

// Allows `npm run check:once` to run a single pass manually without waiting
// for the cron schedule -- useful for local testing end-to-end.
if (require.main === module) {
  runDailyCheck()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
