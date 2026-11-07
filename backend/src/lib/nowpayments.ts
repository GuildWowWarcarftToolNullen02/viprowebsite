/**
 * NowPayments API wrapper - creates crypto invoices and checks payment status.
 */

const BASE = 'https://api.nowpayments.io/v1';

const PRODUCT_PRICES: Record<string, Record<string, number>> = {
  'token-g': { monthly: 15, lifetime: 20, source: 120 },
  'raider':  { monthly: 10, lifetime: 20, source:  60 },
};

const PRODUCT_LABELS: Record<string, string> = {
  'token-g': 'MSK Token-G',
  'raider':  'MSK Raider Tool',
};

const PLAN_LABELS: Record<string, string> = {
  monthly:  'Monthly',
  lifetime: 'Lifetime',
  source:   'Source',
};

function apiKey(): string {
  const k = process.env['NOWPAYMENTS_API_KEY'];
  if (!k) throw new Error('NOWPAYMENTS_API_KEY not configured');
  return k;
}

function appUrl(): string {
  // Tool store must always return to mskhub.store, never boost
  return 'https://mskhub.store';
}

function frontendBase(): string {
  return process.env['FRONTEND_BASE'] ?? '';
}

export async function createInvoice(params: {
  product: string;
  plan: string;
  email: string;
  internalId: string;
  note?: string;
}): Promise<{ invoiceUrl: string; paymentId: string; amountUsd: number }> {
  const amountUsd = PRODUCT_PRICES[params.product]?.[params.plan];
  if (!amountUsd) throw new Error(`Unknown product/plan: ${params.product}/${params.plan}`);

  const description = [
    `${PRODUCT_LABELS[params.product] ?? params.product} - ${PLAN_LABELS[params.plan] ?? params.plan}`,
    params.note ? `(${params.note})` : '',
  ].filter(Boolean).join(' ');

  const base = appUrl() + frontendBase();

  const res = await fetch(`${BASE}/invoice`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      price_amount: amountUsd,
      price_currency: 'usd',
      order_id: params.internalId,
      order_description: description,
      ipn_callback_url: `${base}/api/payments/ipn`,
      success_url: `${base}/payment/success?order=${params.internalId}`,
      cancel_url: `${base}/shop`,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NowPayments error ${res.status}: ${text}`);
  }

  const data = await res.json() as { id: string; invoice_url: string };

  return { invoiceUrl: data.invoice_url, paymentId: String(data.id), amountUsd };
}

// JWT token cache for NowPayments authentication
let jwtCache: { token: string; exp: number } | null = null;

async function getJwt(): Promise<string | null> {
  const email = process.env['NOWPAYMENTS_EMAIL'];
  const password = process.env['NOWPAYMENTS_PASSWORD'];
  if (!email || !password) return null;
  
  // Return cached token if still valid
  if (jwtCache && jwtCache.exp > Date.now()) return jwtCache.token;
  
  try {
    const res = await fetch(`${BASE}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    if (!res.ok) return null;
    
    const data = await res.json() as { token: string };
    // Cache token for 4 minutes (JWT typically lasts ~5 min)
    jwtCache = { token: data.token, exp: Date.now() + 4 * 60_000 };
    return data.token;
  } catch {
    return null;
  }
}

export async function getPaymentStatus(opts: { 
  paymentId?: string; 
  invoiceId?: string 
}): Promise<string> {
  const key = apiKey();

  // If we have a real payment_id, use it directly (fastest and most reliable)
  if (opts.paymentId) {
    try {
      const directRes = await fetch(`${BASE}/payment/${opts.paymentId}`, {
        headers: { 'x-api-key': key },
      });
      
      if (directRes.ok) {
        const data = await directRes.json() as { payment_status: string };
        return data.payment_status;
      }
    } catch { /* fall through to invoice lookup */ }
  }

  // Fallback: lookup by invoice ID using JWT authentication
  // NowPayments list-payments endpoint requires JWT, not just API key
  if (opts.invoiceId) {
    const jwt = await getJwt();
    if (jwt) {
      try {
        const listRes = await fetch(
          `${BASE}/payment/?invoiceId=${encodeURIComponent(opts.invoiceId)}&limit=10&sortBy=created_at&orderBy=desc`,
          { 
            headers: { 
              'x-api-key': key,
              'Authorization': `Bearer ${jwt}`,
            } 
          },
        );

        if (listRes.ok) {
          const listData = await listRes.json() as { data?: { payment_status: string }[] };
          const payments = listData.data ?? [];
          if (payments.length > 0 && payments[0]) {
            return payments[0].payment_status;
          }
        }
      } catch { /* fall through */ }
    }
  }

  // No payments yet - invoice created but customer hasn't picked a coin yet
  return 'waiting';
}

