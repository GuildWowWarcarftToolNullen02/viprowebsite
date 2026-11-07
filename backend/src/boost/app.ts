import express from 'express';
import cors from 'cors';
import router from './routes/index.js';
import { ddosProtection } from './middleware/ddos.js';
import { ipReputationCheck } from './middleware/ipReputation.js';
import { auditLogger } from './middleware/auditLogger.js';

const app = express();

app.set('trust proxy', 1);

const allowedOrigin = process.env['APP_URL'] || 'http://localhost:3010';
app.use(cors({ origin: allowedOrigin, credentials: true }));

// Security middleware
app.use(ddosProtection);
app.use(ipReputationCheck);

// Body parsing
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// Security headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  next();
});

// Audit logging
app.use('/api', auditLogger);

// Routes
app.use('/api', router);

// Global error handler - never expose internal details
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[boost-app] Unhandled error:', err);
  res.status(500).json({ error: 'An unexpected error occurred.' });
});

export default app;
