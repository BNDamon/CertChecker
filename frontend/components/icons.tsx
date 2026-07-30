export function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className}>
      <path
        d="M12 3l7 3v5c0 4.5-3 8.25-7 9.5-4-1.25-7-5-7-9.5V6l7-3z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className}>
      <circle cx="12" cy="12" r="8.5" strokeLinecap="round" />
      <path d="M4 12h16M12 3.5c2.2 2.2 3.4 5.2 3.4 8.5s-1.2 6.3-3.4 8.5c-2.2-2.2-3.4-5.2-3.4-8.5S9.8 5.7 12 3.5z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PlusIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

export function TrashIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className}>
      <path
        d="M4 7h16M9.5 7V4.8c0-.44.36-.8.8-.8h3.4c.44 0 .8.36.8.8V7M6.5 7l.7 12.1a2 2 0 0 0 2 1.9h5.6a2 2 0 0 0 2-1.9L17.5 7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 12.2l2.3 2.3 4.7-4.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AlertTriangleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className}>
      <path
        d="M10.6 4.3a1.6 1.6 0 0 1 2.8 0l7.6 13.6a1.6 1.6 0 0 1-1.4 2.4H4.4a1.6 1.6 0 0 1-1.4-2.4l7.6-13.6z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 9.5v4.2M12 17.2h.01" strokeLinecap="round" />
    </svg>
  );
}

export function XCircleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.5 9.5l5 5M14.5 9.5l-5 5" strokeLinecap="round" />
    </svg>
  );
}

export function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className}>
      <path
        d="M12 4v3M12 17v3M4 12h3M17 12h3M6.5 6.5l2 2M15.5 15.5l2 2M17.5 6.5l-2 2M8.5 15.5l-2 2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="2.2" />
    </svg>
  );
}
