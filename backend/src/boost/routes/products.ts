import { Router, type Request, type Response } from 'express';
import {
  getBalance, getPrices, getStock, getTaskProducts,
  getReservedBalance, findPriceByKeywords, SupplierError,
} from '../lib/supplier.js';
import { calcSellingPrice, getBoostMarkup, getNitroMarkup, getTokenMarkup } from '../lib/pricing.js';
import { getStats } from '../db/models/SalesStats.js';

const router = Router();

// ── GET /api/products ─────────────────────────────────────────────────────────
router.get('/', async (_req: Request, res: Response) => {
  try {
    // Fetch supplier data concurrently
    const [balance, prices, boostProducts, allStock] = await Promise.all([
      getBalance().catch(() => null),
      getPrices().catch(() => null),
      getTaskProducts('boost').catch(() => null),
      getStock().catch(() => null),
    ]);

    const reserved = balance ? await getReservedBalance().catch(() => 0) : 0;
    const availableBalance = balance ? Math.max(0, balance.balance_usd - reserved) : 0;
    const stockMap = typeof allStock === 'object' && allStock !== null ? allStock as Record<string, number> : {};

    // ── Boost 1 Month ────────────────────────────────────────────
    let boostUnitPrice: number | null = null;
    let boostStock = 0;
    let boostAvailable = false;

    if (boostProducts && boostProducts.length > 0 && balance) {
      const bp = boostProducts[0]!;                      // cheapest / first
      const markup = getBoostMarkup();
      boostUnitPrice = calcSellingPrice(bp.price, markup);
      const fromBalance = Math.floor(availableBalance / bp.price);
      boostStock = Math.max(0, Math.min(bp.stock, fromBalance));
      boostAvailable = boostStock >= 2; // need at least minimum quantity
    } else if (!process.env['SALTA7_API_TOKEN']) {
      // No token configured - indicate via null price
      boostAvailable = false;
    }

    // ── Nitro 1 Month ─────────────────────────────────────────────
    let nitroUnitPrice: number | null = null;
    let nitroStock = 0;
    let nitroAvailable = false;

    if (prices && balance) {
      const nitroProduct = findPriceByKeywords(prices, '1m', 'nitro')
        ?? findPriceByKeywords(prices, '1 month', 'nitro')
        ?? findPriceByKeywords(prices, 'nitro');
      if (nitroProduct && !nitroProduct.admin_only) {
        const markup = getNitroMarkup();
        nitroUnitPrice = calcSellingPrice(nitroProduct.price, markup);
        const supplierStock = stockMap[nitroProduct.product] ?? 0;
        const fromBalance = Math.floor(availableBalance / nitroProduct.price);
        nitroStock = Math.max(0, Math.min(supplierStock, fromBalance));
        nitroAvailable = nitroStock >= 2;
      }
    }

    // ── Discord Tokens ────────────────────────────────────────────
    let tokenUnitPrice: number | null = null;
    let tokenStock = 0;
    let tokenAvailable = false;

    if (prices && balance) {
      const tokenProduct = findPriceByKeywords(prices, 'discord', 'token')
        ?? findPriceByKeywords(prices, 'token');
      if (tokenProduct && !tokenProduct.admin_only) {
        const markup = getTokenMarkup();
        tokenUnitPrice = calcSellingPrice(tokenProduct.price, markup);
        const supplierStock = stockMap[tokenProduct.product] ?? 0;
        const fromBalance = Math.floor(availableBalance / tokenProduct.price);
        tokenStock = Math.max(0, Math.min(supplierStock, fromBalance));
        tokenAvailable = tokenStock >= 1;
      }
    }

    res.json({
      products: [
        {
          id: 'boost-1m',
          title: 'Server Boost - 1 Month',
          description: 'Instantly boost your Discord server with real Nitro accounts. Each boost lasts 1 month and delivers real perks.',
          available: boostAvailable,
          outOfStock: false,
          unitPrice: boostUnitPrice,
          stock: Math.min(boostStock, 50), // cap display at 50
          minQty: 2,
          maxQty: 50,
          inputType: 'buttons',
          category: 'boost',
          features: [
            'Hotmail / Outlook Tokens',
            'Untouched Tokens',
            '50% CAPTCHA',
            'No Join Locks',
            'Instant delivery',
          ],
        },
        {
          id: 'boost-3m',
          title: 'Server Boost - 3 Months',
          description: '3-month server boosts for extended perks and savings. Coming soon.',
          available: false,
          outOfStock: true,
          unitPrice: null,
          stock: 0,
          minQty: 2,
          maxQty: 50,
          inputType: 'buttons',
          category: 'boost',
          features: [
            'Hotmail / Outlook Tokens',
            'Untouched Tokens',
            '50% CAPTCHA',
            'No Join Locks',
            'Instant delivery',
          ],
        },
        {
          id: 'nitro-1m',
          title: 'Nitro Token - 1 Month',
          description: 'Fresh Discord Nitro accounts with 1 month of Nitro. Delivered as tokens you can use immediately.',
          available: nitroAvailable,
          outOfStock: false,
          unitPrice: nitroUnitPrice,
          stock: Math.min(nitroStock, 50),
          minQty: 2,
          maxQty: 50,
          inputType: 'input',
          category: 'nitro',
          features: [
            'Hotmail / Outlook Tokens',
            'Untouched Tokens',
            '50% CAPTCHA',
            'No Join Locks',
            'Instant delivery',
          ],
        },
        {
          id: 'nitro-3m',
          title: 'Nitro Token - 3 Months',
          description: '3-month Nitro tokens for extended use. Coming soon.',
          available: false,
          outOfStock: true,
          unitPrice: null,
          stock: 0,
          minQty: 2,
          maxQty: 50,
          inputType: 'input',
          category: 'nitro',
          features: [
            'Hotmail / Outlook Tokens',
            'Untouched Tokens',
            '50% CAPTCHA',
            'No Join Locks',
            'Instant delivery',
          ],
        },
        {
          id: 'discord-token',
          title: 'Discord Tokens',
          description: 'Aged Discord account tokens. Perfect for developers and power users who need ready-made accounts.',
          available: tokenAvailable,
          outOfStock: false,
          unitPrice: tokenUnitPrice,
          stock: Math.min(tokenStock, 500),
          minQty: 1,
          maxQty: 500,
          inputType: 'input',
          category: 'token',
          features: [
            'Hotmail / Outlook Tokens',
            'Untouched Tokens',
            '50% CAPTCHA',
            'No Join Locks',
            'Instant delivery',
          ],
        },
      ],
      // Indicate if data is live or degraded
      supplierAvailable: !!(balance && prices),
    });
  } catch (err) {
    console.error('[products] Error fetching product data:', err instanceof SupplierError ? err.message : err);
    // Return degraded response - all products show as unavailable rather than crashing
    const fallbackFeatures = [
      'Hotmail / Outlook Tokens',
      'Untouched Tokens',
      '50% CAPTCHA',
      'No Join Locks',
      'Instant delivery',
    ];
    res.json({
      products: [
        { id: 'boost-1m',    title: 'Server Boost - 1 Month',   available: false, outOfStock: false, unitPrice: null, stock: 0, minQty: 2, maxQty: 50, inputType: 'buttons', category: 'boost', features: fallbackFeatures },
        { id: 'boost-3m',    title: 'Server Boost - 3 Months',  available: false, outOfStock: true,  unitPrice: null, stock: 0, minQty: 2, maxQty: 50, inputType: 'buttons', category: 'boost', features: fallbackFeatures },
        { id: 'nitro-1m',    title: 'Nitro Token - 1 Month',    available: false, outOfStock: false, unitPrice: null, stock: 0, minQty: 2, maxQty: 50, inputType: 'input',   category: 'nitro', features: fallbackFeatures },
        { id: 'nitro-3m',    title: 'Nitro Token - 3 Months',   available: false, outOfStock: true,  unitPrice: null, stock: 0, minQty: 2, maxQty: 50, inputType: 'input',   category: 'nitro', features: fallbackFeatures },
        { id: 'discord-token', title: 'Discord Tokens',         available: false, outOfStock: false, unitPrice: null, stock: 0, minQty: 1, maxQty: 500, inputType: 'input',  category: 'token', features: fallbackFeatures },
      ],
      supplierAvailable: false,
    });
  }
});

// ── GET /api/stats ────────────────────────────────────────────────────────────
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await getStats();
    res.json({ totalBoostsSold: stats.totalBoostsSold });
  } catch {
    res.json({ totalBoostsSold: 0 });
  }
});

export default router;
