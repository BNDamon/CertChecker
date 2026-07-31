'use client';

import { useEffect, useState } from 'react';
import { getDomainStats, getAlertTrend, type DomainStats, type AlertTrendDay } from '@/lib/api';
import { HealthBreakdownChart } from '@/components/charts/HealthBreakdownChart';
import { AlertTrendChart } from '@/components/charts/AlertTrendChart';

export default function OverviewPage() {
  const [stats, setStats] = useState<DomainStats | null>(null);
  const [trend, setTrend] = useState<AlertTrendDay[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getDomainStats(), getAlertTrend()])
      .then(([statsRes, trendRes]) => {
        setStats(statsRes);
        setTrend(trendRes.trend);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load overview'));
  }, []);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-xl font-semibold tracking-tight text-white">Overview</h1>
      <p className="mb-6 text-sm text-slate-400">A bird&apos;s-eye view of your account&apos;s monitoring health.</p>

      {error && (
        <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400 ring-1 ring-inset ring-red-500/20">
          {error}
        </p>
      )}

      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="mb-1 text-sm font-semibold text-white">Domain health</h2>
          <p className="mb-5 text-sm text-slate-400">Every tracked domain, by its most urgent status.</p>
          {stats ? (
            <HealthBreakdownChart breakdown={stats.healthBreakdown} />
          ) : (
            <p className="text-sm text-slate-400">Loading…</p>
          )}
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="mb-1 text-sm font-semibold text-white">Alerts sent</h2>
          <p className="mb-5 text-sm text-slate-400">Last 30 days, by type.</p>
          {trend ? <AlertTrendChart trend={trend} /> : <p className="text-sm text-slate-400">Loading…</p>}
        </section>
      </div>
    </div>
  );
}
