'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { listAlerts, type AlertRecord } from '@/lib/api';
import { BellIcon } from './icons';

function thresholdLabel(a: AlertRecord) {
  const kind = a.alert_type === 'ssl' ? 'SSL' : 'Registration';
  return `${kind} · ${a.threshold_days}d · ${new Date(a.sent_at).toLocaleDateString()}`;
}

export function RecentAlertsPanel() {
  const [alerts, setAlerts] = useState<AlertRecord[] | null>(null);

  useEffect(() => {
    listAlerts(1, 6)
      .then((res) => setAlerts(res.alerts))
      .catch(() => setAlerts([]));
  }, []);

  return (
    <aside className="hidden w-64 shrink-0 lg:block">
      <div className="sticky top-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="mb-3 flex items-center gap-2">
          <BellIcon className="h-4 w-4 text-slate-400" />
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Recent alerts</h2>
        </div>

        {alerts === null ? (
          <p className="text-xs text-slate-500">Loading…</p>
        ) : alerts.length === 0 ? (
          <p className="text-xs text-slate-500">No alerts sent yet.</p>
        ) : (
          <ul className="space-y-3">
            {alerts.map((a) => (
              <li key={a.id} className="border-b border-slate-800/80 pb-3 last:border-0 last:pb-0">
                <Link href={`/domains/${a.domain_id}`} className="text-xs font-medium text-slate-200 hover:text-accent-300">
                  {a.domain}
                </Link>
                <p className="mt-0.5 text-[11px] text-slate-500">{thresholdLabel(a)}</p>
              </li>
            ))}
          </ul>
        )}

        <Link href="/alerts" className="mt-3 block text-xs text-accent-400 hover:text-accent-300">
          View all →
        </Link>
      </div>
    </aside>
  );
}
