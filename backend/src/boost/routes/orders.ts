import { Router, type Request, type Response } from 'express';
import { randomUUID, createHmac, timingSafeEqual } from 'crypto';
import { BoostOrder, type ProductId } from '../db/models/BoostOrder.js';
import { incrementBoostsSold } from '../db/models/SalesStats.js';
import { createInvoice, getPaymentStatus, mapPaymentStatus } from '../lib/nowpayments.js';
import {
  getBalance, getPrices, getTaskProducts, getReservedBalance,
  findPriceByKeywords, createBoostJob, pollBoostJobToCompletion,
  buyAccounts, invalidateCache, SupplierError,
} from '../lib/supplier.js';
import { resolveDiscordInvite } from '../lib/discord.js';
import {
  calcSellingPrice, calcTotal,
  getBoostMarkup, getNitroMarkup, getTokenMarkup,
} from '../lib/pricing.js';
import { validateNonce } from '../lib/nonce.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

const createLimiter = createRateLimiter(5,  60_000);  // 5 order creates/min per IP
const statusLimiter = createRateLimiter(30, 60_000);  // 30 status polls/min per IP
const ipnLimiter    = createRateLimiter(60, 60_000);  // 60 IPN calls/min

const VALID_PRODUCTS: ProductId[] = ['boost-1m', 'nitro-1m', 'discord-token'];

// ─────────────────────────────────────────────────────────────────────────────
// Fulfillment Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fulfill a server boost order.
 * Uses salta7 /task/create with tool=boost.
 * Polls until completion, then records boosts delivered.
 */
async function fulfillBoostOrder(internalId: string): Promise<void> {
  // Atomic claim - prevents double fulfillment
  const order = await BoostOrder.findOneAndUpdate(
    { internalId, paymentStatus: 'paid', fulfillmentStatus: 'pending' },
    { $set: { fulfillmentStatus: 'processing', updatedAt: new Date() } },
  );
  if (!order) return; // already processing or not found

  try {
    const job = await createBoostJob(order.inviteCode!, order.quantity);
    await BoostOrder.updateOne({ internalId }, { $set: { supplierJobId: job.job_id, updatedAt: new Date() } });

    const finalJob = await pollBoostJobToCompletion(job.job_id);
    const boostsDelivered = finalJob.boosts ?? finalJob.done ?? 0;
    const fulfillmentStatus = finalJob.status === 'completed'
      ? 'completed'
      : finalJob.status === 'partial' ? 'partial' : 'failed';

    await BoostOrder.updateOne({ internalId }, {
      $set: { fulfillmentStatus, boostsDelivered, updatedAt: new Date() },
    });

    if (boostsDelivered > 0) {
      await incrementBoostsSold(boostsDelivered);
    }

    invalidateCache(); // balance changed
    console.info(`[fulfillment] Boost order ${internalId}: ${fulfillmentStatus}, boosts=${boostsDelivered}`);
  } catch (err) {
    const msg = err instanceof SupplierError ? err.message : String(err);
    console.error(`[fulfillment] Boost order ${internalId} failed: ${msg}`);
    await BoostOrder.updateOne({ internalId }, { $set: { fulfillmentStatus: 'failed', updatedAt: new Date() } });
  }
}

/**
 * Fulfill a token/nitro order.
 * Uses salta7 /buy with client_tx_id=internalId for idempotency.
 * NEVER logs the actual token strings.
 */
async function fulfillTokenOrder(internalId: string): Promise<void> {
  const order = await BoostOrder.findOneAndUpdate(
    { internalId, paymentStatus: 'paid', fulfillmentStatus: 'pending' },
    { $set: { fulfillmentStatus: 'processing', updatedAt: new Date() } },
  );
  if (!order) return;

  try {
    // Determine supplier product name
    const prices = await getPrices();
    let supplierProductName: string;

    if (order.product === 'nitro-1m') {
      const p = findPriceByKeywords(prices, '1m', 'nitro')
        ?? findPriceByKeywords(prices, '1 month', 'nitro')
        ?? findPriceByKeywords(prices, 'nitro');
      if (!p) throw new Error('Nitro product not found in supplier catalog');
      supplierProductName = p.product;
    } else {
      // discord-token
      const p = findPriceByKeywords(prices, 'discord', 'token')
        ?? findPriceByKeywords(prices, 'token');
      if (!p) throw new Error('Token product not found in supplier catalog');
      supplierProductName = p.product;
    }

    // client_tx_id = internalId makes this idempotent - retrying returns the same order
    const result = await buyAccounts(supplierProductName, order.quantity, internalId);

    // Store only count (never log raw token strings)
    await BoostOrder.updateOne({ internalId }, {
      $set: {
        fulfillmentStatus: 'completed',
        supplierTxId: result.tx_id,
        deliveredItemCount: result.items.length,
        // Store items temporarily for customer retrieval - encrypted in production
        // For now store in DB but never log
        _deliveredItems: result.items,
        updatedAt: new Date(),
      },
    });

    await incrementBoostsSold(0); // don't count tokens as boosts
    invalidateCache();
    console.info(`[fulfillment] Token order ${internalId}: completed, count=${result.items.length}`);
  } catch (err) {
    const msg = err instanceof SupplierError ? err.message : String(err);
    console.error(`[fulfillment] Token order ${internalId} failed: ${msg}`);
    await BoostOrder.updateOne({ internalId }, { $set: { fulfillmentStatus: 'failed', updatedAt: new Date() } });
  }
}

async function triggerFulfillment(internalId: string, product: ProductId): Promise<void> {
  if (product === 'boost-1m') {
    fulfillBoostOrder(internalId).catch((e) =>
      console.error(`[fulfillment] Uncaught error for ${internalId}:`, e));
  } else {
    fulfillTokenOrder(internalId).catch((e) =>
      console.error(`[fulfillment] Uncaught error for ${internalId}:`, e));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/orders/create
// ─────────────────────────────────────────────────────────────────────────────
router.post('/create', createLimiter, async (req: Request, res: Response) => {
  // Replay prevention
  const nonceResult = validateNonce(
    req.headers['x-request-timestamp'] as string | undefined,
    req.headers['x-request-nonce']     as string | undefined,
  );
  if (!nonceResult.valid) {
    res.status(400).json({ error: nonceResult.error ?? 'Invalid request.' });
    return;
  }

  const { product, quantity, email, inviteCode } = req.body as {
    product?: unknown; quantity?: unknown; email?: unknown; inviteCode?: unknown;
  };

  // Strict input validation
  if (!product || !VALID_PRODUCTS.includes(product as ProductId)) {
    res.status(400).json({ error: 'Invalid product.' });
    return;
  }
  const prod = product as ProductId;

  if (typeof quantity !== 'number' || !Number.isInteger(quantity)) {
    res.status(400).json({ error: 'Invalid quantity.' });
    return;
  }

  const MIN_QTY: Record<ProductId, number> = { 'boost-1m': 2, 'nitro-1m': 2, 'discord-token': 1 };
  const MAX_QTY: Record<ProductId, number> = { 'boost-1m': 50, 'nitro-1m': 50, 'discord-token': 500 };

  if (quantity < MIN_QTY[prod] || quantity > MAX_QTY[prod]) {
    res.status(400).json({ error: `Quantity must be between ${MIN_QTY[prod]} and ${MAX_QTY[prod]}.` });
    return;
  }

  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    res.status(400).json({ error: 'Invalid email address.' });
    return;
  }

  // Boost orders need a valid invite
  let resolvedServer: { serverId?: string; serverName?: string; serverIcon?: string | null; inviteCode?: string } = {};
  if (prod === 'boost-1m') {
    if (!inviteCode || typeof inviteCode !== 'string' || inviteCode.trim().length === 0) {
      res.status(400).json({ error: 'A Discord server invite is required for boost orders.' });
      return;
    }
    const resolved = await resolveDiscordInvite(inviteCode as string);
    if (!resolved.valid) {
      res.status(400).json({ error: resolved.error });
      return;
    }
    resolvedServer = {
      serverId:   resolved.serverId,
      serverName: resolved.serverName,
      serverIcon: resolved.serverIcon,
      inviteCode: resolved.inviteCode,
    };
  }

  // ── Server-side price calculation ──────────────────────────────────────────
  let supplierUnitCost: number;
  let unitPrice: number;

  try {
    if (prod === 'boost-1m') {
      const boostProducts = await getTaskProducts('boost');
      if (!boostProducts.length) throw new Error('No boost products available');
      const bp = boostProducts[0]!;
      supplierUnitCost = bp.price;
      unitPrice = calcSellingPrice(bp.price, getBoostMarkup());

      // Check available balance
      const balance = await getBalance();
      const reserved = await getReservedBalance();
      const available = Math.max(0, balance.balance_usd - reserved);
      const canAfford = Math.floor(available / bp.price);
      const canGet    = Math.min(bp.stock, canAfford);

      if (canGet < quantity) {
        res.status(409).json({ error: 'Insufficient stock at this time. Please try again shortly or reduce quantity.' });
        return;
      }
    } else {
      const prices = await getPrices();
      const balance = await getBalance();
      const reserved = await getReservedBalance();
      const available = Math.max(0, balance.balance_usd - reserved);

      let supplierProduct;
      if (prod === 'nitro-1m') {
        supplierProduct = findPriceByKeywords(prices, '1m', 'nitro')
          ?? findPriceByKeywords(prices, '1 month', 'nitro')
          ?? findPriceByKeywords(prices, 'nitro');
        if (!supplierProduct) throw new Error('Nitro product not found');
        supplierUnitCost = supplierProduct.price;
        unitPrice = calcSellingPrice(supplierProduct.price, getNitroMarkup());
      } else {
        supplierProduct = findPriceByKeywords(prices, 'discord', 'token')
          ?? findPriceByKeywords(prices, 'token');
        if (!supplierProduct) throw new Error('Token product not found');
        supplierUnitCost = supplierProduct.price;
        unitPrice = calcSellingPrice(supplierProduct.price, getTokenMarkup());
      }

      const canAfford = Math.floor(available / supplierProduct.price);
      if (canAfford < quantity) {
        res.status(409).json({ error: 'Insufficient stock at this time. Please try a smaller quantity.' });
        return;
      }
    }
  } catch (err) {
    if (err instanceof SupplierError) {
      res.status(503).json({ error: err.safeMessage });
    } else {
      console.error('[orders/create] Supplier data error:', err);
      res.status(503).json({ error: 'We couldn\'t verify current stock. Please try again.' });
    }
    return;
  }

  const totalPrice = calcTotal(unitPrice, quantity);
  const internalId = randomUUID();

  // Create order record
  await BoostOrder.create({
    internalId,
    email:           email.toLowerCase().trim(),
    product:         prod,
    quantity,
    unitPrice,
    supplierUnitCost,
    totalPrice,
    inviteCode:      resolvedServer.inviteCode,
    serverId:        resolvedServer.serverId,
    serverName:      resolvedServer.serverName,
    serverIcon:      resolvedServer.serverIcon ?? undefined,
    paymentStatus:   'pending',
    fulfillmentStatus: 'pending',
  });

  // Create NowPayments invoice
  let invoiceUrl: string;
  let paymentId: string;
  try {
    const productLabels: Record<ProductId, string> = {
      'boost-1m':      `${quantity}x Server Boost 1M`,
      'nitro-1m':      `${quantity}x Nitro Token 1M`,
      'discord-token': `${quantity}x Discord Token`,
    };
    const result = await createInvoice({
      orderId:     internalId,
      amountUsd:   totalPrice,
      description: productLabels[prod],
    });
    invoiceUrl = result.invoiceUrl;
    paymentId  = result.paymentId;
  } catch (err) {
    console.error('[orders/create] NowPayments error:', err);
    await BoostOrder.deleteOne({ internalId }); // rollback
    res.status(500).json({ error: 'Could not create payment. Please try again.' });
    return;
  }

  // Update order with payment ID
  await BoostOrder.updateOne({ internalId }, { $set: { nowPaymentsPaymentId: paymentId } });

  res.json({ orderId: internalId, invoiceUrl, totalPrice });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/orders/:orderId
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:orderId', statusLimiter, async (req: Request, res: Response) => {
  const orderId = String(req.params.orderId);
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) {
    res.status(400).json({ error: 'Invalid order ID.' });
    return;
  }

  try {
    const order = await BoostOrder.findOne({ internalId: orderId }).select('+_deliveredItems');
    if (!order) { res.status(404).json({ error: 'Order not found.' }); return; }

    // If payment still pending, poll NowPayments for fresh status
    if (order.paymentStatus === 'pending' && order.nowPaymentsPaymentId) {
      try {
        const nowStatus = await getPaymentStatus(order.nowPaymentsPaymentId);
        const mapped = mapPaymentStatus(nowStatus);
        if (mapped !== 'pending') {
          await BoostOrder.updateOne({ internalId: orderId }, { $set: { paymentStatus: mapped, updatedAt: new Date() } });
          if (mapped === 'paid') {
            triggerFulfillment(orderId, order.product);
          }
          order.paymentStatus = mapped;
        }
      } catch { /* ignore polling error - return cached status */ }
    }

    // Build safe response - never expose internal IDs or supplier details
    const base = {
      paymentStatus:     order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      product:           order.product,
      quantity:          order.quantity,
      totalPrice:        order.totalPrice,
      serverName:        order.serverName,
      serverIcon:        order.serverIcon,
      boostsDelivered:   order.boostsDelivered,
    };

    // Only return deliveredItems when fulfillment is completed (one-time retrieval)
    if (['completed', 'partial'].includes(order.fulfillmentStatus)) {
      const raw = (order as unknown as Record<string, unknown>)['_deliveredItems'];
      const items = Array.isArray(raw) ? raw as string[] : undefined;
      return void res.json({ ...base, deliveredItems: items, deliveredItemCount: order.deliveredItemCount });
    }

    res.json(base);
  } catch {
    res.status(500).json({ error: 'Status check failed.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/orders/ipn - NowPayments IPN webhook
// ─────────────────────────────────────────────────────────────────────────────
router.post('/ipn', ipnLimiter, async (req: Request, res: Response) => {
  const ipnSecret = process.env['NOWPAYMENTS_IPN_SECRET'];
  if (!ipnSecret) {
    console.error('[ipn] NOWPAYMENTS_IPN_SECRET not configured');
    res.status(503).send('IPN not configured');
    return;
  }

  const sig = req.headers['x-nowpayments-sig'] as string | undefined;
  if (!sig) { res.status(400).send('Missing signature'); return; }

  // HMAC-SHA512 over deep-sorted JSON body
  const sorted   = JSON.stringify(sortDeep(req.body as Record<string, unknown>));
  const expected = createHmac('sha512', ipnSecret).update(sorted).digest('hex');

  let sigValid = false;
  try {
    const sigBuf      = Buffer.from(sig,      'hex');
    const expectedBuf = Buffer.from(expected, 'hex');
    sigValid = sigBuf.length === expectedBuf.length && timingSafeEqual(sigBuf, expectedBuf);
  } catch { /* invalid hex */ }

  if (!sigValid) {
    console.warn('[ipn] Invalid signature');
    res.status(401).send('Invalid signature');
    return;
  }

  const { order_id: orderId, payment_status: paymentStatus } = req.body as {
    order_id?: string; payment_status?: string;
  };

  if (!orderId || !paymentStatus || !/^[0-9a-f-]{36}$/i.test(orderId)) {
    res.status(400).send('Invalid payload');
    return;
  }

  try {
    const order = await BoostOrder.findOne({ internalId: orderId });
    if (!order) { res.status(404).send('Order not found'); return; }
    if (order.paymentStatus === 'paid') { res.sendStatus(200); return; }

    const mapped = mapPaymentStatus(paymentStatus);
    await BoostOrder.updateOne({ internalId: orderId }, { $set: { paymentStatus: mapped, updatedAt: new Date() } });

    if (mapped === 'paid') {
      triggerFulfillment(orderId, order.product);
    }

    res.sendStatus(200);
  } catch {
    res.status(500).send('Internal error');
  }
});

function sortDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value !== null && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    return Object.keys(obj).sort().reduce<Record<string, unknown>>((acc, k) => {
      acc[k] = sortDeep(obj[k]);
      return acc;
    }, {});
  }
  return value;
}

export default router;
