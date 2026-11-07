import { Router, type Request, type Response } from 'express';
import { 
  getExudosProducts, 
  createExudosOrder, 
  calcExudosSellingPrice,
  categorizeProduct,
  isApprovedProduct,
  validateExudosPrice,
  type ExudosProduct,
} from '../lib/exudos.js';
import { ExudosOrder } from '../db/models/ExudosOrder.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';
import { randomUUID } from 'crypto';

const router = Router();

// Rate limiters
const productsLimiter = createRateLimiter(60, 60_000); // 60 req/min
const orderLimiter = createRateLimiter(10, 60_000); // 10 orders/min

// In-memory cache for products (refresh every 5 minutes)
let productsCache: { data: any; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * GET /api/exudos/products
 * Get all approved Exudos products with MSK Hub pricing.
 * 
 * COMPLETELY WHITE-LABELED: No Exudos branding exposed.
 */
router.get('/products', productsLimiter, async (_req: Request, res: Response) => {
  try {
    // Check cache first
    const now = Date.now();
    if (productsCache && (now - productsCache.timestamp) < CACHE_TTL) {
      res.json(productsCache.data);
      return;
    }

    // Fetch fresh products from Exudos
    const result = await getExudosProducts('USD');
    
    if (!result.success) {
      console.error('[Exudos Products] Failed to fetch:', result.error);
      res.status(503).json({ 
        error: 'Unable to load products at this time. Please try again later.' 
      });
      return;
    }

    // Filter and transform products for MSK Hub display
    const approvedProducts = result.data.data
      .filter(p => isApprovedProduct(p.name))
      .map(p => ({
        id: p.id,
        name: p.name,
        category: categorizeProduct(p.name),
        variants: p.variants
          .filter(v => v.price !== null && (v.stock === null || v.stock > 0))
          .map(v => ({
            id: v.id,
            name: v.name, // Variant name from Exudos API (e.g., "10M Credits", "1 Month")
            price: calcExudosSellingPrice(v.price!),
            originalPrice: v.list_price ? calcExudosSellingPrice(v.list_price) : null,
            stock: v.stock,
            inStock: v.stock === null || v.stock > 0,
          })),
      }))
      .filter(p => p.variants.length > 0); // Only products with available variants

    // Group by category
    const categorized: Record<string, any[]> = {};
    approvedProducts.forEach(p => {
      if (!categorized[p.category]) {
        categorized[p.category] = [];
      }
      categorized[p.category].push(p);
    });

    const response = {
      categories: categorized,
      total: approvedProducts.length,
    };

    // Cache the response
    productsCache = { data: response, timestamp: now };

    res.json(response);

  } catch (error) {
    console.error('[Exudos Products] Error:', error);
    res.status(500).json({ 
      error: 'Unable to load products. Please try again later.' 
    });
  }
});

/**
 * GET /api/exudos/product/:productId
 * Get detailed product information.
 * 
 * WHITE-LABELED: Returns product details without Exudos branding.
 */
router.get('/product/:productId', productsLimiter, async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.productId);
    if (isNaN(productId)) {
      res.status(400).json({ error: 'Invalid product ID' });
      return;
    }

    const result = await getExudosProducts('USD');
    if (!result.success) {
      res.status(503).json({ error: 'Unable to load product details. Please try again later.' });
      return;
    }

    const product = result.data.data.find(p => p.id === productId);
    if (!product || !isApprovedProduct(product.name)) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const response = {
      id: product.id,
      name: product.name,
      category: categorizeProduct(product.name),
      variants: product.variants
        .filter(v => v.price !== null)
        .map(v => ({
          id: v.id,
          price: calcExudosSellingPrice(v.price!),
          originalPrice: v.list_price ? calcExudosSellingPrice(v.list_price) : null,
          stock: v.stock,
          inStock: v.stock === null || v.stock > 0,
        })),
    };

    res.json(response);

  } catch (error) {
    console.error('[Exudos Product Detail] Error:', error);
    res.status(500).json({ error: 'Unable to load product details.' });
  }
});

/**
 * POST /api/exudos/orders/create
 * Create an Exudos order after payment is confirmed.
 * 
 * CRITICAL: This is called internally after NowPayments confirms payment.
 * NOT exposed directly to customers.
 * 
 * SECURITY: Server-side price validation prevents price manipulation.
 */
router.post('/orders/create', orderLimiter, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body as { orderId: string };

    if (!orderId) {
      res.status(400).json({ error: 'Order ID required' });
      return;
    }

    // Find the order
    const order = await ExudosOrder.findOne({ internalId: orderId });
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    // Check if already processing or completed
    if (order.status !== 'paid') {
      res.json({ status: order.status, message: 'Order already processed' });
      return;
    }

    // SERVER-SIDE PRICE VALIDATION: Verify pricing before placing order
    const priceValidation = await validateExudosPrice(order.productId, order.variantId);
    
    if (!priceValidation.success) {
      console.error('[Exudos Order] Price validation failed:', priceValidation.error);
      
      await ExudosOrder.updateOne(
        { _id: order._id },
        { 
          $set: { 
            status: 'failed', 
            errorMessage: 'Product no longer available',
            updatedAt: new Date() 
          }
        }
      );
      
      res.status(400).json({ error: 'Product no longer available' });
      return;
    }

    // Verify the supplier cost matches what we stored (prevent price manipulation)
    const expectedCost = priceValidation.supplierCost * order.quantity;
    const costDifference = Math.abs(order.supplierCost - expectedCost);
    
    if (costDifference > 0.01) {
      console.error('[Exudos Order] Price mismatch:', {
        stored: order.supplierCost,
        actual: expectedCost,
        productId: order.productId,
        variantId: order.variantId,
      });
      
      await ExudosOrder.updateOne(
        { _id: order._id },
        { 
          $set: { 
            status: 'failed', 
            errorMessage: 'Price has changed',
            updatedAt: new Date() 
          }
        }
      );
      
      res.status(400).json({ error: 'Product price has changed. Please try again.' });
      return;
    }

    // Update to processing
    await ExudosOrder.updateOne(
      { _id: order._id },
      { $set: { status: 'processing', updatedAt: new Date() } }
    );

    // Place order with Exudos
    const result = await createExudosOrder(
      order.productId,
      order.variantId,
      order.quantity,
      order.idempotencyKey
    );

    if (!result.success) {
      console.error('[Exudos Order] Failed:', result.error);
      
      // Update order status to failed
      await ExudosOrder.updateOne(
        { _id: order._id },
        { 
          $set: { 
            status: 'failed', 
            errorMessage: result.error,
            updatedAt: new Date() 
          },
          $inc: { retryCount: 1 }
        }
      );

      res.status(500).json({ error: result.error });
      return;
    }

    // Order successful - save delivery info
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

    res.json({ 
      status: 'completed',
      delivered: true,
      message: 'Order completed successfully' 
    });

  } catch (error) {
    console.error('[Exudos Order Create] Error:', error);
    res.status(500).json({ error: 'Failed to process order' });
  }
});

/**
 * GET /api/exudos/orders/:orderId
 * Get order status and details.
 * 
 * WHITE-LABELED: Returns order info without Exudos references.
 * SECURITY: Verifies customer owns the order (by email or userId).
 */
router.get('/orders/:orderId', async (req: Request, res: Response) => {
  try {
    const orderId = req.params.orderId;
    const customerEmail = req.query.email as string | undefined;
    const userId = (req.session as any).userId;
    
    // Require either authenticated user or email parameter
    if (!userId && !customerEmail) {
      res.status(401).json({ error: 'Authentication required or email parameter missing' });
      return;
    }
    
    const order = await ExudosOrder.findOne({ internalId: orderId });
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    // Verify ownership: must match either userId or email
    const ownershipVerified = 
      (userId && order.userId === userId) ||
      (customerEmail && order.email === customerEmail);
    
    if (!ownershipVerified) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Return customer-safe order info (no internal Exudos details)
    res.json({
      orderId: order.internalId,
      productName: order.productName,
      category: order.category,
      quantity: order.quantity,
      totalPrice: order.totalPrice,
      status: order.status,
      createdAt: order.createdAt,
      deliveredAt: order.deliveredAt,
      // Only show delivered content if order is completed
      deliveredContent: order.status === 'completed' ? order.deliveredContent : undefined,
    });

  } catch (error) {
    console.error('[Exudos Order Status] Error:', error);
    res.status(500).json({ error: 'Unable to retrieve order status' });
  }
});

export default router;
