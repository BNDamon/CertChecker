'use client';

import { useState } from 'react';
import { updateDomainLabel } from '@/lib/api';
import { TagIcon } from './icons';

export function InlineLabel({
  domainId,
  label,
  onSaved,
}: {
  domainId: string;
  label: string | null;
  onSaved: (domain: { id: string; label: string | null }) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(label ?? '');
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const { domain } = await updateDomainLabel(domainId, value.trim() || null);
      onSaved(domain);
      setEditing(false);
    } catch {
      // Leave the field open so the user can see their text and retry.
    } finally {
      setSaving(false);
    }
  }

  function startEditing(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setValue(label ?? '');
    setEditing(true);
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={value}
        disabled={saving}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            save();
          }
          if (e.key === 'Escape') {
            setEditing(false);
          }
        }}
        placeholder="Client name"
        className="w-32 rounded-md border border-accent-500 bg-slate-950/80 px-1.5 py-0.5 text-xs text-slate-100 focus:outline-none"
      />
    );
  }

  return label ? (
    <button
      onClick={startEditing}
      className="inline-flex max-w-[9rem] items-center gap-1 truncate text-xs text-slate-400 hover:text-accent-300"
    >
      <TagIcon className="h-3 w-3 shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  ) : (
    <button
      onClick={startEditing}
      className="text-xs text-slate-600 opacity-0 transition-opacity hover:text-slate-400 group-hover:opacity-100"
    >
      + Add client
    </button>
  );
}
