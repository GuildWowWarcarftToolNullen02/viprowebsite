/**
 * Nonce store for replay-attack prevention on payment creation.
 *
 * Sensitive mutations must include:
 *   X-Request-Timestamp  - current Unix timestamp in milliseconds (string)
 *   X-Request-Nonce      - random hex string (8-64 chars), unique per request
 */

const NONCE_TTL_MS = 5 * 60_000;  // keep nonces for 5 minutes
const MAX_SKEW_MS  = 2 * 60_000;  // reject timestamps > 2 min old or in the future

const usedNonces = new Map<string, number>();

// Purge expired nonces every minute
setInterval(() => {
  const now = Date.now();
  for (const [nonce, expiry] of usedNonces) {
    if (expiry < now) usedNonces.delete(nonce);
  }
}, 60_000);

export interface NonceResult {
  valid: boolean;
  error?: string;
}

export function validateNonce(timestamp: string | undefined, nonce: string | undefined): NonceResult {
  if (!timestamp || !nonce) {
    return { valid: false, error: 'Missing X-Request-Timestamp or X-Request-Nonce header.' };
  }

  const ts = parseInt(timestamp, 10);
  if (isNaN(ts) || ts <= 0) {
    return { valid: false, error: 'Invalid request timestamp.' };
  }

  if (Math.abs(Date.now() - ts) > MAX_SKEW_MS) {
    return { valid: false, error: 'Request timestamp is too old or too far in the future. Please retry.' };
  }

  if (nonce.length < 8 || nonce.length > 64 || !/^[a-f0-9]+$/i.test(nonce)) {
    return { valid: false, error: 'Invalid nonce format.' };
  }

  if (usedNonces.has(nonce)) {
    return { valid: false, error: 'Duplicate request detected. Please retry with a new nonce.' };
  }

  usedNonces.set(nonce, Date.now() + NONCE_TTL_MS);
  return { valid: true };
}
