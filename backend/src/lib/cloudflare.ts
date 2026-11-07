/**
 * Cloudflare API integration - auto-enables/disables Under Attack mode
 * and manages IP-level firewall rules during DDoS events.
 *
 * Required env vars (optional - protection degrades gracefully without them):
 *   CLOUDFLARE_API_TOKEN  - CF API token with Zone:Edit permission
 *   CLOUDFLARE_ZONE_ID    - Zone ID for the MSK Hub domain
 */

const CF_API = 'https://api.cloudflare.com/client/v4';

interface CFCredentials {
  token: string;
  zoneId: string;
}

function creds(): CFCredentials | null {
  const token  = process.env['CLOUDFLARE_API_TOKEN'];
  const zoneId = process.env['CLOUDFLARE_ZONE_ID'];
  if (!token || !zoneId) return null;
  return { token, zoneId };
}

async function cfPatch(path: string, body: unknown): Promise<void> {
  const c = creds();
  if (!c) {
    console.info('[cloudflare] Credentials not configured - skipping API call');
    return;
  }
  const res = await fetch(`${CF_API}${path}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${c.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Cloudflare API error ${res.status}: ${text}`);
  }
}

async function cfPost(path: string, body: unknown): Promise<void> {
  const c = creds();
  if (!c) return;
  const res = await fetch(`${CF_API}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${c.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.warn(`[cloudflare] POST ${path} failed ${res.status}: ${text}`);
  }
}

/** Switches the zone's security level to "under_attack" (I'm Under Attack mode). */
export async function enableUnderAttackMode(): Promise<void> {
  const c = creds();
  if (!c) {
    console.info('[cloudflare] No credentials - Under Attack mode not activated via API');
    return;
  }
  await cfPatch(`/zones/${c.zoneId}/settings/security_level`, { value: 'under_attack' });
  console.warn('[cloudflare] Under Attack mode ENABLED');
}

/** Restores security level to "high" after attack subsides. */
export async function disableUnderAttackMode(): Promise<void> {
  const c = creds();
  if (!c) return;
  await cfPatch(`/zones/${c.zoneId}/settings/security_level`, { value: 'high' });
  console.info('[cloudflare] Under Attack mode DISABLED - restored to high security');
}

/** Adds an IP-level block rule in Cloudflare (Zone-level Access Rules). */
export async function blockIpAtEdge(ip: string, note: string): Promise<void> {
  const c = creds();
  if (!c) return;
  await cfPost(`/zones/${c.zoneId}/firewall/access_rules/rules`, {
    mode: 'block',
    configuration: { target: 'ip', value: ip },
    notes: note,
  });
  console.warn(`[cloudflare] Edge block added for ${ip}: ${note}`);
}
