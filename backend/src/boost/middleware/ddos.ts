import type { Request, Response, NextFunction } from 'express';

const SPIKE_WINDOW_MS     = 10_000;
const SPIKE_THRESHOLD     = 80;
const NORMAL_THRESHOLD    = 15;
const ATTACK_MIN_DURATION = 30 * 60_000;
const COOLDOWN_EXTENSION  = 5  * 60_000;
const RATE_LIMIT_WINDOW   = 60_000;
const RATE_LIMIT_NORMAL   = 300;
const RATE_LIMIT_ATTACK   = 60;
const CLEANUP_INTERVAL    = 30_000;

let underAttack     = false;
let attackEndsAt    = 0;
let attackStartedAt = 0;

const ipTimestamps  = new Map<string, number[]>();
const ipRateData    = new Map<string, { count: number; windowStart: number }>();
export const tempBannedIps = new Map<string, number>();

export function getIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return (typeof forwarded === 'string' ? forwarded : forwarded[0]).split(',')[0]!.trim();
  }
  return req.socket.remoteAddress ?? 'unknown';
}

export function banIp(ip: string, durationMs: number): void {
  tempBannedIps.set(ip, Date.now() + durationMs);
}

export function getProtectionStatus() {
  return { underAttack, since: underAttack ? attackStartedAt : undefined, until: underAttack ? attackEndsAt : undefined };
}

function countUniqueIpsInWindow(now: number): number {
  const cutoff = now - SPIKE_WINDOW_MS;
  let count = 0;
  for (const timestamps of ipTimestamps.values()) {
    if ((timestamps.at(-1) ?? 0) > cutoff) count++;
  }
  return count;
}

function triggerAttack(uniqueIps: number): void {
  const now = Date.now();
  if (underAttack) {
    if (now < attackEndsAt - COOLDOWN_EXTENSION) return;
    attackEndsAt = now + ATTACK_MIN_DURATION;
    return;
  }
  underAttack = true;
  attackStartedAt = now;
  attackEndsAt = now + ATTACK_MIN_DURATION;
  console.warn(`[ddos] ATTACK - ${uniqueIps} unique IPs in ${SPIKE_WINDOW_MS / 1000}s`);
}

setInterval(() => {
  const now = Date.now();
  const ipCutoff   = now - SPIKE_WINDOW_MS * 20;
  const rateCutoff = now - RATE_LIMIT_WINDOW * 3;
  for (const [ip, ts] of ipTimestamps) {
    const fresh = ts.filter(t => t > ipCutoff);
    if (fresh.length === 0) ipTimestamps.delete(ip); else ipTimestamps.set(ip, fresh);
  }
  for (const [ip, d] of ipRateData) { if (d.windowStart < rateCutoff) ipRateData.delete(ip); }
  for (const [ip, unbanAt] of tempBannedIps) { if (unbanAt < now) tempBannedIps.delete(ip); }
  if (underAttack && now >= attackEndsAt) {
    if (countUniqueIpsInWindow(now) < NORMAL_THRESHOLD) {
      underAttack = false;
      console.info('[ddos] Traffic normalised, disabling protection');
    } else {
      attackEndsAt = now + COOLDOWN_EXTENSION;
    }
  }
}, CLEANUP_INTERVAL);

export function ddosProtection(req: Request, res: Response, next: NextFunction): void {
  // IPN webhooks bypass DDoS checks
  if (req.path.startsWith('/api/orders/ipn')) { next(); return; }

  const ip  = getIp(req);
  const now = Date.now();

  const banUntil = tempBannedIps.get(ip);
  if (banUntil && banUntil > now) {
    res.setHeader('Retry-After', String(Math.ceil((banUntil - now) / 1000)));
    res.status(429).json({ error: 'Too many requests. Please try again later.' });
    return;
  }

  const ts = ipTimestamps.get(ip) ?? [];
  ts.push(now);
  ipTimestamps.set(ip, ts);
  if (countUniqueIpsInWindow(now) >= SPIKE_THRESHOLD) triggerAttack(countUniqueIpsInWindow(now));

  const maxReq  = underAttack ? RATE_LIMIT_ATTACK : RATE_LIMIT_NORMAL;
  const rateEntry = ipRateData.get(ip);
  if (!rateEntry || now - rateEntry.windowStart > RATE_LIMIT_WINDOW) {
    ipRateData.set(ip, { count: 1, windowStart: now });
  } else {
    rateEntry.count++;
    if (rateEntry.count > maxReq) {
      const retryAfter = Math.ceil((rateEntry.windowStart + RATE_LIMIT_WINDOW - now) / 1000);
      res.setHeader('Retry-After', String(Math.max(1, retryAfter)));
      res.status(429).json({ error: 'Rate limit exceeded. Please slow down.' });
      return;
    }
  }

  res.setHeader('X-Boost-Protection', underAttack ? 'active' : 'normal');
  next();
}
