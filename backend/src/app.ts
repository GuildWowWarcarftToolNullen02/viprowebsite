import express from 'express';
import cors from 'cors';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import router from './routes/index.js';
import { ddosProtection } from './middleware/ddos.js';
import { ipReputationCheck } from './middleware/ipReputation.js';
import { auditLogger } from './middleware/auditLogger.js';

const app = express();

// Trust proxy (Vercel / reverse proxies) so req.protocol / req.hostname are correct
app.set('trust proxy', 1);

const allowedOrigins = [
  process.env['APP_URL'] || 'https://mskhub.store',
  process.env['APP_URL_BOOST'] || 'https://boost.mskhub.store',
  'https://mskhub.store',
  'https://boost.mskhub.store',
  'https://dashboard.mskhub.store',
  'https://admin.mskhub.store',
  'http://localhost:3000',
  'http://localhost:5173',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.mskhub.store') ||
      origin.includes('localhost')
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
}));

// ── Security middleware - applied before body parsing ─────────────
// DDoS protection: spike detection, per-IP rate limiting, temp-ban check
app.use(ddosProtection);

// IP reputation: blocks bots, headless browsers, fake fingerprints
app.use(ipReputationCheck);

// ── Body parsing - limited to prevent oversized payload attacks ───
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// ── Security headers ─────────────────────────────────────────────
app.use((_req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  // X-XSS-Protection is deprecated; modern browsers ignore it and it can introduce vulnerabilities
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  // Strict Content-Security-Policy for the API (no HTML rendering occurs here)
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  next();
});

// ── Session ───────────────────────────────────────────────────────
const sessionSecret = process.env['SESSION_SECRET'];
if (!sessionSecret) throw new Error('SESSION_SECRET environment variable is required');
const mongoUri = process.env['MONGODB_URI'];

if (!mongoUri) throw new Error('MONGODB_URI is required');

const appUrl = new URL(process.env['APP_URL'] || 'https://mskhub.store');
const baseHost = appUrl.hostname.includes('mskhub.store') ? 'mskhub.store' : appUrl.hostname;
const cookieDomain = baseHost === 'localhost' ? undefined : `.${baseHost}`;

app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  store: MongoStore.create({
    mongoUrl: mongoUri,
    ttl: 7 * 24 * 60 * 60, // 7 days
  }),
  cookie: {
    domain: cookieDomain,
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
}));

// ── Audit logging - after session so userId is available ─────────
app.use('/api', auditLogger);

// ── Routes ────────────────────────────────────────────────────────
app.use('/api', router);

// ── Catch-all error handler - never expose internal details ───────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[app] Unhandled error:', err);
  res.status(500).json({ error: 'An unexpected error occurred.' });
});

export default app;
