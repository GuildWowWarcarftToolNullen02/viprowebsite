/**
 * Verifies a Cloudflare Turnstile token server-side.
 * If CLOUDFLARE_TURNSTILE_SECRET is not set (dev), verification is skipped.
 */
export async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  const secret = process.env['CLOUDFLARE_TURNSTILE_SECRET'];

  if (!secret) {
    console.warn('[Turnstile] No secret configured - skipping verification (dev mode)');
    return true;
  }

  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set('remoteip', ip);

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
    });
    const data = await res.json() as { success: boolean };
    return data.success === true;
  } catch (err) {
    console.error('[Turnstile] Verification error:', err);
    return false;
  }
}
