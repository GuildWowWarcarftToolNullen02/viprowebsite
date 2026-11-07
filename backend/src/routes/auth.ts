import { Router, type Request, type Response } from 'express';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { User } from '../db/models/User.js';
import { verifyTurnstile } from '../lib/turnstile.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../lib/email.js';
import { bruteForceProtection } from '../middleware/bruteForce.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';
import { createSignedOAuthState, verifySignedOAuthState } from '../lib/oauthState.js';

const router = Router();

const authLimiter          = createRateLimiter(10, 60_000);
const sensitiveAuthLimiter = createRateLimiter(5,  60_000);
const forgotPassLimiter    = createRateLimiter(3,  60_000);

const VERIFY_EXPIRY_MS = 15 * 60 * 1000;
const LOGIN_HISTORY_MAX = 20; // keep last 20 entries per user

function appUrl(req: Request): string {
  const host = (req.get('x-forwarded-host') || req.get('host') || '').toLowerCase();
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    const proto = req.get('x-forwarded-proto') || req.protocol || 'http';
    return `${proto}://${host}`;
  }

  // Canonical base domain: ensures Google OAuth matches https://sessionguardvip.cc/api/auth/google/callback
  // and prevents accidental redirects to boost.sessionguardvip.cc/login (which has no login route)
  return 'https://sessionguardvip.cc';
}

function frontendUrl(req: Request, path = ''): string {
  return appUrl(req) + path;
}

function getIp(req: Request): string {
  return req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ?? req.socket.remoteAddress ?? 'unknown';
}

function getUa(req: Request): string {
  return (req.headers['user-agent'] ?? 'unknown').slice(0, 200);
}

/** Push a login entry and cap the array at LOGIN_HISTORY_MAX */
async function recordLogin(userId: string, ip: string, ua: string) {
  await User.updateOne(
    { _id: userId },
    {
      lastLogin: new Date(),
      $push: {
        loginHistory: {
          $each: [{ ip, ua, at: new Date() }],
          $slice: -LOGIN_HISTORY_MAX,
        },
      },
    },
  );
}

// ── GET /api/auth/me ─────────────────────────────────────────────
router.get('/me', authLimiter, async (req: Request, res: Response) => {
  if (!req.session.userId) { res.json({ user: null }); return; }

  try {
    const user = await User.findById(req.session.userId);
    if (!user) { req.session.destroy(() => {}); res.json({ user: null }); return; }

    res.json({
      user: {
        id:       user._id.toString(),
        username: user.username,
        avatar:   user.avatar ?? null,
        provider: user.provider,
        email:    user.email,
      },
    });
  } catch {
    res.status(500).json({ error: 'Unable to retrieve user.' });
  }
});

// ── POST /api/auth/logout ────────────────────────────────────────
router.post('/logout', authLimiter, (req: Request, res: Response) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

// ── POST /api/auth/register ──────────────────────────────────────
router.post('/register', sensitiveAuthLimiter, bruteForceProtection, async (req: Request, res: Response) => {
  const { username, email, password, turnstileToken } = req.body as Record<string, string>;

  if (!username || !email || !password || !turnstileToken) {
    res.status(400).json({ error: 'Missing required fields.' }); return;
  }
  if (username.length < 2 || username.length > 32) {
    res.status(400).json({ error: 'Username must be 2-32 characters.' }); return;
  }
  if (email.length > 254) {
    res.status(400).json({ error: 'Invalid email address.' }); return;
  }

  const ip = getIp(req);
  const ok = await verifyTurnstile(turnstileToken, ip);
  if (!ok) { res.status(400).json({ error: 'Security check failed. Please refresh and try again.' }); return; }

  if (password.length < 8)   { res.status(400).json({ error: 'Password must be at least 8 characters.' }); return; }
  if (password.length > 128) { res.status(400).json({ error: 'Password too long.' }); return; }

  try {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) { res.status(400).json({ error: 'An account with that email already exists.' }); return; }

    const hashed = await bcrypt.hash(password, 12);
    const verificationToken = randomBytes(48).toString('base64url');
    const verificationTokenExpires = new Date(Date.now() + VERIFY_EXPIRY_MS);

    await User.create({
      email: email.toLowerCase(), username, password: hashed,
      provider: 'local', emailVerified: false,
      verificationToken, verificationTokenExpires,
    });

    sendVerificationEmail(email.toLowerCase(), username, verificationToken, appUrl(req)).catch((err) => {
      console.error('[auth/register] Email send failed:', err);
    });

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// ── POST /api/auth/signin ────────────────────────────────────────
router.post('/signin', sensitiveAuthLimiter, bruteForceProtection, async (req: Request, res: Response) => {
  const { email, password, turnstileToken } = req.body as Record<string, string>;

  if (!email || !password || !turnstileToken) {
    res.status(400).json({ error: 'Missing required fields.' }); return;
  }

  const ip = getIp(req);
  const ok = await verifyTurnstile(turnstileToken, ip);
  if (!ok) { res.status(400).json({ error: 'Security check failed. Please refresh and try again.', code: 'turnstile_failed' }); return; }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.password) { res.status(401).json({ error: 'Invalid email or password.' }); return; }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) { res.status(401).json({ error: 'Invalid email or password.' }); return; }

    if (!user.emailVerified) {
      res.status(403).json({ error: 'Please verify your email address before signing in.' }); return;
    }

    req.session.userId = user._id.toString();
    await recordLogin(user._id.toString(), ip, getUa(req));
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Sign in failed. Please try again.' });
  }
});

// ── POST /api/auth/resend-verification ──────────────────────────
router.post('/resend-verification', forgotPassLimiter, async (req: Request, res: Response) => {
  const { email } = req.body as { email?: string };
  if (!email) { res.status(400).json({ error: 'Email is required.' }); return; }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || user.emailVerified) { res.json({ success: true }); return; }

    if (user.resendCooldownUntil && user.resendCooldownUntil > new Date()) {
      const remaining = Math.ceil((user.resendCooldownUntil.getTime() - Date.now()) / 1000);
      res.status(429).json({ error: 'Please wait before requesting another email.', remaining }); return;
    }

    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + VERIFY_EXPIRY_MS);
    const cooldown = new Date(Date.now() + 60 * 1000);

    await User.updateOne({ _id: user._id }, {
      verificationToken: token, verificationTokenExpires: expires, resendCooldownUntil: cooldown,
    });

    sendVerificationEmail(user.email, user.username, token, appUrl(req)).catch((err) => {
      console.error('[auth/resend-verification] Email send failed:', err);
    });

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to resend verification email.' });
  }
});

// ── GET /api/auth/verify-email ───────────────────────────────────
router.get('/verify-email', async (req: Request, res: Response) => {
  const { token } = req.query as { token?: string };
  if (!token) { res.redirect(frontendUrl(req, '/login?error=invalid_token')); return; }

  try {
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: new Date() },
    });

    if (!user) { res.redirect(frontendUrl(req, '/login?error=invalid_token')); return; }

    await User.updateOne({ _id: user._id }, {
      $set: { emailVerified: true },
      $unset: { verificationToken: '', verificationTokenExpires: '' },
    });

    req.session.userId = user._id.toString();
    res.redirect(frontendUrl(req, '/'));
  } catch {
    res.redirect(frontendUrl(req, '/login?error=oauth_error'));
  }
});

// ── POST /api/auth/forgot-password ───────────────────────────────
router.post('/forgot-password', forgotPassLimiter, async (req: Request, res: Response) => {
  const { email } = req.body as { email?: string };
  if (!email) { res.status(400).json({ error: 'Email is required.' }); return; }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || user.provider !== 'local') { res.json({ success: true }); return; }

    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    await User.updateOne({ _id: user._id }, { resetPasswordToken: token, resetPasswordTokenExpires: expires });

    sendPasswordResetEmail(user.email, user.username, token, appUrl(req)).catch((err) => {
      console.error('[auth/forgot-password] Email send failed:', err);
    });

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to send reset email. Please try again.' });
  }
});

// ── POST /api/auth/reset-password ────────────────────────────────
router.post('/reset-password', sensitiveAuthLimiter, async (req: Request, res: Response) => {
  const { token, password } = req.body as { token?: string; password?: string };
  if (!token || !password) { res.status(400).json({ error: 'Missing token or password.' }); return; }
  if (password.length < 8)   { res.status(400).json({ error: 'Password must be at least 8 characters.' }); return; }
  if (password.length > 128) { res.status(400).json({ error: 'Password too long.' }); return; }

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordTokenExpires: { $gt: new Date() },
    });

    if (!user) { res.status(400).json({ error: 'Reset link is invalid or has expired.' }); return; }

    const hashed = await bcrypt.hash(password, 12);
    await User.updateOne({ _id: user._id }, {
      $set: { password: hashed, emailVerified: true },
      $unset: { resetPasswordToken: '', resetPasswordTokenExpires: '' },
    });

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to reset password. Please try again.' });
  }
});

// ── GET /api/auth/discord ────────────────────────────────────────
// Supports ?link=1 when called from a logged-in session to link Discord
router.get('/discord', authLimiter, async (req: Request, res: Response) => {
  const { t: turnstileToken, from, link } = req.query as { t?: string; from?: string; link?: string };

  if (!turnstileToken) { res.redirect(frontendUrl(req, '/login?error=missing_turnstile')); return; }

  const clientId     = process.env['DISCORD_CLIENT_ID']?.trim();
  if (!clientId) {
    console.error('[auth/discord] DISCORD_CLIENT_ID missing in env');
    res.redirect(frontendUrl(req, '/login?error=oauth_error&reason=missing_discord_id'));
    return;
  }

  const ip = getIp(req);
  const ok = await verifyTurnstile(turnstileToken, ip);
  if (!ok) { res.redirect(frontendUrl(req, '/login?error=turnstile_failed')); return; }

  const state = createSignedOAuthState({
    from,
    linkUserId: (link === '1' && req.session.userId) ? req.session.userId : undefined,
    scope: 'discord',
  });

  req.session.oauthState = state;
  if (from) req.session.oauthFrom = from;
  if (link === '1' && req.session.userId) {
    req.session.oauthLinkUserId = req.session.userId;
  }

  await new Promise<void>((resolve) => req.session.save(() => resolve()));

  const callbackUrl = `${appUrl(req)}/api/auth/discord/callback`;
  const authUrl = new URL('https://discord.com/oauth2/authorize');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', callbackUrl);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'identify email');
  authUrl.searchParams.set('state', state);

  res.redirect(authUrl.toString());
});

router.get('/discord/callback', async (req: Request, res: Response) => {
  const { code, state, error: discordError, error_description } = req.query as {
    code?: string;
    state?: string;
    error?: string;
    error_description?: string;
  };

  if (discordError) {
    console.error('[discord/callback] Discord error:', discordError, error_description);
    res.redirect(frontendUrl(req, `/login?error=oauth_failed&reason=discord_${encodeURIComponent(discordError)}`));
    return;
  }

  if (!code || !state) {
    res.redirect(frontendUrl(req, '/login?error=oauth_failed&reason=missing_code_or_state'));
    return;
  }

  const statePayload = verifySignedOAuthState(state);
  const sessionMatched = req.session.oauthState && req.session.oauthState === state;

  if (!statePayload && !sessionMatched) {
    console.warn('[discord/callback] State verification failed. Received state:', state, 'Session oauthState:', req.session?.oauthState);
    res.redirect(frontendUrl(req, '/login?error=oauth_failed&reason=state_mismatch'));
    return;
  }

  const from       = statePayload?.from ?? req.session.oauthFrom;
  const linkUserId = statePayload?.linkUserId ?? req.session.oauthLinkUserId;

  delete req.session.oauthState;
  delete req.session.oauthFrom;
  delete req.session.oauthLinkUserId;

  const clientId     = process.env['DISCORD_CLIENT_ID']?.trim();
  const clientSecret = process.env['DISCORD_CLIENT_SECRET']?.trim();
  if (!clientId || !clientSecret) {
    console.error('[discord/callback] Missing Discord credentials');
    res.redirect(frontendUrl(req, '/login?error=oauth_failed&reason=missing_credentials'));
    return;
  }
  const callbackUrl  = `${appUrl(req)}/api/auth/discord/callback`;

  try {
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, grant_type: 'authorization_code', code, redirect_uri: callbackUrl }),
    });

    if (!tokenRes.ok) {
      console.error('[discord/callback] Token exchange failed:', tokenRes.status, await tokenRes.text());
      res.redirect(frontendUrl(req, `/login?error=oauth_failed&reason=token_${tokenRes.status}`));
      return;
    }

    const tokenData = await tokenRes.json() as { access_token: string };

    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userRes.ok) {
      console.error('[discord/callback] User info failed:', userRes.status, await userRes.text());
      res.redirect(frontendUrl(req, `/login?error=oauth_error&reason=userinfo_${userRes.status}`));
      return;
    }

    const discordUser = await userRes.json() as {
      id: string; username: string; global_name?: string | null;
      email?: string; avatar?: string | null;
    };

    const avatar       = discordUser.avatar ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png` : null;
    const displayName  = discordUser.global_name || discordUser.username;
    const emailLower   = (discordUser.email || `${discordUser.id}@discord.local`).toLowerCase();
    const ip           = getIp(req);
    const ua           = getUa(req);

    // ── LINK MODE: attach Discord to existing logged-in account ──
    if (linkUserId) {
      // Make sure this Discord ID isn't already on a different account
      const alreadyLinked = await User.findOne({ discordId: discordUser.id });
      if (alreadyLinked && alreadyLinked._id.toString() !== linkUserId) {
        res.redirect('https://dashboard.mskhub.store?settings=1&error=discord_taken'); return;
      }
      await User.updateOne(
        { _id: linkUserId },
        { $set: { discordId: discordUser.id, discordAvatar: avatar ?? undefined } },
      );
      await new Promise<void>((resolve) => req.session.save(() => resolve()));
      res.redirect('https://dashboard.mskhub.store?settings=1&linked=discord');
      return;
    }

    // ── LOGIN / REGISTER MODE ────────────────────────────────────
    let user = await User.findOne({ discordId: discordUser.id });
    if (!user) user = await User.findOne({ provider: 'discord', providerId: discordUser.id });
    if (!user) user = await User.findOne({ email: emailLower });

    if (user) {
      await User.updateOne({ _id: user._id }, {
        $set: { username: displayName, avatar, provider: 'discord', providerId: discordUser.id, discordId: discordUser.id, discordAvatar: avatar ?? undefined, emailVerified: true },
      });
    } else {
      user = await User.create({
        email: emailLower, username: displayName, provider: 'discord',
        providerId: discordUser.id, discordId: discordUser.id,
        discordAvatar: avatar ?? undefined, avatar, emailVerified: true,
      });
    }

    req.session.userId = user._id.toString();
    await recordLogin(user._id.toString(), ip, ua);

    await new Promise<void>((resolve) => req.session.save(() => resolve()));

    const finalDest = from === 'dashboard' ? 'https://dashboard.mskhub.store' : frontendUrl(req, '/');
    res.redirect(finalDest);
  } catch (err) {
    console.error('[discord/callback] Uncaught error:', err);
    res.redirect(frontendUrl(req, '/login?error=oauth_error'));
  }
});

// ── GET /api/auth/google ─────────────────────────────────────────
// Supports ?link=1 when called from a logged-in session to link Google
router.get('/google', authLimiter, async (req: Request, res: Response) => {
  const { t: turnstileToken, from, link } = req.query as { t?: string; from?: string; link?: string };

  if (!turnstileToken) { res.redirect(frontendUrl(req, '/login?error=missing_turnstile')); return; }

  const clientId     = process.env['GOOGLE_CLIENT_ID']?.trim();
  const clientSecret = process.env['GOOGLE_CLIENT_SECRET']?.trim();
  if (!clientId || !clientSecret) {
    console.error('[auth/google] Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in env');
    res.redirect(frontendUrl(req, '/login?error=oauth_error&reason=missing_credentials'));
    return;
  }

  const ip = getIp(req);
  const ok = await verifyTurnstile(turnstileToken, ip);
  if (!ok) { res.redirect(frontendUrl(req, '/login?error=turnstile_failed')); return; }

  const state = createSignedOAuthState({
    from,
    linkUserId: (link === '1' && req.session.userId) ? req.session.userId : undefined,
    scope: 'google',
  });

  req.session.oauthState = state;
  if (from) req.session.oauthFrom = from;
  if (link === '1' && req.session.userId) {
    req.session.oauthLinkUserId = req.session.userId;
  }

  await new Promise<void>((resolve) => req.session.save(() => resolve()));

  const callbackUrl = `${appUrl(req)}/api/auth/google/callback`;
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', callbackUrl);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('access_type', 'online');

  res.redirect(authUrl.toString());
});

router.get('/google/callback', async (req: Request, res: Response) => {
  const { code, state, error: googleError, error_description } = req.query as {
    code?: string;
    state?: string;
    error?: string;
    error_description?: string;
  };

  if (googleError) {
    console.error('[google/callback] Google error:', googleError, error_description);
    res.redirect(frontendUrl(req, `/login?error=oauth_failed&reason=google_${encodeURIComponent(googleError)}`));
    return;
  }

  if (!code || !state) {
    console.warn('[google/callback] Missing code or state');
    res.redirect(frontendUrl(req, '/login?error=oauth_failed&reason=missing_code_or_state'));
    return;
  }

  const statePayload = verifySignedOAuthState(state);
  const sessionMatched = req.session.oauthState && req.session.oauthState === state;

  if (!statePayload && !sessionMatched) {
    console.warn('[google/callback] State verification failed. Received state:', state, 'Session oauthState:', req.session?.oauthState);
    res.redirect(frontendUrl(req, '/login?error=oauth_failed&reason=state_mismatch'));
    return;
  }

  const from       = statePayload?.from ?? req.session.oauthFrom;
  const linkUserId = statePayload?.linkUserId ?? req.session.oauthLinkUserId;

  delete req.session.oauthState;
  delete req.session.oauthFrom;
  delete req.session.oauthLinkUserId;

  const clientId     = process.env['GOOGLE_CLIENT_ID']?.trim();
  const clientSecret = process.env['GOOGLE_CLIENT_SECRET']?.trim();
  if (!clientId || !clientSecret) {
    console.error('[google/callback] Missing Google credentials in env');
    res.redirect(frontendUrl(req, '/login?error=oauth_failed&reason=missing_credentials'));
    return;
  }

  const callbackUrl  = `${appUrl(req)}/api/auth/google/callback`;

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
      const errBody = await tokenRes.text();
      console.error('[google/callback] Token exchange failed:', tokenRes.status, errBody);
      res.redirect(frontendUrl(req, `/login?error=oauth_failed&reason=token_${tokenRes.status}`));
      return;
    }

    const tokenData = await tokenRes.json() as { access_token: string };

    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userRes.ok) {
      const errBody = await userRes.text();
      console.error('[google/callback] Userinfo failed:', userRes.status, errBody);
      res.redirect(frontendUrl(req, `/login?error=oauth_error&reason=userinfo_${userRes.status}`));
      return;
    }

    const googleUser = await userRes.json() as { sub: string; email: string; name: string; picture?: string };
    const ip = getIp(req);
    const ua = getUa(req);

    // ── LINK MODE ────────────────────────────────────────────────
    if (linkUserId) {
      const alreadyLinked = await User.findOne({ googleId: googleUser.sub });
      if (alreadyLinked && alreadyLinked._id.toString() !== linkUserId) {
        res.redirect('https://dashboard.mskhub.store?settings=1&error=google_taken'); return;
      }
      await User.updateOne(
        { _id: linkUserId },
        { $set: { googleId: googleUser.sub, googleAvatar: googleUser.picture ?? undefined } },
      );
      await new Promise<void>((resolve) => req.session.save(() => resolve()));
      res.redirect('https://dashboard.mskhub.store?settings=1&linked=google');
      return;
    }

    // ── LOGIN / REGISTER MODE ────────────────────────────────────
    let user = await User.findOne({ googleId: googleUser.sub });
    if (!user) user = await User.findOne({ provider: 'google', providerId: googleUser.sub });
    if (!user) user = await User.findOne({ email: googleUser.email.toLowerCase() });

    if (user) {
      await User.updateOne({ _id: user._id }, {
        $set: { username: googleUser.name, avatar: googleUser.picture ?? null, provider: 'google', providerId: googleUser.sub, googleId: googleUser.sub, googleAvatar: googleUser.picture ?? undefined, emailVerified: true },
      });
    } else {
      user = await User.create({
        email: googleUser.email.toLowerCase(), username: googleUser.name,
        provider: 'google', providerId: googleUser.sub, googleId: googleUser.sub,
        googleAvatar: googleUser.picture ?? undefined, avatar: googleUser.picture ?? null, emailVerified: true,
      });
    }

    req.session.userId = user._id.toString();
    await recordLogin(user._id.toString(), ip, ua);

    await new Promise<void>((resolve) => req.session.save(() => resolve()));

    const finalDest = from === 'dashboard' ? 'https://dashboard.mskhub.store' : frontendUrl(req, '/');
    res.redirect(finalDest);
  } catch (err) {
    console.error('[google/callback] OAuth uncaught error:', err);
    res.redirect(frontendUrl(req, '/login?error=oauth_error'));
  }
});

export default router;
