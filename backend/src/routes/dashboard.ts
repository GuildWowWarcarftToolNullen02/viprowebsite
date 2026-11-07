import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../db/models/User.js';
import { Order } from '../db/models/Order.js';
import { Download } from '../db/models/Download.js';
import { News } from '../db/models/News.js';
import { HwidReset } from '../db/models/HwidReset.js';
import { RedeemedKey } from '../db/models/RedeemedKey.js';
import { resetHwid, getKeyInfo } from '../lib/keyauth.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();
const limiter       = createRateLimiter(30, 60_000);
const hwidLimiter   = createRateLimiter(5,  60_000);
const redeemLimiter = createRateLimiter(5, 60_000);
const settingsLimiter = createRateLimiter(10, 60_000);

const PRODUCT_LABELS: Record<string, string> = {
  'token-g': 'MSK Token-G',
  'raider':  'MSK Raider Tool',
};

const PLAN_LABELS: Record<string, string> = {
  monthly:  'Monthly',
  lifetime: 'Lifetime',
  source:   'Source / Rebrand',
};

const KNOWN_PRODUCTS = ['token-g', 'raider'] as const;
const HWID_COOLDOWN_MS = 12 * 60 * 60 * 1000;

function requireAuth(req: Request, res: Response, next: () => void): void {
  if (!req.session.userId) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  next();
}

function getIp(req: Request): string {
  return req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ?? req.socket.remoteAddress ?? 'unknown';
}

// ── GET /api/dashboard/me ────────────────────────────────────────
router.get('/me', limiter, requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      req.session.destroy(() => {});
      res.status(401).json({ error: 'Session invalid.' });
      return;
    }

    const orders = await Order.find({
      email: user.email,
      status: 'paid',
      licenseKey: { $exists: true, $ne: null },
    }).sort({ createdAt: -1 });

    const tools = orders.map((o: any) => ({
      orderId:     o.internalId,
      product:     o.product,
      productName: PRODUCT_LABELS[o.product] ?? o.product,
      plan:        o.plan,
      planLabel:   PLAN_LABELS[o.plan] ?? o.plan,
      licenseKey:  o.licenseKey ?? '',
      maskedKey:   maskKey(o.licenseKey ?? ''),
      isLifetime:  o.plan === 'lifetime',
      purchasedAt: o.createdAt,
      amountUsd:   o.amountUsd,
      source:      'purchase' as const,
    }));

    const redeemed = await RedeemedKey.find({ userId: user._id.toString() }).sort({ redeemedAt: -1 });
    const redeemedTools = redeemed.map((r: any) => ({
      orderId:     `redeemed-${r._id.toString()}`,
      product:     r.product,
      productName: PRODUCT_LABELS[r.product] ?? r.product,
      plan:        r.plan,
      planLabel:   PLAN_LABELS[r.plan] ?? r.plan,
      licenseKey:  r.licenseKey,
      maskedKey:   maskKey(r.licenseKey),
      isLifetime:  r.plan === 'lifetime',
      purchasedAt: r.redeemedAt,
      amountUsd:   0,
      source:      'redeemed' as const,
    }));

    const allTools = [...tools, ...redeemedTools];

    res.json({
      user: {
        id:            user._id.toString(),
        username:      user.username,
        email:         user.email,
        avatar:        user.avatar ?? null,
        provider:      user.provider,
        createdAt:     user.createdAt,
        lastLogin:     user.lastLogin ?? null,
        emailVerified: user.emailVerified,
        // Linked providers info (for settings UI)
        linkedDiscord: !!user.discordId,
        linkedGoogle:  !!user.googleId,
        hasPassword:   !!user.password,
      },
      tools: allTools,
      totalTools: allTools.length,
    });
  } catch {
    res.status(500).json({ error: 'Failed to load dashboard.' });
  }
});

// ── GET /api/dashboard/login-history ────────────────────────────
router.get('/login-history', limiter, requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.session.userId, 'loginHistory');
    if (!user) { res.status(401).json({ error: 'Session invalid.' }); return; }
    // return last 10, newest first
    const history = [...(user.loginHistory ?? [])].reverse().slice(0, 10);
    res.json(history);
  } catch {
    res.status(500).json({ error: 'Failed to load login history.' });
  }
});

// ── POST /api/dashboard/change-username ─────────────────────────
router.post('/change-username', settingsLimiter, requireAuth, async (req: Request, res: Response) => {
  const { username } = req.body as { username?: string };
  if (!username || typeof username !== 'string') {
    res.status(400).json({ error: 'Username is required.' });
    return;
  }
  const trimmed = username.trim();
  if (trimmed.length < 2 || trimmed.length > 32) {
    res.status(400).json({ error: 'Username must be 2-32 characters.' });
    return;
  }
  try {
    const user = await User.findByIdAndUpdate(
      req.session.userId,
      { username: trimmed },
      { new: true },
    );
    if (!user) { res.status(401).json({ error: 'Session invalid.' }); return; }
    res.json({ success: true, username: user.username });
  } catch {
    res.status(500).json({ error: 'Failed to update username.' });
  }
});

// ── POST /api/dashboard/change-password ─────────────────────────
router.post('/change-password', settingsLimiter, requireAuth, async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'Current and new passwords are required.' });
    return;
  }
  if (newPassword.length < 8) {
    res.status(400).json({ error: 'New password must be at least 8 characters.' });
    return;
  }
  if (newPassword.length > 128) {
    res.status(400).json({ error: 'Password too long.' });
    return;
  }
  try {
    const user = await User.findById(req.session.userId);
    if (!user) { res.status(401).json({ error: 'Session invalid.' }); return; }

    if (!user.password) {
      res.status(400).json({ error: 'Your account uses social login. Set a password via the forgot password flow.' });
      return;
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      res.status(401).json({ error: 'Current password is incorrect.' });
      return;
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await User.updateOne({ _id: user._id }, { password: hashed });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to update password.' });
  }
});

// ── POST /api/dashboard/set-password ────────────────────────────
// For OAuth-only users who want to add a password
router.post('/set-password', settingsLimiter, requireAuth, async (req: Request, res: Response) => {
  const { newPassword } = req.body as { newPassword?: string };
  if (!newPassword || newPassword.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters.' });
    return;
  }
  if (newPassword.length > 128) {
    res.status(400).json({ error: 'Password too long.' });
    return;
  }
  try {
    const user = await User.findById(req.session.userId);
    if (!user) { res.status(401).json({ error: 'Session invalid.' }); return; }
    if (user.password) {
      res.status(400).json({ error: 'Password already set. Use change-password instead.' });
      return;
    }
    const hashed = await bcrypt.hash(newPassword, 12);
    await User.updateOne({ _id: user._id }, { password: hashed, emailVerified: true });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to set password.' });
  }
});

// ── POST /api/dashboard/unlink-discord ──────────────────────────
router.post('/unlink-discord', settingsLimiter, requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) { res.status(401).json({ error: 'Session invalid.' }); return; }

    if (!user.discordId && user.provider !== 'discord') {
      res.status(400).json({ error: 'No Discord account linked.' });
      return;
    }

    // Must keep at least one login method
    const hasOtherMethod = user.password || user.googleId || (user.provider === 'google' && user.providerId);
    if (!hasOtherMethod) {
      res.status(400).json({ error: 'Cannot unlink Discord - it is your only login method. Add a password first.' });
      return;
    }

    await User.updateOne({ _id: user._id }, {
      $unset: { discordId: '', discordAvatar: '' },
      // If Discord was primary provider, fall back to local (password exists) or google
      ...(user.provider === 'discord' ? {
        provider: user.googleId ? 'google' : 'local',
        providerId: user.googleId ?? undefined,
      } : {}),
    });

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to unlink Discord.' });
  }
});

// ── POST /api/dashboard/unlink-google ───────────────────────────
router.post('/unlink-google', settingsLimiter, requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) { res.status(401).json({ error: 'Session invalid.' }); return; }

    if (!user.googleId && user.provider !== 'google') {
      res.status(400).json({ error: 'No Google account linked.' });
      return;
    }

    const hasOtherMethod = user.password || user.discordId || (user.provider === 'discord' && user.providerId);
    if (!hasOtherMethod) {
      res.status(400).json({ error: 'Cannot unlink Google - it is your only login method. Add a password first.' });
      return;
    }

    await User.updateOne({ _id: user._id }, {
      $unset: { googleId: '', googleAvatar: '' },
      ...(user.provider === 'google' ? {
        provider: user.discordId ? 'discord' : 'local',
        providerId: user.discordId ?? undefined,
      } : {}),
    });

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to unlink Google.' });
  }
});

// ── GET /api/dashboard/upgrade-options ──────────────────────────
// Returns monthly tools that can be upgraded to lifetime
router.get('/upgrade-options', limiter, requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) { res.status(401).json({ error: 'Session invalid.' }); return; }

    // Monthly paid orders only
    const monthlyOrders = await Order.find({
      email: user.email,
      status: 'paid',
      plan: 'monthly',
    }).sort({ createdAt: -1 });

    const options = monthlyOrders.map((o: any) => ({
      orderId:     o.internalId,
      product:     o.product,
      productName: PRODUCT_LABELS[o.product] ?? o.product,
      maskedKey:   maskKey(o.licenseKey ?? ''),
    }));

    res.json(options);
  } catch {
    res.status(500).json({ error: 'Failed to load upgrade options.' });
  }
});

// ── POST /api/dashboard/redeem-key ──────────────────────────────
router.post('/redeem-key', redeemLimiter, requireAuth, async (req: Request, res: Response) => {
  const { licenseKey } = req.body as { licenseKey?: string };

  if (!licenseKey || typeof licenseKey !== 'string') {
    res.status(400).json({ error: 'License key is required.' });
    return;
  }

  const trimmedKey = licenseKey.trim().toUpperCase();

  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      req.session.destroy(() => {});
      res.status(401).json({ error: 'Session invalid.' });
      return;
    }

    const existingOrder = await Order.findOne({ licenseKey: trimmedKey, status: 'paid' });
    if (existingOrder) {
      if (existingOrder.email === user.email) {
        res.status(409).json({ error: 'This key is already linked to your account from a purchase.' });
      } else {
        res.status(409).json({ error: 'This key has already been claimed.' });
      }
      return;
    }

    const existingRedemption = await RedeemedKey.findOne({ licenseKey: trimmedKey });
    if (existingRedemption) {
      if (existingRedemption.userId === user._id.toString()) {
        res.status(409).json({ error: 'You have already redeemed this key.' });
      } else {
        res.status(409).json({ error: 'This key has already been claimed by another account.' });
      }
      return;
    }

    let detectedProduct: string | null = null;
    let detectedPlan = 'lifetime';

    for (const product of KNOWN_PRODUCTS) {
      const info = await getKeyInfo(product, trimmedKey);
      if (info) {
        detectedProduct = product;
        if (info.duration) {
          const durationSeconds = parseInt(info.duration, 10);
          if (durationSeconds > 365 * 24 * 3600 || durationSeconds === 0 || durationSeconds >= 8639913600) {
            detectedPlan = 'lifetime';
          } else if (durationSeconds > 86400) {
            detectedPlan = 'monthly';
          } else {
            detectedPlan = 'source';
          }
        } else if (info.expires) {
          const expiresDate = new Date(info.expires);
          const daysLeft = (expiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
          if (daysLeft > 365) { detectedPlan = 'lifetime'; }
          else if (daysLeft > 1) { detectedPlan = 'monthly'; }
          else { detectedPlan = 'source'; }
        }
        break;
      }
    }

    if (!detectedProduct) {
      res.status(404).json({ error: 'Key not found or invalid. Please double-check it and try again.' });
      return;
    }

    try {
      const record = await RedeemedKey.create({
        userId:     user._id.toString(),
        email:      user.email,
        licenseKey: trimmedKey,
        product:    detectedProduct,
        plan:       detectedPlan,
      });

      res.json({
        success:     true,
        product:     detectedProduct,
        productName: PRODUCT_LABELS[detectedProduct] ?? detectedProduct,
        plan:        detectedPlan,
        planLabel:   PLAN_LABELS[detectedPlan] ?? detectedPlan,
        maskedKey:   maskKey(trimmedKey),
        redeemedAt:  record.redeemedAt,
      });
    } catch (err: any) {
      if (err?.code === 11000) {
        res.status(409).json({ error: 'This key has already been claimed.' });
        return;
      }
      throw err;
    }
  } catch {
    res.status(500).json({ error: 'Redemption failed. Please try again.' });
  }
});

// ── POST /api/dashboard/hwid-reset ──────────────────────────────
router.post('/hwid-reset', hwidLimiter, requireAuth, async (req: Request, res: Response) => {
  const { licenseKey, product } = req.body as { licenseKey?: string; product?: string };
  if (!licenseKey || !product) {
    res.status(400).json({ error: 'License key and product are required.' });
    return;
  }

  if (!KNOWN_PRODUCTS.includes(product as any)) {
    res.status(400).json({ error: 'Invalid product.' });
    return;
  }

  try {
    const user = await User.findById(req.session.userId);
    if (!user) { res.status(401).json({ error: 'Session invalid.' }); return; }

    const ownedByOrder = await Order.findOne({ email: user.email, product, licenseKey, status: 'paid' });
    const ownedByRedemption = ownedByOrder
      ? null
      : await RedeemedKey.findOne({ userId: user._id.toString(), licenseKey, product });

    if (!ownedByOrder && !ownedByRedemption) {
      res.status(403).json({ error: 'License not found on your account.' });
      return;
    }

    const existing = await HwidReset.findOne({ userId: user._id.toString(), licenseKey });
    if (existing) {
      const elapsed = Date.now() - existing.lastResetAt.getTime();
      if (elapsed < HWID_COOLDOWN_MS) {
        const remaining = Math.ceil((HWID_COOLDOWN_MS - elapsed) / 1000);
        res.status(429).json({ error: 'HWID reset cooldown active.', remainingSeconds: remaining });
        return;
      }
    }

    await resetHwid(product, licenseKey);

    await HwidReset.findOneAndUpdate(
      { userId: user._id.toString(), licenseKey },
      { lastResetAt: new Date() },
      { upsert: true },
    );

    res.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'HWID reset failed.';
    res.status(500).json({ error: msg });
  }
});

// ── GET /api/dashboard/hwid-status ──────────────────────────────
router.get('/hwid-status', limiter, requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) { res.status(401).json({ error: 'Session invalid.' }); return; }

    const resets = await HwidReset.find({ userId: user._id.toString() });
    const now = Date.now();
    const status: Record<string, { canReset: boolean; remainingSeconds: number; nextResetAt: string | null }> = {};

    for (const r of resets) {
      const elapsed = now - r.lastResetAt.getTime();
      const remaining = Math.max(0, Math.ceil((HWID_COOLDOWN_MS - elapsed) / 1000));
      status[r.licenseKey] = {
        canReset: remaining === 0,
        remainingSeconds: remaining,
        nextResetAt: remaining > 0 ? new Date(r.lastResetAt.getTime() + HWID_COOLDOWN_MS).toISOString() : null,
      };
    }

    res.json(status);
  } catch {
    res.status(500).json({ error: 'Failed to load HWID status.' });
  }
});

// ── GET /api/dashboard/downloads ────────────────────────────────
router.get('/downloads', limiter, requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) { res.status(401).json({ error: 'Session invalid.' }); return; }

    const orderProducts = await Order.find({ email: user.email, status: 'paid' }).distinct('product');
    const redeemedProducts = await RedeemedKey.find({ userId: user._id.toString() }).distinct('product');
    const ownedProducts = [...new Set([...orderProducts, ...redeemedProducts])];

    const downloads = await Download.find({ product: { $in: ownedProducts }, published: true }).sort({ updatedAt: -1 });

    res.json(downloads.map((d: any) => ({
      id:           d._id.toString(),
      product:      d.product,
      productName:  PRODUCT_LABELS[d.product] ?? d.product,
      version:      d.version,
      url:          d.url,
      size:         d.size,
      checksum:     d.checksum,
      releaseNotes: d.releaseNotes,
      updatedAt:    d.updatedAt,
    })));
  } catch {
    res.status(500).json({ error: 'Failed to load downloads.' });
  }
});

// ── GET /api/dashboard/news ──────────────────────────────────────
router.get('/news', limiter, async (_req: Request, res: Response) => {
  try {
    const news = await News.find({ published: true }).sort({ publishedAt: -1 }).limit(20);
    res.json(news.map((n: any) => ({
      id:          n._id.toString(),
      title:       n.title,
      content:     n.content,
      type:        n.type,
      publishedAt: n.publishedAt,
    })));
  } catch {
    res.status(500).json({ error: 'Failed to load news.' });
  }
});

// ── Helpers ──────────────────────────────────────────────────────
function maskKey(key: string): string {
  if (!key) return '';
  const parts = key.split('-');
  if (parts.length < 2) return key.slice(0, 8) + '••••••••';
  const visible = parts.slice(0, 2).join('-');
  const masked = parts.slice(2).map((p) => '•'.repeat(p.length)).join('-');
  return visible + (masked ? '-' + masked : '');
}

export { getIp };
export default router;
