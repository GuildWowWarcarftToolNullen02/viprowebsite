/**
 * NowPayments integration for the boost store.
 * Creates invoices for variable amounts (price calculated server-side).
 */

const BASE = 'https://api.nowpayments.io/v1';

function apiKey(): string {
  const k = process.env['NOWPAYMENTS_API_KEY'];
  if (!k) throw new Error('NOWPAYMENTS_API_KEY not configured');
  return k;
}

function appUrl(): string {
  // Boost store must always return to boost.mskhub.store
  return 'https://boost.mskhub.store';
}

export interface InvoiceResult {
  invoiceUrl: string;
  paymentId: string;
  amountUsd: number;
}

export async function createInvoice(params: {
  orderId: string;
  amountUsd: number;
  description: string;
}): Promise<InvoiceResult> {
  const base = appUrl();
  const res = await fetch(`${BASE}/invoice`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      price_amount: Math.round(params.amountUsd * 100) / 100,
      price_currency: 'usd',
      order_id: params.orderId,
      order_description: params.description,
      ipn_callback_url: `${base}/api/orders/ipn`,
      success_url: `${base}/payment/success?order=${params.orderId}`,
      cancel_url: `${base}/#products`,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NowPayments error ${res.status}: ${text}`);
  }

  const data = await res.json() as { id: string; invoice_url: string };
  return { invoiceUrl: data.invoice_url, paymentId: String(data.id), amountUsd: params.amountUsd };
}

export async function getPaymentStatus(invoiceOrPaymentId: string): Promise<string> {
  const key = apiKey();

  // Invoices and payments have separate IDs in NowPayments.
  // GET /v1/payment/{id} requires a payment_id - not an invoice_id.
  // Use invoiceId query param to find the actual payment.
  try {
    const listRes = await fetch(
      `${BASE}/payment/?invoiceId=${encodeURIComponent(invoiceOrPaymentId)}&limit=10&sortBy=created_at&orderBy=desc`,
      { headers: { 'x-api-key': key } },
    );
    if (listRes.ok) {
      const listData = await listRes.json() as { data?: { payment_status: string }[] };
      const payments = listData.data ?? [];
      if (payments.length > 0 && payments[0]) return payments[0].payment_status;
      return 'waiting'; // invoice exists but no coin selected yet
    }
  } catch { /* fall through */ }

  // Fallback: try as direct payment_id
  const directRes = await fetch(`${BASE}/payment/${invoiceOrPaymentId}`, {
    headers: { 'x-api-key': key },
  });
  if (!directRes.ok) return 'waiting'; // don't throw - stay pending
  const data = await directRes.json() as { payment_status: string };
  return data.payment_status;
}

export function mapPaymentStatus(s: string): 'pending' | 'paid' | 'failed' | 'expired' {
  if (['finished', 'confirmed', 'sending'].includes(s)) return 'paid';
  if (['failed', 'refunded'].includes(s)) return 'failed'; // partially_paid stays pending
  if (s === 'expired') return 'expired';
  return 'pending'; // waiting, confirming, partially_paid, unknown → pending
}
