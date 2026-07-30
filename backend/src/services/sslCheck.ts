import tls from 'node:tls';

export interface SslCheckResult {
  status: 'ok' | 'expired' | 'error';
  expiryDate: Date | null;
  error?: string;
}

const CONNECT_TIMEOUT_MS = 8000;

/**
 * Opens a TLS connection to hostname:port and reads the peer certificate's
 * notAfter date. rejectUnauthorized is deliberately false: we want to read the
 * expiry date even for an already-expired or otherwise untrusted cert (that's
 * exactly the case we're trying to detect and alert on), not have Node throw.
 */
export function checkSslExpiry(hostname: string, port = 443): Promise<SslCheckResult> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: SslCheckResult) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(result);
    };

    const socket = tls.connect(
      {
        host: hostname,
        port,
        servername: hostname, // required for SNI on multi-cert hosts
        rejectUnauthorized: false,
        timeout: CONNECT_TIMEOUT_MS,
      },
      () => {
        const cert = socket.getPeerCertificate();
        if (!cert || !cert.valid_to) {
          finish({ status: 'error', expiryDate: null, error: 'No certificate returned by server' });
          return;
        }

        const expiryDate = new Date(cert.valid_to);
        const status = expiryDate.getTime() < Date.now() ? 'expired' : 'ok';
        finish({ status, expiryDate });
      }
    );

    socket.on('error', (err) => {
      finish({ status: 'error', expiryDate: null, error: err.message });
    });

    socket.on('timeout', () => {
      finish({ status: 'error', expiryDate: null, error: 'Connection timed out' });
    });
  });
}
