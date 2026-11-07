import { Router, type Request, type Response } from 'express';
import authRouter from './auth.js';
import paymentsRouter from './payments.js';
import protectionRouter from './protection.js';
import dashboardRouter from './dashboard.js';
import adminRouter from './admin.js';
import exudosRouter from './exudos.js';
import cartRouter from './cart.js';
import ordersRouter from './orders.js';
import boostProductsRouter from '../boost/routes/products.js';
import boostOrdersRouter from '../boost/routes/orders.js';
import boostDiscordRouter from '../boost/routes/discord.js';
import { getStats } from '../boost/db/models/SalesStats.js';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true, service: 'mskhub-backend' });
});

router.use('/auth', authRouter);
router.use('/payments', paymentsRouter);
router.use('/protection', protectionRouter);
router.use('/dashboard', dashboardRouter);
router.use('/admin', adminRouter);

// ── Exudos Reseller Store Endpoints ───────────────────────────────────
router.use('/exudos', exudosRouter);
router.use('/cart', cartRouter);
router.use('/orders', ordersRouter);

// ── Boost Store Endpoints ─────────────────────────────────────────────
router.use('/products', boostProductsRouter);
router.use('/orders',   boostOrdersRouter);
router.use('/discord',  boostDiscordRouter);
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await getStats();
    res.json({ totalBoostsSold: stats.totalBoostsSold });
  } catch {
    res.json({ totalBoostsSold: 0 });
  }
});

export default router;
