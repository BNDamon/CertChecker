export const DEFAULT_ALERT_THRESHOLDS_DAYS = [30, 14, 7, 1] as const;

export const MAX_CUSTOM_THRESHOLDS = 8;

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
 *
 * `thresholds` defaults to DEFAULT_ALERT_THRESHOLDS_DAYS but Pro users can
 * supply their own custom set (see users.alert_thresholds).
 */
export function unsentCrossedThresholds(
  days: number,
  alreadySent: ReadonlySet<number>,
  thresholds: readonly number[] = DEFAULT_ALERT_THRESHOLDS_DAYS
): number[] {
  if (days < 0) return []; // already expired -- handled as its own case, not a threshold alert
  return thresholds.filter((threshold) => days <= threshold && !alreadySent.has(threshold));
}

/**
 * Validates and normalizes a user-supplied threshold list: integers only,
 * 1-365 days, deduped, capped at MAX_CUSTOM_THRESHOLDS, sorted descending
 * (largest/least-urgent first, matching the default list's convention).
 */
export function normalizeThresholds(raw: unknown): number[] | null {
  if (!Array.isArray(raw)) return null;
  const cleaned = Array.from(
    new Set(
      raw
        .map((v) => (typeof v === 'number' ? v : Number(v)))
        .filter((v) => Number.isInteger(v) && v > 0 && v <= 365)
    )
  );
  if (cleaned.length === 0 || cleaned.length > MAX_CUSTOM_THRESHOLDS) return null;
  return cleaned.sort((a, b) => b - a);
}
