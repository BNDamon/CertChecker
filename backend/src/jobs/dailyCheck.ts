import cron from 'node-cron';
import { pool } from '../db/pool';
import { env } from '../config/env';
import { checkOneDomain, type TrackedDomainRow } from '../services/checkDomain';

export async function runDailyCheck(): Promise<void> {
  console.log(`[dailyCheck] starting run at ${new Date().toISOString()}`);

  const { rows } = await pool.query<TrackedDomainRow>(
    `select d.id, d.domain, d.user_id, u.email, u.subscription_status, u.webhook_url, u.alert_thresholds, u.alert_recipients
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
