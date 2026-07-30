'use client';

import type { TrackedDomain } from '@/lib/api';
import { daysUntil, urgencyClasses, formatCountdown } from '@/lib/expiry';

export function DomainList({
  domains,
  onRemove,
}: {
  domains: TrackedDomain[];
  onRemove: (id: string) => void;
}) {
  if (domains.length === 0) {
    return <p className="text-sm text-gray-500">No domains tracked yet -- add one below.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left font-medium text-gray-600">Domain</th>
            <th className="px-4 py-2 text-left font-medium text-gray-600">SSL certificate</th>
            <th className="px-4 py-2 text-left font-medium text-gray-600">Domain registration</th>
            <th className="px-4 py-2 text-left font-medium text-gray-600">Last checked</th>
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {domains.map((d) => {
            const sslDays = daysUntil(d.ssl_expiry_date);
            const domainDays = daysUntil(d.domain_expiry_date);
            return (
              <tr key={d.id}>
                <td className="px-4 py-3 font-medium">{d.domain}</td>
                <td className={`px-4 py-3 ${urgencyClasses(d.ssl_status === 'error' ? null : sslDays)}`}>
                  {d.ssl_status === 'error' ? 'Check failed' : formatCountdown(sslDays)}
                </td>
                <td
                  className={`px-4 py-3 ${urgencyClasses(
                    d.domain_status === 'error' || d.domain_status === 'unknown' ? null : domainDays
                  )}`}
                >
                  {d.domain_status === 'error'
                    ? 'Check failed'
                    : d.domain_status === 'unknown'
                      ? 'Unknown (WHOIS unavailable)'
                      : formatCountdown(domainDays)}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {d.checked_at ? new Date(d.checked_at).toLocaleString() : 'Pending first check'}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => onRemove(d.id)}
                    className="text-xs font-medium text-gray-400 hover:text-red-600"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
