import type { Request, Response, NextFunction } from 'express';
import { getIp } from './ddos.js';

interface RateLimitEntry { count: number; windowStart: number; }

export function createRateLimiter(maxRequests: number, windowMs: number) {
  const store = new Map<string, RateLimitEntry>();

  setInterval(() => {
    const cutoff = Date.now() - windowMs * 3;
    for (const [key, entry] of store) {
      if (entry.windowStart < cutoff) store.delete(key);
    }
  }, 5 * 60_000);

  return function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
    const ip  = getIp(req);
    const now = Date.now();
    const entry = store.get(ip);

    if (!entry || now - entry.windowStart > windowMs) {
      store.set(ip, { count: 1, windowStart: now });
      next();
      return;
    }

    entry.count++;
    if (entry.count > maxRequests) {
      const retryAfter = Math.ceil((entry.windowStart + windowMs - now) / 1000);
      res.setHeader('Retry-After', String(Math.max(1, retryAfter)));
      res.status(429).json({ error: 'Too many requests. Please wait before trying again.' });
      return;
    }
    next();
  };
}
