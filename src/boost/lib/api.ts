// ── Boost Store API Client ────────────────────────────────────────────────────
// All requests go to /api (proxied to backend in dev, same-origin in prod).
// Never make direct requests to the supplier API from the frontend.

export interface ProductInfo {
  id: string;
  title: string;
  description: string;
  available: boolean;
  outOfStock: boolean;
  unitPrice: number | null;
  stock: number;
  minQty: number;
  maxQty: number;
  inputType: 'buttons' | 'input';
  category: 'boost' | 'nitro' | 'token';
  features?: string[];
}

export interface ProductsResponse {
  products: ProductInfo[];
  supplierAvailable: boolean;
}

export interface ResolveInviteResponse {
  valid: boolean;
  serverId?: string;
  serverName?: string;
  serverIcon?: string | null;
  memberCount?: number | null;
  inviteCode?: string;
  error?: string;
}

export interface CreateOrderParams {
  product: string;
  quantity: number;
  email: string;
  inviteCode?: string;
}

export interface CreateOrderResponse {
  orderId: string;
  invoiceUrl: string;
  totalPrice: number;
}

export interface OrderStatusResponse {
  paymentStatus: 'pending' | 'paid' | 'failed' | 'expired';
  fulfillmentStatus: 'pending' | 'processing' | 'completed' | 'partial' | 'failed';
  product: string;
  quantity: number;
  totalPrice: number;
  serverName?: string;
  serverIcon?: string;
  boostsDelivered?: number;
  deliveredItems?: string[];
  deliveredItemCount?: number;
}

/** Generate a cryptographically random hex nonce */
function genNonce(bytes = 16): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` })) as { error?: string };
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function getProducts(): Promise<ProductsResponse> {
  return apiFetch<ProductsResponse>('/products');
}

export async function getStats(): Promise<{ totalBoostsSold: number }> {
  return apiFetch<{ totalBoostsSold: number }>('/stats');
}

export async function resolveInvite(invite: string): Promise<ResolveInviteResponse> {
  return apiFetch<ResolveInviteResponse>('/discord/resolve', {
    method: 'POST',
    body: JSON.stringify({ invite }),
  });
}

export async function createOrder(params: CreateOrderParams): Promise<CreateOrderResponse> {
  return apiFetch<CreateOrderResponse>('/orders/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Request-Timestamp': Date.now().toString(),
      'X-Request-Nonce': genNonce(16),
    },
    body: JSON.stringify(params),
  });
}

export async function getOrderStatus(orderId: string): Promise<OrderStatusResponse> {
  return apiFetch<OrderStatusResponse>(`/orders/${encodeURIComponent(orderId)}`);
}

/** Format price to 2 decimal places */
export function fmtPrice(n: number | null | undefined): string {
  if (n == null) return '--';
  return `$${n.toFixed(2)}`;
}
