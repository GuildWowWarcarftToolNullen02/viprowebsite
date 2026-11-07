import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

export interface OAuthStatePayload {
  nonce: string;
  ts: number;
  from?: string;
  linkUserId?: string;
  scope?: string;
}

const STATE_MAX_AGE_MS = 15 * 60 * 1000; // 15 minutes validity

function getSigningSecret(): string {
  const secret = process.env['SESSION_SECRET'] || process.env['ADMIN_API_SECRET'] || 'mskhub-oauth-signing-secret';
  return secret;
}

/**
 * Creates a cryptographically signed, stateless OAuth state parameter.
 * Prevents CSRF while eliminating serverless session-store dependency during redirects.
 */
export function createSignedOAuthState(meta: { from?: string; linkUserId?: string; scope?: string } = {}): string {
  const payload: OAuthStatePayload = {
    nonce: randomBytes(16).toString('hex'),
    ts: Date.now(),
    from: meta.from,
    linkUserId: meta.linkUserId,
    scope: meta.scope,
  };

  const jsonStr = JSON.stringify(payload);
  const data = Buffer.from(jsonStr, 'utf8').toString('base64url');
  const hmac = createHmac('sha256', getSigningSecret()).update(data).digest('base64url');

  return `${data}.${hmac}`;
}

/**
 * Verifies a signed OAuth state parameter.
 * Returns the decoded payload if valid and unexpired; returns null otherwise.
 */
export function verifySignedOAuthState(stateStr?: string): OAuthStatePayload | null {
  if (!stateStr || typeof stateStr !== 'string' || !stateStr.includes('.')) {
    return null;
  }

  const parts = stateStr.split('.');
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  if (!data || !sig) return null;

  try {
    const expectedSig = createHmac('sha256', getSigningSecret()).update(data).digest('base64url');
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expectedSig);

    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as OAuthStatePayload;
    if (!payload.ts || typeof payload.ts !== 'number') return null;

    if (Date.now() - payload.ts > STATE_MAX_AGE_MS) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
