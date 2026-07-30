export const ALERT_THRESHOLDS_DAYS = [30, 14, 7, 1] as const;
export type ThresholdDays = (typeof ALERT_THRESHOLDS_DAYS)[number];

export function daysRemaining(expiryDate: Date, now: Date = new Date()): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((expiryDate.getTime() - now.getTime()) / msPerDay);
}

/**
 * Returns every threshold that `days` has crossed (<=) and that isn't already
 * in `alreadySent`. Checking "crossed and not yet sent" rather than "days
 * equals threshold exactly" means a missed cron run (downtime, deploy) still
 * catches up correctly instead of silently skipping a threshold -- e.g. if
 * the job doesn't run between day 14 and day 7, the next run at day 5 sends
 * both the 14-day and 7-day alerts it missed, not just whichever is closest.
 * The sent_alerts unique constraint is what makes re-running this safe.
 */
export function unsentCrossedThresholds(
  days: number,
  alreadySent: ReadonlySet<number>
): ThresholdDays[] {
  if (days < 0) return []; // already expired -- handled as its own case, not a threshold alert
  return ALERT_THRESHOLDS_DAYS.filter((threshold) => days <= threshold && !alreadySent.has(threshold));
}
