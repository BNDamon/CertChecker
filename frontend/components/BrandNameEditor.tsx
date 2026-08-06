'use client';

import { useState } from 'react';
import { updateBrandName } from '@/lib/api';

export function BrandNameEditor({
  brandName,
  onSaved,
}: {
  brandName: string | null;
  onSaved: (brandName: string | null) => void;
}) {
  const [value, setValue] = useState(brandName ?? '');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const { brandName: saved } = await updateBrandName(value.trim() || null);
      onSaved(saved);
      setSuccess('Saved');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-sm">
      <label className="mb-1.5 block text-sm font-medium text-slate-300">Brand name</label>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Your Agency Name"
        maxLength={60}
        className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/30"
      />
      <p className="mt-1.5 text-xs text-slate-500">
        Replaces &quot;Monitored by CertChecker&quot; on your public status pages with &quot;Monitored by {'{name}'}&quot;.
        Leave blank to use the default.
      </p>

      {error && (
        <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400 ring-1 ring-inset ring-red-500/20">
          {error}
        </p>
      )}
      {success && (
        <p className="mt-3 rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-400 ring-1 ring-inset ring-green-500/20">
          {success}
        </p>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-3 rounded-lg bg-gradient-to-r from-accent-500 to-teal-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-accent-600/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}
