/**
 * Exudos Reseller API Integration
 * 
 * CRITICAL: Complete white-label - ZERO customer-facing Exudos branding.
 * All errors are caught and translated to MSK Hub branded messages.
 * 
 * API Documentation: https://exudos.gg/reseller/api
 */

const API_BASE = 'https://exudos.gg/api/reseller/v1';

// Rate limiting tracking
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 250; // 250ms = 240 req/min max

function getApiKey(): string {
  const key = process.env['EXUDOS_API_KEY'];
  if (!key) throw new Error('EXUDOS_API_KEY not configured');
  return key;
}

/**
 * Get markup percentage for Exudos products.
 * Uses same pricing model as boost system: ceil(cost * (1 + markup/100) * 100) / 100
 */
function getExudosMarkup(): number {
  const raw = process.env['EXUDOS_MARKUP_PERCENT'];
  if (!raw) return 40; // default 40% like boost
  const n = parseFloat(raw);
  return isNaN(n) ? 40 : n;
}

/**
 * Calculate selling price from supplier cost.
 * Rounds UP to nearest cent.
 */
export function calcExudosSellingPrice(supplierCost: number): number {
  const markup = getExudosMarkup();
  return Math.ceil(supplierCost * (1 + markup / 100) * 100) / 100;
}

/**
 * Rate limiting - enforces minimum interval between requests
 */
async function rateLimitDelay(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - elapsed));
  }
  lastRequestTime = Date.now();
}

/**
 * Make authenticated request to Exudos API with complete error handling.
 * NEVER exposes raw API errors to customers.
 */
async function exudosRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  idempotencyKey?: string,
): Promise<{ success: true; data: T } | { success: false; error: string; code?: number }> {
  await rateLimitDelay();

  const url = `${API_BASE}${endpoint}`;
  const headers: HeadersInit = {
    'Authorization': `Bearer ${getApiKey()}`,
    ...(options.headers || {}),
  };

  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle different error codes with MSK-branded messages
    if (!response.ok) {
      const status = response.status;
      
      // Log internally for debugging (never shown to customer)
      console.error(`[Exudos API] ${endpoint} failed: ${status}`);
      
      // Return clean, MSK-branded error messages
      switch (status) {
        case 400:
          return { success: false, error: 'Invalid product selection. Please try again.', code: status };
        case 401:
          return { success: false, error: 'Service temporarily unavailable. Our team has been notified.', code: status };
        case 402:
          return { success: false, error: 'This product is currently unavailable. Please contact support.', code: status };
        case 403:
          return { success: false, error: 'Unable to process your request. Please contact support.', code: status };
        case 404:
          return { success: false, error: 'This product is no longer available.', code: status };
        case 409:
          return { success: false, error: 'Order is being processed. Please wait a moment and check your order history.', code: status };
        case 413:
        case 415:
          return { success: false, error: 'Invalid request format. Please try again.', code: status };
        case 429:
          return { success: false, error: 'Too many requests. Please wait a moment and try again.', code: status };
        case 502:
        case 503:
          return { success: false, error: 'Service temporarily unavailable. Please try again in a few moments.', code: status };
        default:
          return { success: false, error: 'Unable to complete your request. Please try again later.', code: status };
      }
    }

    const data = await response.json() as T;
    return { success: true, data };

  } catch (error) {
    // Network errors, timeouts, etc - log internally only
    console.error('[Exudos API] Request failed:', error);
    return { 
      success: false, 
      error: 'Network error. Please check your connection and try again.' 
    };
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Type Definitions (Based on Exudos API Documentation)
// ────────────────────────────────────────────────────────────────────────────

export interface ExudosBalance {
  balance: number;
  total_balance: number;
  held: number;
  currency: 'USD';
}

export interface ExudosVariant {
  id: number;
  name?: string; // Variant name from Exudos API (e.g., "10M Credits", "1 Month", etc.)
  price: number | null;
  list_price: number | null;
  stock: number | null;
  delivery_url: string;
}

export interface ExudosProduct {
  id: number;
  name: string;
  variants: ExudosVariant[];
}

export interface ExudosProductsResponse {
  data: ExudosProduct[];
  charge_currency: 'USD';
}

export interface ExudosOrderRequest {
  product_id: number;
  variant_id: number;
  quantity: number;
}

export interface ExudosOrderResponse {
  invoice_id: number | null;
  charged: number;
  currency: 'USD';
  delivered: string[];
  replayed: boolean;
}

// ────────────────────────────────────────────────────────────────────────────
// Public API Functions
// ────────────────────────────────────────────────────────────────────────────

/**
 * Get current Exudos balance (for internal monitoring only)
 */
export async function getExudosBalance(): Promise<{ success: true; data: ExudosBalance } | { success: false; error: string }> {
  return exudosRequest<ExudosBalance>('/balance');
}

/**
 * Get all products from Exudos catalog.
 * Optionally filter by currency for display prices.
 */
export async function getExudosProducts(currency = 'USD'): Promise<{ success: true; data: ExudosProductsResponse } | { success: false; error: string }> {
  return exudosRequest<ExudosProductsResponse>(`/products?currency=${currency}`);
}

/**
 * Create an order on Exudos.
 * Uses idempotency key to prevent duplicate orders on retry.
 * 
 * IMPORTANT: The delivered content is returned in the response.
 */
export async function createExudosOrder(
  productId: number,
  variantId: number,
  quantity: number,
  idempotencyKey: string,
): Promise<{ success: true; data: ExudosOrderResponse } | { success: false; error: string; code?: number }> {
  return exudosRequest<ExudosOrderResponse>(
    '/orders',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: productId,
        variant_id: variantId,
        quantity,
      }),
    },
    idempotencyKey,
  );
}

/**
 * Validate pricing server-side before order placement.
 * Returns the expected supplier cost for the given product/variant.
 */
export async function validateExudosPrice(
  productId: number,
  variantId: number,
): Promise<{ success: true; supplierCost: number } | { success: false; error: string }> {
  const result = await getExudosProducts('USD');
  
  if (!result.success) {
    return { success: false, error: 'Unable to validate product pricing' };
  }
  
  const product = result.data.data.find(p => p.id === productId);
  if (!product) {
    return { success: false, error: 'Product not found' };
  }
  
  const variant = product.variants.find(v => v.id === variantId);
  if (!variant || variant.price === null) {
    return { success: false, error: 'Product variant not available' };
  }
  
  // Check stock availability
  if (variant.stock !== null && variant.stock <= 0) {
    return { success: false, error: 'Product is out of stock' };
  }
  
  return { success: true, supplierCost: variant.price };
}

// ────────────────────────────────────────────────────────────────────────────
// Category Mapping & Filtering
// ────────────────────────────────────────────────────────────────────────────

/**
 * Approved categories we resell from Exudos.
 * ONLY these categories should be displayed.
 */
export const APPROVED_CATEGORIES = [
  'Accounts',
  'Streaming',
  'Music',
  'AI',
  'Software & Tools',
  'VPN & Privacy',
  'Social Boost',
  'Discord Services', // Only specific products from this category
] as const;

/**
 * Categorize products by inferring from product names.
 * Updated with comprehensive categorization rules.
 */
export function categorizeProduct(productName: string): string {
  const name = productName.toLowerCase();
  
  // ❌ Block games completely FIRST - return special marker to filter out
  if (name.includes('dead by daylight') || name.includes('brawl stars') || 
      name.includes('clash royal') || name.includes('cs2') || name.includes('thehunter') ||
      name.includes('game') || name.includes('gaming') || name.includes('clash of clans')) {
    return '__BLOCKED__';
  }
  
  // Discord Services - Members, reactions, etc (NOT general Discord accounts or boosts)
  if (name.includes('discord member') || 
      (name.includes('discord') && (name.includes('online') || name.includes('offline') || 
       name.includes('real') || name.includes('reaction') || name.includes('chat member') || 
       name.includes('vc member')))) {
    return 'Discord Services';
  }
  
  // Streaming - ALL video streaming services (FIXED: added missing services)
  if (name.includes('netflix') || name.includes('disney') || name.includes('hulu') || 
      name.includes('hbo') || name.includes('prime video') || name.includes('paramount') ||
      name.includes('sky go') || name.includes('f1tv') || name.includes('f1 tv') ||
      name.includes('sling tv') || name.includes('sling') || 
      name.includes('fubo tv') || name.includes('fubo') ||
      name.includes('direct tv') || name.includes('directv') ||
      name.includes('plex') || name.includes('nfl') || name.includes('mlb') || 
      name.includes('atresplayer') || name.includes('amc+') || name.includes('movistar') ||
      name.includes('fox one') || name.includes('shahid') || name.includes('oneplay') ||
      name.includes('crunchyroll') || name.includes('peacock') || name.includes('showtime') ||
      name.includes('apple tv') || name.includes('max')) {
    return 'Streaming';
  }
  
  // Software & Tools - Productivity and software (FIXED: added Elevenlabs, Duolingo, Grammarly, Quillbot, Malwarebytes)
  if (name.includes('adobe') || name.includes('office') || name.includes('windows') || 
      name.includes('canva') || name.includes('notion') || name.includes('microsoft 365') ||
      name.includes('duolingo') || name.includes('grammarly') || name.includes('quillbot') ||
      name.includes('elevenlabs') || name.includes('wondershare') || name.includes('capcut') ||
      name.includes('malwarebytes') || name.includes('antivirus') || name.includes('winrar') ||
      name.includes('kaspersky') || name.includes('bitdefender') || name.includes('norton')) {
    return 'Software & Tools';
  }
  
  // VPN & Privacy (FIXED: added IP Vanish)
  if (name.includes('vpn') || name.includes('nordvpn') || name.includes('expressvpn') || 
      name.includes('proton') || name.includes('ip vanish') || name.includes('ipvanish') ||
      name.includes('surfshark') || name.includes('cyberghost') || name.includes('privacy')) {
    return 'VPN & Privacy';
  }
  
  // Music services
  if (name.includes('spotify') || name.includes('apple music') || name.includes('tidal') || 
      name.includes('deezer') || name.includes('youtube music') || name.includes('soundcloud')) {
    return 'Music';
  }
  
  // AI services
  if (name.includes('chatgpt') || name.includes('openai') || name.includes('midjourney') || 
      name.includes('claude') || name.includes('gemini') || name.includes('grok') || 
      name.includes('copilot') || (name.includes('ai') && !name.includes('email'))) {
    return 'AI';
  }
  
  // Social Boost - Services only (not accounts)
  if ((name.includes('followers') || name.includes('likes') || name.includes('views') || 
       name.includes('subscribers')) ||
      (name.includes('instagram') && name.includes('service')) ||
      (name.includes('tiktok') && name.includes('service')) ||
      (name.includes('youtube') && name.includes('service')) ||
      (name.includes('twitter') && name.includes('service'))) {
    return 'Social Boost';
  }
  
  // Default: Accounts (for misc accounts like Chess.com, Tradingview, email accounts, etc.)
  return 'Accounts';
}

/**
 * Check if a product should be displayed based on approved categories.
 */
export function isApprovedProduct(productName: string): boolean {
  const name = productName.toLowerCase();
  
  // ❌ BLOCK: Games (Steam, Epic, etc.)
  if (name.includes('steam') || name.includes('epic') || name.includes('game') || 
      name.includes('ark:') || name.includes('mortal kombat') || name.includes('resident evil') ||
      name.includes('elden ring') || name.includes('gta') || name.includes('minecraft') ||
      name.includes('fortnite') || name.includes('valorant') || name.includes('apex')) {
    return false;
  }
  
  // ❌ BLOCK: Cheats/Hacks
  if (name.includes('cheat') || name.includes('hack') || name.includes('spoofer') || 
      name.includes('menu') || name.includes('aimbot') || name.includes('theme')) {
    return false;
  }
  
  // ❌ BLOCK: Sports streaming (DAZN, NBA, UFC, WWE, ESPN)
  if (name.includes('dazn') || name.includes('nba') || name.includes('ufc') || 
      name.includes('wwe') || name.includes('espn') || name.includes('sport')) {
    return false;
  }
  
  // ❌ BLOCK: Discord BOOSTS only (we have boost.mskhub.store for that)
  // ✅ ALLOW: Discord members
  if (name.includes('discord') && name.includes('boost')) {
    return false;
  }
  
  // ❌ BLOCK: Specific unwanted services
  if (name.includes('telegram service') || name.includes('twitch service') || 
      name.includes('roblox service') || name.includes('reddit service') || 
      name.includes('kick service') || name.includes('facebook service')) {
    return false;
  }
  
  const category = categorizeProduct(productName);
  return APPROVED_CATEGORIES.includes(category as any);
}
