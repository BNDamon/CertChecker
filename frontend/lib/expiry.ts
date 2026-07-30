export function daysUntil(dateString: string | null): number | null {
  if (!dateString) return null;
  const ms = new Date(dateString).getTime() - Date.now();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export function urgencyClasses(days: number | null): string {
  if (days === null) return 'text-gray-400';
  if (days < 0) return 'text-red-700 font-semibold';
  if (days <= 7) return 'text-red-600 font-semibold';
  if (days <= 30) return 'text-amber-600 font-medium';
  return 'text-green-600';
}

export function formatCountdown(days: number | null): string {
  if (days === null) return 'Unknown';
  if (days < 0) return `Expired ${Math.abs(days)}d ago`;
  if (days === 0) return 'Expires today';
  return `${days}d left`;
}
