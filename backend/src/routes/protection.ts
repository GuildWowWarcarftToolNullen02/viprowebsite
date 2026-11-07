/**
 * GET /api/protection/status
 *
 * Returns current DDoS protection state. The frontend polls this
 * every 10 seconds to show or hide the protection overlay screen.
 */

import { Router, type Request, type Response } from 'express';
import { getProtectionStatus } from '../middleware/ddos.js';

const router = Router();

router.get('/status', (_req: Request, res: Response) => {
  res.json(getProtectionStatus());
});

export default router;
