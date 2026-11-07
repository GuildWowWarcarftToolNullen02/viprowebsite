/**
 * salta7.store supplier API client.
 *
 * SECURITY: This module must NEVER be imported by or expose any data to
 * frontend-facing code. All supplier errors are mapped to safe generic messages
 * before they leave this module. The supplier domain, URL, job IDs, and any
 * internal identifiers must never appear in customer-visible responses.
 */

const BASE = 'https://salta7.store';
const CACHE_TTL_MS = 5 * 60_000; // 5-minute cache

// ── Safe customer-facing error messages ──────────────────────────────────────
export class SupplierError extends Error {
  public readonly safeMessage: string;
  public readonly code: number;
  constructor(message: string, safeMessage: string, code: number) {
    super(message);
    this.safeMessage = safeMessage;
    this.code = code;
  }
}

function mapHttpError(status: number, body: string): SupplierError {
  const internal = `Supplier HTTP ${status}: ${body.slice(0, 200)}`;
  switch (status) {
    case 400: return new SupplierError(internal, 'Invalid order parameters. Please try again.', 400);
    case 403: return new SupplierError(internal, 'This product is temporarily unavailable. Please contact support.', 403);
    case 404: return new SupplierError(internal, 'Product not found. Please try again.', 404);
    case 409: return new SupplierError(internal, 'Insufficient stock at this time. Please try again shortly.', 409);
    case 429: return new SupplierError(internal, 'Service busy. Please wait a moment and try again.', 429);
    case 503: return new SupplierError(internal, 'This product is temporarily unavailable.', 503);
    default:  return new SupplierError(internal, 'We couldn\'t process your order. Please try again.', 500);
  }
}

function apiToken(): string {
  const t = process.env['SALTA7_API_TOKEN'];
  if (!t) throw new Error('SALTA7_API_TOKEN is not configured');
  return t;
}

function authHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${apiToken()}`, 'Content-Type': 'application/json' };
}

async function get<T>(path: string, params?: Record<string, string>, auth = true): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const headers = auth ? authHeaders() : {};
  const res = await fetch(url.toString(), { headers });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw mapHttpError(res.status, body);
  }
  return res.json() as Promise<T>;
}

async function post<T>(path: string, body: unknown, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw mapHttpError(res.status, text);
  }
  return res.json() as Promise<T>;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SupplierPrice {
  product: string;
  title: string;
  price: number;
  id: number;
  description: string;
  warranty: string;
  admin_only: boolean;
}

export interface SupplierBalance {
  token: string;
  username: string;
  balance_usd: number;
  balance_egp: number;
  is_admin: boolean;
}

export interface SupplierTaskProduct {
  product: string;
  title: string;
  price: number;  // price per boost
  stock: number;  // stock in boosts
}

export interface SupplierJob {
  job_id: string;
  tool: string;
  mode: string;
  status: 'running' | 'completed' | 'partial' | 'failed';
  error: string | null;
  total: number;
  done: number;
  failed: number;
  boosts?: number;
  transferred?: number;
  cost: number;
  created_at: string;
}

export interface SupplierBuyResult {
  tx_id: string;
  name: string;
  remaining_balance: number;
  items: string[];
}

// ── In-memory cache ───────────────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  ts: number;
}

const cache: { balance?: CacheEntry<SupplierBalance>; prices?: CacheEntry<SupplierPrice[]>; taskProducts?: CacheEntry<SupplierTaskProduct[]> } = {};

function isFresh<T>(entry: CacheEntry<T> | undefined): entry is CacheEntry<T> {
  return !!entry && Date.now() - entry.ts < CACHE_TTL_MS;
}

export function invalidateCache(): void {
  delete cache.balance;
  delete cache.prices;
  delete cache.taskProducts;
}

// ── API Methods ───────────────────────────────────────────────────────────────

export async function getBalance(): Promise<SupplierBalance> {
  if (isFresh(cache.balance)) return cache.balance.data;
  const data = await get<SupplierBalance>('/balance');
  cache.balance = { data, ts: Date.now() };
  return data;
}

export async function getPrices(): Promise<SupplierPrice[]> {
  if (isFresh(cache.prices)) return cache.prices.data;
  const data = await get<SupplierPrice[]>('/prices', undefined, false);
  cache.prices = { data, ts: Date.now() };
  return data;
}

/** Returns stock count for a specific product or all products */
export async function getStock(product?: string): Promise<number | Record<string, number>> {
  const params = product ? { account: product } : undefined;
  return get<number | Record<string, number>>('/stock', params, false);
}

/** Get task products for a specific tool (e.g. 'boost') */
export async function getTaskProducts(tool: string): Promise<SupplierTaskProduct[]> {
  if (tool === 'boost' && isFresh(cache.taskProducts)) return cache.taskProducts.data;
  const data = await get<{ products: SupplierTaskProduct[] }>('/task/products', { tool });
  if (tool === 'boost') cache.taskProducts = { data: data.products, ts: Date.now() };
  return data.products;
}

/** Start a boost job using supplier stock */
export async function createBoostJob(invite: string, quantity: number): Promise<SupplierJob> {
  return post<SupplierJob>('/task/create', { tool: 'boost', invite, quantity });
}

/** Poll boost job status */
export async function getJobStatus(jobId: string): Promise<SupplierJob> {
  return get<SupplierJob>('/task/status', { job_id: jobId });
}

/** Buy accounts/tokens. client_tx_id makes this idempotent - retrying with same ID returns the same order */
export async function buyAccounts(product: string, amount: number, clientTxId: string): Promise<SupplierBuyResult> {
  return post<SupplierBuyResult>('/buy', undefined, {
    account: product,
    amount: String(amount),
    client_tx_id: clientTxId,
  });
}

/**
 * Poll a boost job until completion (max 6 minutes, 5s interval).
 * Returns the final job object.
 */
export async function pollBoostJobToCompletion(jobId: string): Promise<SupplierJob> {
  const MAX_POLLS = 72; // 72 �- 5s = 6 minutes
  for (let i = 0; i < MAX_POLLS; i++) {
    await new Promise((r) => setTimeout(r, 5_000));
    const job = await getJobStatus(jobId);
    if (job.status !== 'running') return job;
  }
  // Return last known status even if still running (let caller handle)
  return getJobStatus(jobId);
}

/**
 * Calculate reserved balance from pending/processing paid orders.
 * Used to determine how much of our balance is already committed.
 */
import { BoostOrder } from '../db/models/BoostOrder.js';

export async function getReservedBalance(): Promise<number> {
  const orders = await BoostOrder.find({
    paymentStatus: 'paid',
    fulfillmentStatus: { $in: ['pending', 'processing'] },
  }).select('supplierUnitCost quantity');

  return orders.reduce((sum, o) => sum + o.supplierUnitCost * o.quantity, 0);
}

/**
 * Find the best matching price entry for a product by keyword search in title.
 */
export function findPriceByKeywords(prices: SupplierPrice[], ...keywords: string[]): SupplierPrice | undefined {
  const lower = keywords.map((k) => k.toLowerCase());
  return prices.find((p) => {
    const title = p.title.toLowerCase();
    return lower.every((kw) => title.includes(kw));
  });
}
