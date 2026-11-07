import { Router, type Request, type Response } from 'express';
import { Cart, type ICartItem } from '../db/models/Cart.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';
import { randomUUID } from 'crypto';

const router = Router();

const cartLimiter = createRateLimiter(60, 60_000); // 60 req/min

/**
 * Get or create cart for current session/user
 */
async function getOrCreateCart(sessionId?: string, userId?: string) {
  let cart = await Cart.findOne(userId ? { userId } : { sessionId });
  
  if (!cart) {
    cart = await Cart.create({
      sessionId,
      userId,
      items: [],
      subtotal: 0,
      total: 0,
    });
  }
  
  return cart;
}

/**
 * GET /api/cart
 * Get current cart
 */
router.get('/', cartLimiter, async (req: Request, res: Response) => {
  try {
    const sessionId = req.session.id;
    const userId = (req.session as any).userId;
    
    const cart = await getOrCreateCart(sessionId, userId);
    res.json(cart);
    
  } catch (error) {
    console.error('[Cart] Error fetching cart:', error);
    res.status(500).json({ error: 'Unable to load cart' });
  }
});

/**
 * POST /api/cart/add
 * Add item to cart
 */
router.post('/add', cartLimiter, async (req: Request, res: Response) => {
  try {
    const sessionId = req.session.id;
    const userId = (req.session as any).userId;
    const item = req.body as ICartItem;
    
    // Validate item
    if (!item.type || !item.quantity || !item.unitPrice) {
      res.status(400).json({ error: 'Invalid item data' });
      return;
    }
    
    const cart = await getOrCreateCart(sessionId, userId);
    
    // Check if item already exists in cart
    const existingIndex = cart.items.findIndex(i => {
      if (item.type === 'msk-tool') {
        return i.type === 'msk-tool' && 
               i.mskProductId === item.mskProductId && 
               i.mskPlan === item.mskPlan;
      } else {
        return i.type === 'exudos-product' && 
               i.exudosProductId === item.exudosProductId && 
               i.exudosVariantId === item.exudosVariantId;
      }
    });
    
    if (existingIndex >= 0) {
      // Update quantity
      cart.items[existingIndex].quantity += item.quantity;
      cart.items[existingIndex].totalPrice = 
        cart.items[existingIndex].quantity * cart.items[existingIndex].unitPrice;
    } else {
      // Add new item
      item.totalPrice = item.quantity * item.unitPrice;
      cart.items.push(item);
    }
    
    await cart.save();
    res.json(cart);
    
  } catch (error) {
    console.error('[Cart] Error adding item:', error);
    res.status(500).json({ error: 'Unable to add item to cart' });
  }
});

/**
 * PUT /api/cart/update
 * Update cart item quantity
 */
router.put('/update', cartLimiter, async (req: Request, res: Response) => {
  try {
    const sessionId = req.session.id;
    const userId = (req.session as any).userId;
    const { itemIndex, quantity } = req.body as { itemIndex: number; quantity: number };
    
    if (quantity < 1) {
      res.status(400).json({ error: 'Quantity must be at least 1' });
      return;
    }
    
    const cart = await getOrCreateCart(sessionId, userId);
    
    if (itemIndex < 0 || itemIndex >= cart.items.length) {
      res.status(400).json({ error: 'Invalid item index' });
      return;
    }
    
    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].totalPrice = quantity * cart.items[itemIndex].unitPrice;
    
    await cart.save();
    res.json(cart);
    
  } catch (error) {
    console.error('[Cart] Error updating item:', error);
    res.status(500).json({ error: 'Unable to update cart' });
  }
});

/**
 * DELETE /api/cart/remove/:itemIndex
 * Remove item from cart
 */
router.delete('/remove/:itemIndex', cartLimiter, async (req: Request, res: Response) => {
  try {
    const sessionId = req.session.id;
    const userId = (req.session as any).userId;
    const itemIndex = parseInt(req.params.itemIndex);
    
    const cart = await getOrCreateCart(sessionId, userId);
    
    if (itemIndex < 0 || itemIndex >= cart.items.length) {
      res.status(400).json({ error: 'Invalid item index' });
      return;
    }
    
    cart.items.splice(itemIndex, 1);
    
    await cart.save();
    res.json(cart);
    
  } catch (error) {
    console.error('[Cart] Error removing item:', error);
    res.status(500).json({ error: 'Unable to remove item' });
  }
});

/**
 * DELETE /api/cart/clear
 * Clear entire cart
 */
router.delete('/clear', cartLimiter, async (req: Request, res: Response) => {
  try {
    const sessionId = req.session.id;
    const userId = (req.session as any).userId;
    
    const cart = await getOrCreateCart(sessionId, userId);
    cart.items = [];
    cart.subtotal = 0;
    cart.total = 0;
    
    await cart.save();
    res.json(cart);
    
  } catch (error) {
    console.error('[Cart] Error clearing cart:', error);
    res.status(500).json({ error: 'Unable to clear cart' });
  }
});

export default router;
