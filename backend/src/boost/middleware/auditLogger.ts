import type { Request, Response, NextFunction } from 'express';
import { getIp } from './ddos.js';

const AUDITED = ['/orders/create', '/orders/ipn', '/discord/resolve'];

export function auditLogger(req: Request, res: Response, next: NextFunction): void {
  if (!AUDITED.some(p => req.path.startsWith(p))) { next(); return; }
  const start = Date.now();
  const ip    = getIp(req);
  const ua    = (req.headers['user-agent'] ?? 'unknown').slice(0, 150);
  res.on('finish', () => {
    process.stdout.write(JSON.stringify({
      type: 'audit', ts: new Date().toISOString(),
      ip, method: req.method, path: req.path,
      status: res.statusCode, ms: Date.now() - start, ua,
    }) + '\n');
  });
  next();
}
