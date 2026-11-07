import { Router, type Request, type Response } from 'express';
import productsRouter from './products.js';
import ordersRouter   from './orders.js';
import discordRouter  from './discord.js';
import { getStats }   from '../db/models/SalesStats.js';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true, service: 'boost-backend' });
});

// Stats served directly here so the /stats prefix is not stripped before hitting the handler
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await getStats();
    res.json({ totalBoostsSold: stats.totalBoostsSold });
  } catch {
    res.json({ totalBoostsSold: 0 });
  }
});

router.use('/products', productsRouter);
router.use('/orders',   ordersRouter);
router.use('/discord',  discordRouter);

export default router;
