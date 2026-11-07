/**
 * KeyAuth Seller API - creates and manages license keys for MSK Hub products.
 */

const SELLER_KEYS: Record<string, string | undefined> = {
  'token-g': process.env['KEYAUTH_SELLER_KEY_TOKEN_G'],
  'raider':  process.env['KEYAUTH_SELLER_KEY_RAIDER'],
};

// Expiry in days
const PLAN_EXPIRY: Record<string, number> = {
  monthly:  30,
  lifetime: 99999,
  source:   1,
};

// Required display format: MSK-XXXXXXX-XXXXXXX-XXXXXXX-XXXXXXX (letters and numbers)
const LICENSE_KEY_PATTERN = /^(MSK-)?[A-Z0-9]{4,12}(-[A-Z0-9]{4,12}){2,5}$/i;

interface KeyAuthResponse {
  success: boolean;
  key?: string;
  keys?: string | string[];
  message?: string;
}

export function validateLicenseKeyFormat(key: string): boolean {
  return LICENSE_KEY_PATTERN.test(key);
}

export async function createLicenseKey(product: string, plan: string, note?: string): Promise<string> {
  const sellerKey = SELLER_KEYS[product];
  if (!sellerKey) throw new Error(`No KeyAuth seller key configured for product: ${product}`);

  const expiry = PLAN_EXPIRY[plan] ?? 30;
  const mask = 'MSK-*******-*******-*******-*******';

  const url = new URL('https://keyauth.win/api/seller/');
  url.searchParams.set('sellerkey', sellerKey);
  url.searchParams.set('type', 'add');
  url.searchParams.set('expiry', String(expiry));
  url.searchParams.set('mask', mask);
  url.searchParams.set('level', '1');
  url.searchParams.set('amount', '1');
  url.searchParams.set('character', '2');
  url.searchParams.set('format', 'json');
  if (note?.trim()) url.searchParams.set('note', note.trim());

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`KeyAuth HTTP error: ${res.status}`);

  const data = await res.json() as KeyAuthResponse;
  if (!data.success) throw new Error(`KeyAuth error: ${data.message ?? 'Unknown error'}`);

  let key: string | null = (typeof data.key === 'string' && data.key.trim()) ? data.key.trim() : null;
  if (!key && data.keys) {
    if (Array.isArray(data.keys)) {
      key = data.keys.map((k) => String(k).trim()).find((k) => k.length > 0) ?? null;
    } else {
      key = String(data.keys).split('\n').map((k) => k.trim()).find((k) => k.length > 0) ?? null;
    }
  }

  if (!key) throw new Error('KeyAuth returned success but no key in response');

  // Validate the key conforms to the required MSK format before returning it
  if (!validateLicenseKeyFormat(key)) {
    throw new Error(`KeyAuth returned a key that does not match expected format: ${key.slice(0, 4)}...`);
  }

  return key;
}

/**
 * Reset HWID for a license key using the KeyAuth Seller API.
 * KeyAuth Seller API type=resetuser resets the HWID binding for the given user (by license key).
 */
export async function resetHwid(product: string, licenseKey: string): Promise<void> {
  const sellerKey = SELLER_KEYS[product];
  if (!sellerKey) throw new Error(`No KeyAuth seller key configured for product: ${product}`);

  const url = new URL('https://keyauth.win/api/seller/');
  url.searchParams.set('sellerkey', sellerKey);
  url.searchParams.set('type', 'resetuser');
  url.searchParams.set('user', licenseKey);
  url.searchParams.set('format', 'json');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`KeyAuth HTTP error: ${res.status}`);

  const data = await res.json() as KeyAuthResponse;
  if (!data.success) throw new Error(data.message ?? 'HWID reset failed');
}

/**
 * Fetch key info from KeyAuth (expiry, status, etc.)
 */
export async function getKeyInfo(product: string, licenseKey: string): Promise<{
  expires?: string;
  status?: string;
  hwid?: string;
  duration?: string;
} | null> {
  const sellerKey = SELLER_KEYS[product];
  if (!sellerKey) return null;

  try {
    const url = new URL('https://keyauth.win/api/seller/');
    url.searchParams.set('sellerkey', sellerKey);
    url.searchParams.set('type', 'info');
    url.searchParams.set('key', licenseKey);
    url.searchParams.set('format', 'json');

    const res = await fetch(url.toString());
    if (!res.ok) return null;

    const data = await res.json() as KeyAuthResponse & {
      duration?: string;
      status?: string;
      hwid?: string;
      expires?: string;
    };
    if (!data.success) return null;

    return { expires: data.expires, status: data.status, hwid: data.hwid, duration: data.duration };
  } catch {
    return null;
  }
}
