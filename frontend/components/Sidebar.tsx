'use client';

import { ShieldIcon, GlobeIcon, SparklesIcon } from './icons';
import { UpgradeButton } from './UpgradeButton';

export function Sidebar({
  email,
  isPro,
  onSignOut,
}: {
  email: string;
  isPro: boolean;
  onSignOut: () => void;
}) {
  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col self-start overflow-y-auto border-r border-slate-800 bg-slate-950/60 px-4 py-5">
      <div className="mb-8 flex items-center gap-2 px-1">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent-500 to-indigo-600 text-white">
          <ShieldIcon className="h-4 w-4" />
        </div>
        <span className="text-sm font-semibold tracking-tight text-white">CertChecker</span>
      </div>

      <nav className="flex-1 space-y-1">
        <div className="flex items-center gap-2.5 rounded-lg bg-slate-800/60 px-3 py-2 text-sm font-medium text-white">
          <GlobeIcon className="h-4 w-4" />
          Domains
        </div>
      </nav>

      <div className="space-y-3 border-t border-slate-800 pt-4">
        {isPro ? (
          <span className="inline-flex w-full items-center gap-1.5 rounded-full bg-accent-500/10 px-2.5 py-1.5 text-xs font-medium text-accent-300 ring-1 ring-inset ring-accent-500/25">
            <SparklesIcon className="h-3.5 w-3.5 shrink-0" />
            Pro plan
          </span>
        ) : (
          <UpgradeButton />
        )}
        <p className="truncate px-1 text-xs text-slate-400">{email}</p>
        <button
          onClick={onSignOut}
          className="w-full rounded-lg px-1 py-1 text-left text-xs text-slate-500 transition-colors hover:text-slate-300"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
