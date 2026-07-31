import type { TrackedDomain } from './api';

function escapeCsvField(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export function domainsToCsv(domains: TrackedDomain[]): string {
  const headers = [
    'Domain',
    'Client',
    'SSL status',
    'SSL expiry',
    'Registration status',
    'Registration expiry',
    'Last checked',
    'Added',
  ];

  const rows = domains.map((d) => [
    d.domain,
    d.label ?? '',
    d.ssl_status ?? '',
    d.ssl_expiry_date ?? '',
    d.domain_status ?? '',
    d.domain_expiry_date ?? '',
    d.checked_at ?? '',
    d.added_at,
  ]);

  return [headers, ...rows].map((row) => row.map(escapeCsvField).join(',')).join('\r\n');
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
