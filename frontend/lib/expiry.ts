export type UrgencyTone = 'ok' | 'warning' | 'danger' | 'expired' | 'unknown';

export function daysUntil(dateString: string | null): number | null {
  if (!dateString) return null;
  const ms = new Date(dateString).getTime() - Date.now();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export function urgencyTone(days: number | null): UrgencyTone {
  if (days === null) return 'unknown';
  if (days < 0) return 'expired';
  if (days <= 7) return 'danger';
  if (days <= 30) return 'warning';
  return 'ok';
}

export function formatCountdown(days: number | null): string {
  if (days === null) return 'Unknown';
  if (days < 0) return `Expired ${Math.abs(days)}d ago`;
  if (days === 0) return 'Expires today';
  return `${days}d left`;
}
