import { supabase } from './supabaseClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

async function authedFetch(path: string, init: RequestInit = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not signed in');
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      ...init.headers,
    },
  });

  if (res.status === 401) {
    // The locally cached session looks present but the backend rejected it --
    // e.g. it was revoked server-side (password change, manual sign-out
    // elsewhere). Clear it and send the user back to sign in rather than
    // letting every caller hit an "Invalid session" error individually.
    await supabase.auth.signOut();
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new Error('Session expired -- redirecting to sign in');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed with status ${res.status}`);
  }

  return res.status === 204 ? null : res.json();
}

export interface TrackedDomain {
  id: string;
  domain: string;
  label: string | null;
  added_at: string;
  checked_at: string | null;
  ssl_expiry_date: string | null;
  domain_expiry_date: string | null;
  ssl_status: 'ok' | 'expired' | 'error' | null;
  domain_status: 'ok' | 'expired' | 'error' | 'unknown' | null;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
}

export function listDomains(
  page = 1,
  pageSize = 10,
  q = ''
): Promise<{ domains: TrackedDomain[] } & Pagination> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (q) params.set('q', q);
  return authedFetch(`/api/domains?${params.toString()}`);
}

export interface DomainStats {
  total: number;
  expiringSoon: number;
  expired: number;
  nextUp: { domain: string; kind: 'ssl' | 'domain'; days: number } | null;
  healthBreakdown: { healthy: number; warning: number; critical: number; unknown: number };
}

export function getDomainStats(): Promise<DomainStats> {
  return authedFetch('/api/domains/stats');
}

export function addDomain(domain: string, label?: string): Promise<{ domain: TrackedDomain }> {
  return authedFetch('/api/domains', { method: 'POST', body: JSON.stringify({ domain, label }) });
}

export function updateDomainLabel(id: string, label: string | null): Promise<{ domain: TrackedDomain }> {
  return authedFetch(`/api/domains/${id}`, { method: 'PATCH', body: JSON.stringify({ label }) });
}

export function removeDomain(id: string): Promise<null> {
  return authedFetch(`/api/domains/${id}`, { method: 'DELETE' });
}

export interface CheckResult {
  checked_at: string;
  ssl_expiry_date: string | null;
  domain_expiry_date: string | null;
  ssl_status: 'ok' | 'expired' | 'error';
  domain_status: 'ok' | 'expired' | 'error' | 'unknown';
}

export interface DomainDetail {
  domain: { id: string; domain: string; label: string | null; added_at: string };
  history: CheckResult[];
}

export function getDomainDetail(
  id: string,
  page = 1,
  pageSize = 10
): Promise<DomainDetail & Pagination> {
  return authedFetch(`/api/domains/${id}?page=${page}&pageSize=${pageSize}`);
}

export interface AlertRecord {
  id: string;
  alert_type: 'ssl' | 'domain';
  threshold_days: number;
  sent_at: string;
  domain: string;
  domain_id: string;
}

export function listAlerts(page = 1, pageSize = 20): Promise<{ alerts: AlertRecord[] } & Pagination> {
  return authedFetch(`/api/alerts?page=${page}&pageSize=${pageSize}`);
}

export interface AlertTrendDay {
  date: string;
  ssl: number;
  domain: number;
}

export function getAlertTrend(): Promise<{ trend: AlertTrendDay[] }> {
  return authedFetch('/api/alerts/trend');
}

export function createCheckoutSession(): Promise<{ url: string }> {
  return authedFetch('/api/stripe/create-checkout-session', { method: 'POST' });
}

export interface MeInfo {
  email: string;
  subscriptionStatus: 'free' | 'active' | 'past_due' | 'canceled';
  domainCount: number;
  freeTierDomainLimit: number;
}

export function getMe(): Promise<MeInfo> {
  return authedFetch('/api/me');
}

export function createPortalSession(): Promise<{ url: string }> {
  return authedFetch('/api/stripe/create-portal-session', { method: 'POST' });
}
