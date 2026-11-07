import { Router, type Request, type Response } from 'express';
import { ExudosOrder } from '../db/models/ExudosOrder.js';
import { Order } from '../db/models/Order.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

const ordersLimiter = createRateLimiter(60, 60_000); // 60 req/min

/**
 * GET /api/orders/history
 * Fetch user's complete order history (MSK tools + Exudos products)
 * 
 * REQUIRES AUTHENTICATION
 */
router.get('/history', requireAuth, ordersLimiter, async (req: Request, res: Response) => {
  try {
    const userId = (req.session as any).userId;
    const email = req.query.email as string | undefined;
    const statusFilter = req.query.status as string | undefined;

    // Build query
    const query: any = {};
    
    if (userId) {
      // Authenticated user - fetch their orders
      query.$or = [
        { userId },
        { email: (req.session as any).email?.toLowerCase() }
      ];
    } else if (email) {
      // Allow email-based lookup for anonymous users
      query.email = email.toLowerCase();
    } else {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (statusFilter) {
      query.status = statusFilter;
    }

    // Fetch MSK tool orders
    const mskOrders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    // Fetch Exudos orders
    const exudosOrders = await ExudosOrder.find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    // Combine and format orders
    const orders = [
      ...mskOrders.map(order => ({
        id: order.internalId,
        type: 'msk-tool' as const,
        createdAt: order.createdAt,
        status: mapOrderStatus(order.status),
        total: order.amountUsd || 0,
        currency: 'USD',
        items: [{
          productName: `${order.product} - ${order.plan}`,
          quantity: 1,
          price: order.amountUsd || 0,
        }],
        deliveryInfo: order.status === 'paid' && order.licenseKey ? {
          delivered: [order.licenseKey],
          instructions: 'Use this license key to activate your product.',
        } : undefined,
      })),
      ...exudosOrders.map(order => ({
        id: order.internalId,
        type: 'exudos' as const,
        createdAt: order.createdAt,
        status: mapOrderStatus(order.status),
        total: order.totalPrice,
        currency: 'USD',
        items: [{
          productName: order.productName,
          quantity: order.quantity,
          price: order.unitPrice,
        }],
        deliveryInfo: order.status === 'completed' && order.deliveredContent ? {
          delivered: order.deliveredContent,
          instructions: 'Your order has been delivered. Access your content below.',
        } : undefined,
      })),
    ];

    // Sort by creation date (newest first)
    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ orders });

  } catch (error) {
    console.error('[orders/history] Error:', error);
    res.status(500).json({ error: 'Unable to fetch order history' });
  }
});

/**
 * GET /api/orders/:orderId
 * Fetch detailed order information with delivery content
 * 
 * SECURITY: Verifies order ownership (userId or email)
 */
router.get('/:orderId', ordersLimiter, async (req: Request, res: Response) => {
  try {
    const orderId = req.params.orderId;
    const userId = (req.session as any).userId;
    const email = req.query.email as string | undefined;

    // Try to find as MSK tool order first
    let order = await Order.findOne({ internalId: orderId }).lean();
    let orderType: 'msk-tool' | 'exudos' = 'msk-tool';

    if (!order) {
      // Try to find as Exudos order
      const exudosOrder = await ExudosOrder.findOne({ 
        internalId: { $regex: `^${orderId}` } 
      }).lean();
      
      if (!exudosOrder) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      order = exudosOrder;
      orderType = 'exudos';
    }

    // Verify ownership
    const ownershipVerified = 
      (userId && order.userId === userId) ||
      (email && order.email === email.toLowerCase());

    if (!ownershipVerified) {
      res.status(403).json({ error: "You don't have permission to view this order" });
      return;
    }

    // Format response based on order type
    if (orderType === 'msk-tool') {
      const mskOrder = order as any;
      res.json({
        id: mskOrder.internalId,
        type: 'msk-tool',
        status: mapOrderStatus(mskOrder.status),
        createdAt: mskOrder.createdAt,
        total: mskOrder.amountUsd || 0,
        currency: 'USD',
        items: [{
          productId: mskOrder.product,
          productName: `${mskOrder.product} - ${mskOrder.plan}`,
          quantity: 1,
          price: mskOrder.amountUsd || 0,
          delivered: mskOrder.status === 'paid' && mskOrder.licenseKey ? [mskOrder.licenseKey] : undefined,
        }],
        deliveryInfo: mskOrder.status === 'paid' && mskOrder.licenseKey ? {
          type: 'license-key',
          content: [mskOrder.licenseKey],
          instructions: 'Use this license key to activate your product.',
        } : undefined,
      });
    } else {
      const exudosOrder = order as any;
      res.json({
        id: exudosOrder.internalId,
        type: 'exudos',
        status: mapOrderStatus(exudosOrder.status),
        createdAt: exudosOrder.createdAt,
        total: exudosOrder.totalPrice,
        currency: 'USD',
        items: [{
          productId: exudosOrder.productId,
          variantId: exudosOrder.variantId,
          productName: exudosOrder.productName,
          quantity: exudosOrder.quantity,
          price: exudosOrder.unitPrice,
          delivered: exudosOrder.status === 'completed' ? exudosOrder.deliveredContent : undefined,
        }],
        deliveryInfo: exudosOrder.status === 'completed' && exudosOrder.deliveredContent ? {
          type: 'credentials',
          content: exudosOrder.deliveredContent,
          instructions: 'Your order has been delivered. Access your content below.',
        } : undefined,
      });
    }

  } catch (error) {
    console.error('[orders/:orderId] Error:', error);
    res.status(500).json({ error: 'Unable to retrieve order' });
  }
});

/**
 * Map internal order status to customer-friendly status
 */
function mapOrderStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'pending',
    'paid': 'delivered',
    'fulfilling': 'processing',
    'processing': 'processing',
    'completed': 'delivered',
    'failed': 'failed',
    'expired': 'expired',
    'refunded': 'refunded',
  };
  
  return statusMap[status] || status;
}

export default router;
