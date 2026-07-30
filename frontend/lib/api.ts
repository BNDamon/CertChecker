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

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed with status ${res.status}`);
  }

  return res.status === 204 ? null : res.json();
}

export interface TrackedDomain {
  id: string;
  domain: string;
  added_at: string;
  checked_at: string | null;
  ssl_expiry_date: string | null;
  domain_expiry_date: string | null;
  ssl_status: 'ok' | 'expired' | 'error' | null;
  domain_status: 'ok' | 'expired' | 'error' | 'unknown' | null;
}

export function listDomains(): Promise<{ domains: TrackedDomain[] }> {
  return authedFetch('/api/domains');
}

export function addDomain(domain: string): Promise<{ domain: TrackedDomain }> {
  return authedFetch('/api/domains', { method: 'POST', body: JSON.stringify({ domain }) });
}

export function removeDomain(id: string): Promise<null> {
  return authedFetch(`/api/domains/${id}`, { method: 'DELETE' });
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
