'use client';

import { useState, FormEvent } from 'react';
import { addDomain } from '@/lib/api';
import { GlobeIcon, PlusIcon, TagIcon } from './icons';

export function AddDomainForm({ onAdded }: { onAdded: () => void }) {
  const [domain, setDomain] = useState('');
  const [label, setLabel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await addDomain(domain, label.trim() || undefined);
      setDomain('');
      setLabel('');
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add domain');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-black/10">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <GlobeIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            required
            placeholder="example.com"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950/60 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/30"
          />
        </div>
        <div className="relative sm:w-48">
          <TagIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Client (optional)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950/60 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/30"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-accent-500 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-accent-600/20 transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent-500/40 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <PlusIcon className="h-4 w-4" />
          {submitting ? 'Adding…' : 'Add domain'}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </form>
  );
}
