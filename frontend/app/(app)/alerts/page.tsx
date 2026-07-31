'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { listAlerts, type AlertRecord } from '@/lib/api';
import { Pagination } from '@/components/Pagination';
import { BellIcon, ShieldIcon, GlobeIcon } from '@/components/icons';

const PAGE_SIZE = 20;

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (targetPage: number) => {
    setLoading(true);
    try {
      const res = await listAlerts(targetPage, PAGE_SIZE);
      setAlerts(res.alerts);
      setTotal(res.total);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh(page);
  }, [page, refresh]);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-xl font-semibold tracking-tight text-white">Alerts</h1>
      <p className="mb-6 text-sm text-slate-400">Every expiry email that&apos;s been sent to you.</p>

      {loading && <p className="text-sm text-slate-400">Loading…</p>}

      {error && (
        <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400 ring-1 ring-inset ring-red-500/20">
          {error}
        </p>
      )}

      {!loading && !error && alerts.length === 0 && (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 px-6 py-14 text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 text-slate-500">
            <BellIcon className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-slate-200">No alerts sent yet</p>
          <p className="mt-1 text-sm text-slate-400">
            You&apos;ll see a record here every time we email you about an upcoming expiry.
          </p>
        </div>
      )}

      {!loading && !error && alerts.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
          <div className="grid grid-cols-[1fr,140px,140px,180px] gap-4 border-b border-slate-800 px-5 py-2.5 text-xs font-medium uppercase tracking-wide text-slate-500">
            <span>Domain</span>
            <span>Type</span>
            <span>Threshold</span>
            <span>Sent</span>
          </div>
          <div className="divide-y divide-slate-800/80">
            {alerts.map((a) => (
              <div key={a.id} className="grid grid-cols-[1fr,140px,140px,180px] items-center gap-4 px-5 py-3.5">
                <Link href={`/domains/${a.domain_id}`} className="truncate text-sm font-medium text-slate-100 hover:underline">
                  {a.domain}
                </Link>
                <span className="inline-flex items-center gap-1.5 text-sm text-slate-300">
                  {a.alert_type === 'ssl' ? (
                    <ShieldIcon className="h-3.5 w-3.5 text-slate-500" />
                  ) : (
                    <GlobeIcon className="h-3.5 w-3.5 text-slate-500" />
                  )}
                  {a.alert_type === 'ssl' ? 'SSL' : 'Registration'}
                </span>
                <span className="text-sm text-slate-300">{a.threshold_days}-day notice</span>
                <span className="text-xs text-slate-500">{new Date(a.sent_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
