import { Router, type Request, type Response } from 'express';
import { randomBytes } from 'crypto';
import { Download } from '../db/models/Download.js';
import { News } from '../db/models/News.js';
import { Order } from '../db/models/Order.js';
import { User } from '../db/models/User.js';
import { RedeemedKey } from '../db/models/RedeemedKey.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';
import { Resend } from 'resend';
import { createSignedOAuthState, verifySignedOAuthState } from '../lib/oauthState.js';

const router = Router();
const adminLimiter = createRateLimiter(60, 60_000);

// ── Only this Google account may access admin ─────────────────────
const ADMIN_EMAIL = 'hackingrat166@gmail.com';

// ── Valid product and news type values ────────────────────────────
const VALID_PRODUCTS = new Set(['token-g', 'raider']);
const VALID_NEWS_TYPES = new Set(['feature', 'bugfix', 'security', 'maintenance', 'release']);

/** Returns the canonical app base URL */
function appUrl(req: Request): string {
  const host = (req.get('x-forwarded-host') || req.get('host') || '').toLowerCase();
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    const proto = req.get('x-forwarded-proto') || req.protocol || 'http';
    return `${proto}://${host}`;
  }

  // Canonical base domain matching Google Cloud Console URI:
  // https://mskhub.store/api/admin/auth/google/callback
  return 'https://mskhub.store';
}

/** Guard - requires adminAuthenticated on session */
function requireAdmin(req: Request, res: Response, next: () => void): void {
  if (!req.session.adminAuthenticated) {
    res.status(401).json({ error: 'Admin authentication required.' });
    return;
  }
  next();
}

// ── In-memory activity log (last 500 entries) ─────────────────────
interface LogEntry {
  ts: string;
  level: 'info' | 'warn' | 'error';
  msg: string;
}
const activityLog: LogEntry[] = [];
export function adminLog(level: LogEntry['level'], msg: string) {
  activityLog.push({ ts: new Date().toISOString(), level, msg });
  if (activityLog.length > 500) activityLog.shift();
}

// ── GET /api/admin/me ────────────────────────────────────────────
router.get('/me', adminLimiter, requireAdmin, (_req: Request, res: Response) => {
  res.json({ authenticated: true });
});

// ── GET /api/admin/auth/google - start OAuth flow ────────────────
router.get('/auth/google', adminLimiter, async (req: Request, res: Response) => {
  const clientId = process.env['GOOGLE_CLIENT_ID']?.trim();
  const clientSecret = process.env['GOOGLE_CLIENT_SECRET']?.trim();
  const adminOrigin = 'https://admin.mskhub.store';

  if (!clientId || !clientSecret) {
    res.redirect(`${adminOrigin}?error=oauth_error&reason=missing_credentials`);
    return;
  }

  const state = createSignedOAuthState({ scope: 'admin' });
  req.session.adminOauthState = state;

  await new Promise<void>((resolve) => req.session.save(() => resolve()));

  const callbackUrl = `${appUrl(req)}/api/admin/auth/google/callback`;

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', callbackUrl);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('access_type', 'online');
  authUrl.searchParams.set('prompt', 'select_account');

  res.redirect(authUrl.toString());
});

// ── GET /api/admin/auth/google/callback ──────────────────────────
router.get('/auth/google/callback', async (req: Request, res: Response) => {
  const { code, state, error: googleError, error_description } = req.query as {
    code?: string;
    state?: string;
    error?: string;
    error_description?: string;
  };
  const adminOrigin = 'https://admin.mskhub.store';

  if (googleError) {
    console.error('[admin/google/callback] Google error:', googleError, error_description);
    res.redirect(`${adminOrigin}?error=oauth_failed&reason=google_${encodeURIComponent(googleError)}`);
    return;
  }

  if (!code || !state) {
    res.redirect(`${adminOrigin}?error=oauth_failed&reason=missing_code_or_state`);
    return;
  }

  const statePayload = verifySignedOAuthState(state);
  const sessionMatched = req.session.adminOauthState && req.session.adminOauthState === state;

  if (!statePayload && !sessionMatched) {
    console.warn('[admin/google/callback] State mismatch. Received state:', state, 'Session state:', req.session?.adminOauthState);
    res.redirect(`${adminOrigin}?error=oauth_failed&reason=state_mismatch`);
    return;
  }

  delete req.session.adminOauthState;

  const clientId = process.env['GOOGLE_CLIENT_ID']?.trim();
  const clientSecret = process.env['GOOGLE_CLIENT_SECRET']?.trim();
  if (!clientId || !clientSecret) {
    res.redirect(`${adminOrigin}?error=oauth_failed&reason=missing_credentials`);
    return;
  }
  const callbackUrl = `${appUrl(req)}/api/admin/auth/google/callback`;

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: callbackUrl,
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('[admin/google/callback] Token exchange failed:', tokenRes.status, errText);
      res.redirect(`${adminOrigin}?error=oauth_failed&reason=token_${tokenRes.status}`);
      return;
    }

    const tokenData = await tokenRes.json() as { access_token: string };

    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userRes.ok) {
      console.error('[admin/google/callback] Userinfo failed:', userRes.status, await userRes.text());
      res.redirect(`${adminOrigin}?error=oauth_error&reason=userinfo_${userRes.status}`);
      return;
    }

    const googleUser = await userRes.json() as { email: string; name: string };

    if (googleUser.email.toLowerCase() !== ADMIN_EMAIL) {
      adminLog('warn', `Blocked login attempt from: ${googleUser.email}`);
      res.redirect(`${adminOrigin}?error=unauthorized`);
      return;
    }

    req.session.adminAuthenticated = true;
    await new Promise<void>((resolve) => req.session.save(() => resolve()));
    adminLog('info', `Admin login: ${googleUser.email}`);
    res.redirect(adminOrigin);
  } catch (err) {
    console.error('[admin/google/callback] Uncaught error:', err);
    res.redirect(`${adminOrigin}?error=oauth_error`);
  }
});

// ── POST /api/admin/logout ───────────────────────────────────────
router.post('/logout', (req: Request, res: Response) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

// ═══════════════════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════════════════

// GET /api/admin/users?page=1&limit=50&q=search
router.get('/users', adminLimiter, requireAdmin, async (req: Request, res: Response) => {
  try {
    const page  = Math.max(1, parseInt(String(req.query['page']  ?? '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query['limit'] ?? '50'), 10)));
    const q     = String(req.query['q'] ?? '').trim();

    const filter = q
      ? { $or: [
          { email:    { $regex: q, $options: 'i' } },
          { username: { $regex: q, $options: 'i' } },
        ] }
      : {};

    const [users, total] = await Promise.all([
      User.find(filter, '-password -verificationToken -resetPasswordToken')
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
      User.countDocuments(filter),
    ]);

    res.json({ users, total, page, limit });
  } catch {
    res.status(500).json({ error: 'Failed to load users.' });
  }
});

// GET /api/admin/users/:id - full user detail + their orders + redeemed keys
router.get('/users/:id', adminLimiter, requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params['id'], '-password -verificationToken -resetPasswordToken').lean();
    if (!user) { res.status(404).json({ error: 'User not found.' }); return; }

    const [orders, redeemed] = await Promise.all([
      Order.find({ email: user.email }).sort({ createdAt: -1 }).lean(),
      RedeemedKey.find({ userId: String(user._id) }).sort({ redeemedAt: -1 }).lean(),
    ]);

    res.json({ user, orders, redeemed });
  } catch {
    res.status(500).json({ error: 'Failed to load user.' });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', adminLimiter, requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = await User.findByIdAndDelete(req.params['id']);
    if (!user) { res.status(404).json({ error: 'User not found.' }); return; }
    adminLog('warn', `Deleted user: ${user.email}`);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

// ═══════════════════════════════════════════════════════════════════
// ORDERS
// ═══════════════════════════════════════════════════════════════════

// GET /api/admin/orders?page=1&limit=50&q=search&status=paid
router.get('/orders', adminLimiter, requireAdmin, async (req: Request, res: Response) => {
  try {
    const page   = Math.max(1, parseInt(String(req.query['page']   ?? '1'), 10));
    const limit  = Math.min(100, Math.max(1, parseInt(String(req.query['limit'] ?? '50'), 10)));
    const q      = String(req.query['q']      ?? '').trim();
    const status = String(req.query['status'] ?? '').trim();

    const filter: Record<string, unknown> = {};
    if (status && status !== 'all') filter['status'] = status;
    if (q) {
      filter['$or'] = [
        { email:     { $regex: q, $options: 'i' } },
        { internalId:{ $regex: q, $options: 'i' } },
        { licenseKey:{ $regex: q, $options: 'i' } },
      ];
    }

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Order.countDocuments(filter),
    ]);

    res.json({ orders, total, page, limit });
  } catch {
    res.status(500).json({ error: 'Failed to load orders.' });
  }
});

// ═══════════════════════════════════════════════════════════════════
// EMAIL (send to any address)
// ═══════════════════════════════════════════════════════════════════

router.post('/send-email', adminLimiter, requireAdmin, async (req: Request, res: Response) => {
  const { to, subject, body } = req.body as { to?: string; subject?: string; body?: string };

  if (!to || !subject || !body) {
    res.status(400).json({ error: 'to, subject, and body are required.' });
    return;
  }

  const apiKey = process.env['RESEND_API_KEY'];
  if (!apiKey) {
    res.status(503).json({ error: 'Email service not configured.' });
    return;
  }

  // Basic email sanity check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    res.status(400).json({ error: 'Invalid email address.' });
    return;
  }

  if (subject.length > 200) { res.status(400).json({ error: 'Subject too long.' }); return; }
  if (body.length > 50_000)  { res.status(400).json({ error: 'Body too long.' }); return; }

  try {
    const resend = new Resend(apiKey);
    // Convert plain newlines to <br> for basic HTML rendering
    const htmlBody = body
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');

    await resend.emails.send({
      from: 'MSK Hub Admin <noreply@mskhub.store>',
      to,
      subject,
      html: `<div style="font-family:sans-serif;font-size:14px;color:#111;line-height:1.6">${htmlBody}</div>`,
    });

    adminLog('info', `Admin sent email to ${to} - subject: "${subject}"`);
    res.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    adminLog('error', `Failed to send email to ${to}: ${msg}`);
    res.status(500).json({ error: 'Failed to send email.' });
  }
});

// ═══════════════════════════════════════════════════════════════════
// ACTIVITY LOG
// ═══════════════════════════════════════════════════════════════════

router.get('/logs', adminLimiter, requireAdmin, (_req: Request, res: Response) => {
  // Return newest first
  res.json([...activityLog].reverse());
});

// ═══════════════════════════════════════════════════════════════════
// STATS (dashboard numbers)
// ═══════════════════════════════════════════════════════════════════

router.get('/stats', adminLimiter, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const [totalUsers, totalOrders, paidOrders, totalRedeemed] = await Promise.all([
      User.countDocuments(),
      Order.countDocuments(),
      Order.countDocuments({ status: 'paid' }),
      RedeemedKey.countDocuments(),
    ]);

    // Revenue from paid orders
    const revenueAgg = await Order.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amountUsd' } } },
    ]) as { total: number }[];
    const revenue = revenueAgg[0]?.total ?? 0;

    // Recent signups last 7 days
    const since7d = new Date(Date.now() - 7 * 86400_000);
    const recentSignups = await User.countDocuments({ createdAt: { $gte: since7d } });

    res.json({ totalUsers, totalOrders, paidOrders, totalRedeemed, revenue, recentSignups });
  } catch {
    res.status(500).json({ error: 'Failed to load stats.' });
  }
});

// ═══════════════════════════════════════════════════════════════════
// CUSTOMERS (users who own at least one tool)
// ═══════════════════════════════════════════════════════════════════

// GET /api/admin/customers?page=1&limit=50&q=search&product=raider
router.get('/customers', adminLimiter, requireAdmin, async (req: Request, res: Response) => {
  try {
    const page    = Math.max(1, parseInt(String(req.query['page']    ?? '1'),  10));
    const limit   = Math.min(100, Math.max(1, parseInt(String(req.query['limit'] ?? '50'), 10)));
    const q       = String(req.query['q']       ?? '').trim();
    const product = String(req.query['product'] ?? '').trim();

    // Collect emails that have at least one paid order
    const orderFilter: Record<string, unknown> = { status: 'paid' };
    if (product && product !== 'all') orderFilter['product'] = product;

    const emailsFromOrders   = await Order.distinct('email', orderFilter) as string[];
    const userIdsFromRedeemed = product && product !== 'all'
      ? await RedeemedKey.distinct('userId', { product }) as string[]
      : await RedeemedKey.distinct('userId') as string[];

    // Build a filter that matches users owning at least one tool
    const baseFilter: Record<string, unknown> = {
      $or: [
        { email: { $in: emailsFromOrders } },
        { _id: { $in: userIdsFromRedeemed } },
      ],
    };
    if (q) {
      baseFilter['$and'] = [
        { $or: baseFilter['$or'] },
        { $or: [
          { email:    { $regex: q, $options: 'i' } },
          { username: { $regex: q, $options: 'i' } },
        ] },
      ];
      delete baseFilter['$or'];
    }

    const [customers, total] = await Promise.all([
      User.find(baseFilter, '-password -verificationToken -resetPasswordToken')
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
      User.countDocuments(baseFilter),
    ]);

    res.json({ customers, total, page, limit });
  } catch {
    res.status(500).json({ error: 'Failed to load customers.' });
  }
});

// ═══════════════════════════════════════════════════════════════════
// DOWNLOADS
// ═══════════════════════════════════════════════════════════════════

router.get('/downloads', adminLimiter, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const downloads = await Download.find().sort({ product: 1, updatedAt: -1 });
    res.json(downloads);
  } catch {
    res.status(500).json({ error: 'Failed to load downloads.' });
  }
});

router.post('/downloads', adminLimiter, requireAdmin, async (req: Request, res: Response) => {
  const { product, version, url, size, checksum, releaseNotes, published } = req.body as Record<string, string | boolean>;
  if (!product || !version || !url) {
    res.status(400).json({ error: 'product, version, and url are required.' });
    return;
  }
  if (!VALID_PRODUCTS.has(String(product))) { res.status(400).json({ error: 'Invalid product.' }); return; }
  try {
    const parsed = new URL(String(url));
    if (parsed.protocol !== 'https:') throw new Error('Not HTTPS');
  } catch {
    res.status(400).json({ error: 'Download URL must be a valid HTTPS URL.' });
    return;
  }
  if (String(version).length > 20)          { res.status(400).json({ error: 'Version too long.' }); return; }
  if (String(url).length > 2048)            { res.status(400).json({ error: 'URL too long.' }); return; }
  if (String(size ?? '').length > 50)       { res.status(400).json({ error: 'Size field too long.' }); return; }
  if (String(checksum ?? '').length > 128)  { res.status(400).json({ error: 'Checksum too long.' }); return; }
  if (String(releaseNotes ?? '').length > 5000) { res.status(400).json({ error: 'Release notes too long.' }); return; }
  try {
    const doc = await Download.create({
      product, version: String(version), url: String(url),
      size: String(size ?? ''), checksum: String(checksum ?? ''),
      releaseNotes: String(releaseNotes ?? ''), published: Boolean(published), updatedAt: new Date(),
    });
    adminLog('info', `Download added: ${product} v${String(version)}`);
    res.json(doc);
  } catch {
    res.status(500).json({ error: 'Failed to create download.' });
  }
});

router.put('/downloads/:id', adminLimiter, requireAdmin, async (req: Request, res: Response) => {
  const { version, url, size, checksum, releaseNotes, published } = req.body as Record<string, string | boolean>;
  try {
    const doc = await Download.findByIdAndUpdate(
      req.params['id'],
      { version, url, size, checksum, releaseNotes, published: Boolean(published), updatedAt: new Date() },
      { new: true },
    );
    if (!doc) { res.status(404).json({ error: 'Download not found.' }); return; }
    res.json(doc);
  } catch {
    res.status(500).json({ error: 'Failed to update download.' });
  }
});

router.delete('/downloads/:id', adminLimiter, requireAdmin, async (req: Request, res: Response) => {
  try {
    await Download.findByIdAndDelete(req.params['id']);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete download.' });
  }
});

// ═══════════════════════════════════════════════════════════════════
// NEWS
// ═══════════════════════════════════════════════════════════════════

router.get('/news', adminLimiter, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const news = await News.find().sort({ publishedAt: -1 });
    res.json(news);
  } catch {
    res.status(500).json({ error: 'Failed to load news.' });
  }
});

router.post('/news', adminLimiter, requireAdmin, async (req: Request, res: Response) => {
  const { title, content, type, published, publishedAt } = req.body as Record<string, string | boolean>;
  if (!title || !content) {
    res.status(400).json({ error: 'title and content are required.' });
    return;
  }
  const newsType = String(type ?? 'feature');
  if (!VALID_NEWS_TYPES.has(newsType)) { res.status(400).json({ error: 'Invalid news type.' }); return; }
  if (String(title).length > 200)   { res.status(400).json({ error: 'Title too long.' }); return; }
  if (String(content).length > 10000) { res.status(400).json({ error: 'Content too long.' }); return; }
  try {
    const doc = await News.create({
      title: String(title), content: String(content), type: newsType,
      published: Boolean(published), publishedAt: publishedAt ? new Date(String(publishedAt)) : new Date(),
    });
    adminLog('info', `News posted: "${String(title)}"`);
    res.json(doc);
  } catch {
    res.status(500).json({ error: 'Failed to create news.' });
  }
});

router.put('/news/:id', adminLimiter, requireAdmin, async (req: Request, res: Response) => {
  const { title, content, type, published, publishedAt } = req.body as Record<string, string | boolean>;
  try {
    const doc = await News.findByIdAndUpdate(
      req.params['id'],
      { title, content, type, published: Boolean(published), ...(publishedAt ? { publishedAt: new Date(String(publishedAt)) } : {}) },
      { new: true },
    );
    if (!doc) { res.status(404).json({ error: 'News item not found.' }); return; }
    res.json(doc);
  } catch {
    res.status(500).json({ error: 'Failed to update news.' });
  }
});

router.delete('/news/:id', adminLimiter, requireAdmin, async (req: Request, res: Response) => {
  try {
    await News.findByIdAndDelete(req.params['id']);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete news.' });
  }
});

export default router;
