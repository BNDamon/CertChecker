'use client';

import { useState } from 'react';
import { updateThresholds } from '@/lib/api';

const DEFAULT_THRESHOLDS = [30, 14, 7, 1];

export function ThresholdsEditor({
  thresholds,
  onSaved,
}: {
  thresholds: number[] | null;
  onSaved: (thresholds: number[] | null) => void;
}) {
  const [value, setValue] = useState((thresholds ?? DEFAULT_THRESHOLDS).join(', '));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setError(null);
    setSuccess(null);
    const parsed = value
      .split(',')
      .map((v) => parseInt(v.trim(), 10))
      .filter((v) => Number.isInteger(v));

    setSaving(true);
    try {
      const { alertThresholds } = await updateThresholds(parsed);
      onSaved(alertThresholds);
      setValue((alertThresholds ?? DEFAULT_THRESHOLDS).join(', '));
      setSuccess('Thresholds updated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update thresholds');
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const { alertThresholds } = await updateThresholds(null);
      onSaved(alertThresholds);
      setValue(DEFAULT_THRESHOLDS.join(', '));
      setSuccess('Reset to the default schedule');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset thresholds');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-sm">
      <label className="mb-1.5 block text-sm font-medium text-slate-300">Days before expiry to alert</label>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="30, 14, 7, 1"
        className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/30"
      />
      <p className="mt-1.5 text-xs text-slate-500">Comma-separated, up to 8 values, 1-365 days each.</p>

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

      <div className="mt-3 flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-gradient-to-r from-accent-500 to-teal-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-accent-600/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={handleReset}
          disabled={saving}
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Reset to default
        </button>
      </div>
    </div>
  );
}
