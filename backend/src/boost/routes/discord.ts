import { Router, type Request, type Response } from 'express';
import { resolveDiscordInvite, cleanInviteCode } from '../lib/discord.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();
const resolveLimiter = createRateLimiter(10, 60_000); // 10/min per IP

// ── POST /api/discord/resolve ─────────────────────────────────────────────────
router.post('/resolve', resolveLimiter, async (req: Request, res: Response) => {
  const { invite } = req.body as { invite?: string };

  if (!invite || typeof invite !== 'string' || invite.trim().length === 0) {
    res.status(400).json({ valid: false, error: 'Please enter a Discord invite link.' });
    return;
  }

  if (invite.length > 200) {
    res.status(400).json({ valid: false, error: 'Invite link is too long.' });
    return;
  }

  const code = cleanInviteCode(invite);
  if (!code || code.length < 2) {
    res.status(400).json({ valid: false, error: 'Invalid invite link format.' });
    return;
  }

  const result = await resolveDiscordInvite(invite);
  res.json(result);
});

export default router;
