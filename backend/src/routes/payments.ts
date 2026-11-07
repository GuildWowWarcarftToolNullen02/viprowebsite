import { Router, type Request, type Response } from 'express';
import { randomUUID, createHmac, timingSafeEqual } from 'crypto';
import { Order } from '../db/models/Order.js';
import { createInvoice, getPaymentStatus } from '../lib/nowpayments.js';
import { createLicenseKey } from '../lib/keyauth.js';
import { sendPurchaseConfirmEmail } from '../lib/email.js';
import { validateNonce } from '../lib/nonce.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Strict rate limits - payment creation is sensitive
const createLimiter  = createRateLimiter(5,  60_000);  // 5 payment creations/min per IP
const statusLimiter  = createRateLimiter(30, 60_000);  // 30 status polls/min per IP
const ipnLimiter     = createRateLimiter(60, 60_000);  // 60 IPN calls/min (NowPayments webhook)

const VALID_PRODUCTS = ['token-g', 'raider'] as const;
const VALID_PLANS    = ['monthly', 'lifetime', 'source'] as const;

const PRODUCT_LABELS: Record<string, string> = {
  'token-g': 'MSK Token-G',
  'raider':  'MSK Raider Tool',
};

const PLAN_LABELS: Record<string, string> = {
  monthly:  'Monthly',
  lifetime: 'Lifetime',
  source:   'Source',
};

type OrderStatus = 'pending' | 'fulfilling' | 'paid' | 'failed' | 'expired';

function mapNowPaymentsStatus(s: string): OrderStatus {
  // 'finished' / 'confirmed' / 'sending' - payment is good, fulfill the order
  if (['finished', 'confirmed', 'sending'].includes(s)) return 'paid';
  // 'failed' / 'refunded' - not partially_paid (that means underpaid, not a failure we can fulfill)
  if (['failed', 'refunded'].includes(s)) return 'failed';
  if (s === 'expired') return 'expired';
  // Everything else - 'waiting', 'confirming', 'partially_paid', unknown → stay pending
  return 'pending';
}

async function fulfillOrder(
  orderId: string,
  product: string,
  plan: string,
  email: string,
  userNote?: string,
): Promise<string | undefined> {
  try {
    const noteParts = [
      `${PRODUCT_LABELS[product] || product} - ${PLAN_LABELS[plan] || plan}`,
      email,
      `Order: ${orderId}`,
      ...(userNote?.trim() ? [`User: ${userNote.trim()}`] : []),
    ];
    const note = noteParts.join(' | ');
    const key = await createLicenseKey(product, plan, note);
    const appBaseUrl = process.env['APP_URL'] || 'https://mskhub.store';
    sendPurchaseConfirmEmail(
      email,
      key,
      PRODUCT_LABELS[product] || product,
      PLAN_LABELS[plan] || plan,
      appBaseUrl,
    ).catch((err) => console.error('[payments] Email send failed:', err));
    return key;
  } catch (err) {
    console.error(`[payments] KeyAuth fulfillment failed for order ${orderId}:`, err);
    return undefined;
  }
}

// ── POST /api/payments/create ────────────────────────────────────
//
// Security measures:
// 1. Replay prevention - X-Request-Timestamp + X-Request-Nonce headers required
// 2. Server-side product/plan/price validation (never trust client-side prices)
// 3. Per-IP rate limiting (5 req/min)
// 4. Input sanitization and strict field validation
// 5. All payment logic server-side only; invoice URL comes from NowPayments API

// ── POST /api/payments/create-cart ─────────────────────────────
// Create payment for multiple cart items (Exudos products)
router.post('/create-cart', createLimiter, async (req: Request, res: Response) => {
  try {
    const { cartItems, email } = req.body as {
      cartItems?: Array<{
        productId: number;
        variantId: number;
        productName: string;
        category: string;
        quantity: number;
        price: number;
      }>;
      email?: string;
    };

    // Validation
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      res.status(400).json({ error: 'Cart is empty' });
      return;
    }

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || email.length > 254) {
      res.status(400).json({ error: 'Invalid email address' });
      return;
    }

    // Calculate total and validate items
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of cartItems) {
      if (!item.productId || !item.variantId || !item.quantity || !item.price) {
        res.status(400).json({ error: 'Invalid cart item data' });
        return;
      }

      if (item.quantity < 1 || item.quantity > 100) {
        res.status(400).json({ error: 'Invalid quantity' });
        return;
      }

      const itemTotal = item.price * item.quantity;
      totalAmount += itemTotal;

      validatedItems.push({
        productId: item.productId,
        variantId: item.variantId,
        productName: item.productName,
        category: item.category,
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: itemTotal,
      });
    }

    const internalId = randomUUID();
    const userId = (req.session as any).userId;

    // Create ExudosOrders for each cart item
    const { ExudosOrder } = await import('../db/models/ExudosOrder.js');
    const { calcExudosSellingPrice } = await import('../lib/exudos.js');

    const orderPromises = validatedItems.map(item =>
      ExudosOrder.create({
        internalId: `${internalId}-${item.productId}-${item.variantId}`,
        email: email.toLowerCase(),
        userId,
        productId: item.productId,
        variantId: item.variantId,
        productName: item.productName,
        category: item.category,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        supplierCost: item.totalPrice / 1.4, // Reverse markup
        status: 'pending',
        idempotencyKey: randomUUID(),
        retryCount: 0,
      })
    );

    await Promise.all(orderPromises);

    // Create NowPayments invoice
    const base = process.env['APP_URL'] || 'https://mskhub.store';
    const description = `MSK Hub Store - ${validatedItems.length} item(s)`;

    const invoiceRes = await fetch('https://api.nowpayments.io/v1/invoice', {
      method: 'POST',
      headers: {
        'x-api-key': process.env['NOWPAYMENTS_API_KEY'] || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        price_amount: totalAmount,
        price_currency: 'usd',
        order_id: internalId,
        order_description: description,
        ipn_callback_url: `${base}/api/payments/ipn`,
        success_url: `${base}/orders/${internalId}`,
        cancel_url: `${base}/store`,
      }),
    });

    if (!invoiceRes.ok) {
      throw new Error('Payment creation failed');
    }

    const invoiceData = await invoiceRes.json() as { id: string; invoice_url: string };

    // Store payment info in first order (as reference)
    await ExudosOrder.updateOne(
      { internalId: `${internalId}-${validatedItems[0].productId}-${validatedItems[0].variantId}` },
      { $set: { nowPaymentsPaymentId: String(invoiceData.id) } }
    );

    res.json({
      success: true,
      invoiceUrl: invoiceData.invoice_url,
      paymentId: internalId,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
    });

  } catch (error) {
    console.error('[payments/create-cart] Error:', error);
    res.status(500).json({ error: 'Unable to create payment' });
  }
});

router.post('/create', createLimiter, async (req: Request, res: Response) => {
  // ── Replay attack prevention ──────────────────────────────────
  const nonceResult = validateNonce(
    req.headers['x-request-timestamp'] as string | undefined,
    req.headers['x-request-nonce']     as string | undefined,
  );
  if (!nonceResult.valid) {
    res.status(400).json({ error: nonceResult.error ?? 'Invalid request signature.' });
    return;
  }

  const { product, plan, email, note } = req.body as Record<string, string>;

  // ── Strict input validation - never trust client data ─────────
  if (!product || !plan || !email) {
    res.status(400).json({ error: 'Missing required fields.' });
    return;
  }

  if (!(VALID_PRODUCTS as readonly string[]).includes(product)) {
    res.status(400).json({ error: 'Invalid product.' });
    return;
  }

  if (!(VALID_PLANS as readonly string[]).includes(plan)) {
    res.status(400).json({ error: 'Invalid plan.' });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email) || email.length > 254) {
    res.status(400).json({ error: 'Invalid email address.' });
    return;
  }

  if (note && note.length > 200) {
    res.status(400).json({ error: 'Note too long (max 200 characters).' });
    return;
  }

  try {
    const internalId = randomUUID();

    // Price comes from server-side config in nowpayments.ts - never from the request
    const { invoiceUrl, paymentId, amountUsd } = await createInvoice({
      product, plan, email, internalId, note: note?.trim(),
    });

    await Order.create({
      internalId,
      email: email.toLowerCase(),
      product,
      plan,
      status: 'pending',
      nowPaymentsPaymentId: paymentId,
      amountUsd,
      userNote: note?.trim() || undefined,
    });

    res.json({ invoiceUrl, orderId: internalId });
  } catch {
    // Never expose internal error details to the client
    res.status(500).json({ error: 'Could not create payment. Please try again.' });
  }
});

// ── GET /api/payments/status/:orderId ────────────────────────────

router.get('/status/:orderId', statusLimiter, async (req: Request, res: Response) => {
  const orderId = String(req.params.orderId);

  // Basic orderId validation (UUID format)
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) {
    res.status(400).json({ error: 'Invalid order ID.' });
    return;
  }

  try {
    const order = await Order.findOne({ internalId: orderId });
    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    // Already finalized - return immediately
    if (['paid', 'failed', 'expired'].includes(order.status)) {
      res.json({ status: order.status, key: order.licenseKey, product: order.product, plan: order.plan });
      return;
    }

    // Fulfillment already in progress (claimed by another concurrent request)
    if (order.status === 'fulfilling') {
      res.json({ status: 'pending', product: order.product, plan: order.plan });
      return;
    }

    // Poll NowPayments for fresh status
    if (order.nowPaymentsPaymentId || order.nowPaymentsRealPaymentId) {
      try {
        const nowStatus = await getPaymentStatus({ 
          paymentId: order.nowPaymentsRealPaymentId, 
          invoiceId: order.nowPaymentsPaymentId 
        });
        const mapped = mapNowPaymentsStatus(nowStatus);

        if (mapped !== 'pending') {
          let key = order.licenseKey;

          if (mapped === 'paid' && !key) {
            // Stale fulfilling orders (>2 min old) can be claimed again
            const STALE = new Date(Date.now() - 2 * 60_000);
            
            // Atomic claim: only one caller gets to fulfill
            const claimed = await Order.findOneAndUpdate(
              {
                _id: order._id,
                licenseKey: { $exists: false },
                $or: [
                  { status: 'pending' },
                  { status: 'fulfilling', updatedAt: { $lt: STALE } },
                ],
              },
              { $set: { status: 'fulfilling', updatedAt: new Date() } },
            );
            
            if (claimed) {
              key = await fulfillOrder(orderId, order.product, order.plan, order.email, order.userNote);
              
              // If fulfillment failed, revert to pending so it can retry
              if (!key) {
                await Order.updateOne(
                  { _id: order._id },
                  { $set: { status: 'pending', updatedAt: new Date() } },
                );
                res.json({ status: 'pending', product: order.product, plan: order.plan });
                return;
              }
            } else {
              // Another process is already fulfilling or has fulfilled - re-read the order
              const fresh = await Order.findOne({ internalId: orderId });
              key = fresh?.licenseKey;
            }
          }

          // Only mark paid if we have a key
          const finalStatus = (mapped === 'paid' && !key) ? 'pending' : mapped;

          await Order.updateOne(
            { _id: order._id },
            { $set: { status: finalStatus, licenseKey: key, updatedAt: new Date() } },
          );

          res.json({ status: finalStatus, key, product: order.product, plan: order.plan });
          return;
        }
      } catch (pollErr) {
        console.error('[payments/status] NowPayments poll error:', pollErr);
      }
    }

    res.json({ status: order.status, product: order.product, plan: order.plan });
  } catch {
    res.status(500).json({ error: 'Status check failed.' });
  }
});

// ── POST /api/payments/ipn ── NowPayments webhook ────────────────
//
// This endpoint is excluded from nonce validation - NowPayments server
// cannot add custom headers. Security is provided by HMAC-SHA512 signature.
// It is also excluded from IP reputation checks (NowPayments IPs vary).

router.post('/ipn', ipnLimiter, async (req: Request, res: Response) => {
  const ipnSecret = process.env['NOWPAYMENTS_IPN_SECRET'];

  // IPN secret is MANDATORY - reject all IPN calls if not configured
  if (!ipnSecret) {
    console.error('[payments/ipn] NOWPAYMENTS_IPN_SECRET not configured - rejecting IPN request');
    res.status(503).send('IPN not configured');
    return;
  }

  const sig = req.headers['x-nowpayments-sig'] as string | undefined;
  if (!sig) {
    res.status(400).send('Missing signature');
    return;
  }

  // NowPayments HMAC: SHA512 of deep-sorted JSON body
  const sorted   = JSON.stringify(sortDeep(req.body as Record<string, unknown>));
  const expected = createHmac('sha512', ipnSecret).update(sorted).digest('hex');

  // Use timing-safe comparison to prevent timing attacks
  const sigBuf      = Buffer.from(sig,      'hex');
  const expectedBuf = Buffer.from(expected, 'hex');
  const sigValid = sigBuf.length === expectedBuf.length &&
    timingSafeEqual(sigBuf, expectedBuf);

  if (!sigValid) {
    console.warn('[payments/ipn] Invalid IPN signature');
    res.status(401).send('Invalid signature');
    return;
  }

  const { order_id: orderId, payment_status: paymentStatus, payment_id: paymentId } = req.body as {
    order_id?: string;
    payment_status?: string;
    payment_id?: string;
  };

  if (!orderId || !paymentStatus) {
    res.status(400).send('Missing fields');
    return;
  }

  // Validate orderId format before DB query
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) {
    res.status(400).send('Invalid order ID');
    return;
  }

  try {
    const { ExudosOrder } = await import('../db/models/ExudosOrder.js');
    const { createExudosOrder } = await import('../lib/exudos.js');
    const { Cart } = await import('../db/models/Cart.js');

    // Check if this is a cart-based order (multiple Exudos items)
    const exudosOrders = await ExudosOrder.find({ 
      internalId: { $regex: `^${orderId}-` } 
    });

    if (exudosOrders.length > 0) {
      // Multi-product cart order
      console.log(`[payments/ipn] Processing cart order ${orderId} with ${exudosOrders.length} items`);

      const mapped = mapNowPaymentsStatus(paymentStatus);

      if (mapped === 'paid') {
        // Process each cart item
        for (const order of exudosOrders) {
          // Skip if already completed
          if (order.status === 'completed') {
            continue;
          }

          // Update to processing
          await ExudosOrder.updateOne(
            { _id: order._id },
            { $set: { status: 'processing', paidAt: new Date(), updatedAt: new Date() } }
          );

          try {
            // Place order with Exudos
            const result = await createExudosOrder(
              order.productId,
              order.variantId,
              order.quantity,
              order.idempotencyKey
            );

            if (result.success) {
              // Save delivery content
              await ExudosOrder.updateOne(
                { _id: order._id },
                { 
                  $set: { 
                    status: 'completed',
                    exudosInvoiceId: result.data.invoice_id || undefined,
                    deliveredContent: result.data.delivered,
                    deliveredAt: new Date(),
                    updatedAt: new Date(),
                  }
                }
              );
              console.log(`[payments/ipn] Order ${order.internalId} fulfilled successfully`);
            } else {
              // Mark as failed
              await ExudosOrder.updateOne(
                { _id: order._id },
                { 
                  $set: { 
                    status: 'failed',
                    errorMessage: result.error,
                    updatedAt: new Date(),
                  },
                  $inc: { retryCount: 1 }
                }
              );
              console.error(`[payments/ipn] Order ${order.internalId} failed:`, result.error);
            }
          } catch (error) {
            console.error(`[payments/ipn] Error processing order ${order.internalId}:`, error);
            await ExudosOrder.updateOne(
              { _id: order._id },
              { 
                $set: { 
                  status: 'failed',
                  errorMessage: 'Order processing failed',
                  updatedAt: new Date(),
                },
                $inc: { retryCount: 1 }
              }
            );
          }
        }

        // Clear user's cart after successful payment
        if (exudosOrders[0].userId) {
          await Cart.deleteOne({ userId: exudosOrders[0].userId });
        } else if (exudosOrders[0].email) {
          await Cart.deleteOne({ email: exudosOrders[0].email });
        }
      }

      res.sendStatus(200);
      return;
    }

    // Single MSK tool order (existing logic)
    const order = await Order.findOne({ internalId: orderId });
    if (!order) {
      res.status(404).send('Order not found');
      return;
    }

    // Store the real payment_id from IPN for future status lookups
    if (paymentId && !order.nowPaymentsRealPaymentId) {
      await Order.updateOne({ _id: order._id }, { $set: { nowPaymentsRealPaymentId: String(paymentId) } });
    }

    // Already fulfilled with a key - acknowledge and skip
    if (order.status === 'paid' && order.licenseKey) {
      res.sendStatus(200);
      return;
    }

    const mapped = mapNowPaymentsStatus(paymentStatus);
    let key = order.licenseKey;

    if (mapped === 'paid' && !key) {
      // Stale fulfilling orders (>2 min old) can be claimed again
      const STALE = new Date(Date.now() - 2 * 60_000);
      
      // Atomic claim: only one caller gets to fulfill (prevents race with /status poller)
      const claimed = await Order.findOneAndUpdate(
        {
          _id: order._id,
          licenseKey: { $exists: false },
          $or: [
            { status: 'pending' },
            { status: 'fulfilling', updatedAt: { $lt: STALE } },
          ],
        },
        { $set: { status: 'fulfilling', updatedAt: new Date() } },
      );
      
      if (claimed) {
        key = await fulfillOrder(orderId, order.product, order.plan, order.email, order.userNote);
        
        // If fulfillment failed, revert to pending and return 500 so NowPayments retries
        if (!key) {
          await Order.updateOne(
            { _id: order._id },
            { $set: { status: 'pending', updatedAt: new Date() } },
          );
          res.status(500).send('Fulfillment failed, will retry');
          return;
        }
      } else {
        // Already claimed by another process - check if it succeeded
        const fresh = await Order.findOne({ internalId: orderId });
        key = fresh?.licenseKey;
      }
    }

    // Only mark paid if we have a key
    const finalStatus = (mapped === 'paid' && !key) ? 'pending' : mapped;

    await Order.updateOne({ _id: order._id }, {
      $set: { status: finalStatus, licenseKey: key, updatedAt: new Date() },
    });

    res.sendStatus(200);
  } catch (error) {
    console.error('[payments/ipn] Error:', error);
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
