/**
 * Structured audit logger middleware.
 *
 * Logs every request to sensitive routes (auth + payments) as a JSON line
 * to stdout, including IP, user session, method, path, status, and duration.
 * Attach before route handlers so the finish event fires after the response.
 */

import type { Request, Response, NextFunction } from 'express';
import { getIp } from './ddos.js';

// Paths that should be audit-logged
const AUDITED_PREFIXES = [
  '/auth/signin',
  '/auth/register',
  '/auth/logout',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/resend-verification',
  '/auth/discord',
  '/auth/google',
  '/payments/create',
  '/payments/ipn',
  '/payments/status',
];

export function auditLogger(req: Request, res: Response, next: NextFunction): void {
  // req.path here is relative to /api, e.g. /auth/signin
  const path = req.path;
  const shouldLog = AUDITED_PREFIXES.some(p => path.startsWith(p));

  if (!shouldLog) {
    next();
    return;
  }

  const start = Date.now();
  const ip    = getIp(req);
  const ua    = (req.headers['user-agent'] ?? 'unknown').slice(0, 150);

  res.on('finish', () => {
    const entry = {
      type:     'audit',
      ts:       new Date().toISOString(),
      ip,
      method:   req.method,
      path,
      status:   res.statusCode,
      ms:       Date.now() - start,
      userId:   (req.session as unknown as Record<string, unknown>)?.['userId'] ?? null,
      ua,
    };
    // Use process.stdout.write to avoid logger overhead on hot path
    process.stdout.write(JSON.stringify(entry) + '\n');
  });

  next();
}
