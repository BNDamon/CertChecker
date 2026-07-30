import whois from 'whois-json';

export interface WhoisCheckResult {
  status: 'ok' | 'expired' | 'error' | 'unknown';
  expiryDate: Date | null;
  error?: string;
}

const WHOIS_TIMEOUT_MS = 10000;

// WHOIS has no single standard response format. Different registries/registrars
// return the expiry date under different keys depending on TLD and even
// depending on which registrar sponsors the domain. This list covers the
// common cases for gTLDs (.com/.net/.org/.io/.dev/...) via Verisign/PIR-style
// servers and a handful of others. It will NOT reliably cover every ccTLD.
const EXPIRY_FIELD_CANDIDATES = [
  'registryExpiryDate',
  'registrarRegistrationExpirationDate',
  'expiryDate',
  'expirationDate',
  'expirationTime',
  'domainExpirationDate',
  'expiresOn',
  'expiry',
  'paidTillDate', // some .ru-style formats
  'renewalDate',
];

function extractExpiryDate(record: Record<string, unknown>): Date | null {
  for (const key of EXPIRY_FIELD_CANDIDATES) {
    const raw = record[key];
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (typeof value === 'string' && value.trim().length > 0) {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }
  }
  return null;
}

/**
 * Looks up a domain's registration expiry via WHOIS.
 *
 * Known limitations (v1, worth revisiting before relying on this for billing
 * or SLA-critical alerting):
 *  - Many ccTLDs (.de, .ca, .eu, and others) either omit expiry dates entirely
 *    from their WHOIS output, require a separate RDAP/web lookup, or return
 *    GDPR-redacted records with no dates at all.
 *  - Some registries rate-limit or block repeated automated WHOIS queries
 *    (port 43) from the same IP -- at scale this needs backoff/caching or a
 *    move to RDAP (rdap.org), which has a real JSON schema per domain.
 *  - Privacy/proxy registrations sometimes surface the *registrar's* renewal
 *    date rather than the actual registry expiry.
 *  - This uses whois-json's best-effort key parsing; unrecognized formats
 *    fall through to status: 'unknown' rather than a false expiry date.
 */
export async function checkDomainExpiry(domain: string): Promise<WhoisCheckResult> {
  try {
    const record = await whois(domain, { timeout: WHOIS_TIMEOUT_MS, follow: 2 });
    const expiryDate = extractExpiryDate(record);

    if (!expiryDate) {
      return { status: 'unknown', expiryDate: null, error: 'No parseable expiry field in WHOIS response' };
    }

    const status = expiryDate.getTime() < Date.now() ? 'expired' : 'ok';
    return { status, expiryDate };
  } catch (err) {
    return {
      status: 'error',
      expiryDate: null,
      error: err instanceof Error ? err.message : 'Unknown WHOIS error',
    };
  }
}
