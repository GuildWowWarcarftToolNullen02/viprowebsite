/**
 * Core DDoS protection middleware.
 *
 * Features:
 * - Sliding-window unique IP tracking (10s window)
 * - Attack mode triggers at 80+ unique IPs in window
 * - Auto-enables Cloudflare Under Attack mode when triggered
 * - Auto-disables when traffic normalises (checked every 30s)
 * - Per-IP rate limiting (sliding window, tightened during attack)
 * - Temp-ban store shared with brute-force and IP reputation modules
 * - Exposes protection status for the /api/protection/status endpoint
 */

import type { Request, Response, NextFunction } from 'express';
import { enableUnderAttackMode, disableUnderAttackMode } from '../lib/cloudflare.js';

// ── Tuning constants ──────────────────────────────────────────────
const SPIKE_WINDOW_MS      = 10_000;  // 10-second sliding window for unique IP counting
const SPIKE_THRESHOLD      = 80;      // unique IPs in window that triggers attack mode
const NORMAL_THRESHOLD     = 15;      // unique IPs below which we consider traffic normal
const ATTACK_MIN_DURATION  = 30 * 60_000; // attack mode minimum: 30 minutes
const COOLDOWN_EXTENSION   = 5 * 60_000;  // extend by 5 min if still elevated after minimum

const RATE_LIMIT_WINDOW_MS = 60_000;  // 1-minute window for rate limiting
const RATE_LIMIT_NORMAL    = 300;     // req/min per IP under normal conditions
const RATE_LIMIT_ATTACK    = 60;      // req/min per IP during attack mode

const CLEANUP_INTERVAL_MS  = 30_000;  // run cleanup + attack check every 30s

// ── State ─────────────────────────────────────────────────────────
let underAttack     = false;
let attackStartedAt = 0;
let attackEndsAt    = 0;

// ip -> sorted list of request timestamps (used for unique IP counting)
const ipTimestamps = new Map<string, number[]>();

// ip -> { count, windowStart } for per-IP rate limiting
const ipRateData   = new Map<string, { count: number; windowStart: number }>();

// ip -> unix ms when the ban expires (shared with brute-force / ipReputation)
export const tempBannedIps = new Map<string, number>();

// ── Helpers ───────────────────────────────────────────────────────
export function getIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return (typeof forwarded === 'string' ? forwarded : forwarded[0])
      .split(',')[0]
      .trim();
  }
  return req.socket.remoteAddress ?? 'unknown';
}

function countUniqueIpsInWindow(now: number): number {
  const cutoff = now - SPIKE_WINDOW_MS;
  let count = 0;
  for (const timestamps of ipTimestamps.values()) {
    if (timestamps.at(-1)! > cutoff) count++; // last entry is most recent
  }
  return count;
}

function cleanup(now: number): void {
  const ipCutoff   = now - SPIKE_WINDOW_MS * 20;
  const rateCutoff = now - RATE_LIMIT_WINDOW_MS * 3;

  for (const [ip, ts] of ipTimestamps) {
    const fresh = ts.filter(t => t > ipCutoff);
    if (fresh.length === 0) ipTimestamps.delete(ip);
    else ipTimestamps.set(ip, fresh);
  }

  for (const [ip, d] of ipRateData) {
    if (d.windowStart < rateCutoff) ipRateData.delete(ip);
  }

  for (const [ip, unbanAt] of tempBannedIps) {
    if (unbanAt < now) tempBannedIps.delete(ip);
  }
}

// ── Attack mode management ────────────────────────────────────────
function triggerAttack(uniqueIps: number): void {
  const now = Date.now();
  if (underAttack) {
    // Already in attack mode - extend if still within minimum window
    if (now < attackEndsAt - COOLDOWN_EXTENSION) return; // no-op, still fresh
    attackEndsAt = now + ATTACK_MIN_DURATION;
    return;
  }

  underAttack     = true;
  attackStartedAt = now;
  attackEndsAt    = now + ATTACK_MIN_DURATION;

  console.warn(`[ddos] ATTACK DETECTED - ${uniqueIps} unique IPs in ${SPIKE_WINDOW_MS / 1000}s window. Enabling protection.`);

  enableUnderAttackMode().catch(err => {
    console.error('[ddos] Cloudflare activation failed:', err instanceof Error ? err.message : err);
  });
}

function checkAttackEnd(now: number): void {
  if (!underAttack) return;
  if (now < attackEndsAt) return; // minimum duration not elapsed

  const uniqueIps = countUniqueIpsInWindow(now);
  if (uniqueIps < NORMAL_THRESHOLD) {
    underAttack = false;
    console.info(`[ddos] Traffic normalised (${uniqueIps} unique IPs). Disabling protection.`);
    disableUnderAttackMode().catch(err => {
      console.error('[ddos] Cloudflare deactivation failed:', err instanceof Error ? err.message : err);
    });
  } else {
    // Still elevated - extend cooldown
    attackEndsAt = now + COOLDOWN_EXTENSION;
    console.warn(`[ddos] Traffic still elevated (${uniqueIps} IPs) - extending protection for ${COOLDOWN_EXTENSION / 60_000} min`);
  }
}

setInterval(() => {
  const now = Date.now();
  cleanup(now);
  checkAttackEnd(now);
}, CLEANUP_INTERVAL_MS);

// ── Public helpers ────────────────────────────────────────────────
export function banIp(ip: string, durationMs: number): void {
  tempBannedIps.set(ip, Date.now() + durationMs);
}

export function getProtectionStatus() {
  return {
    underAttack,
    since: underAttack ? attackStartedAt : undefined,
    until: underAttack ? attackEndsAt    : undefined,
  };
}

// ── Middleware ────────────────────────────────────────────────────
export function ddosProtection(req: Request, res: Response, next: NextFunction): void {
  // Always allow the IPN webhook through (NowPayments can't pass challenges)
  if (req.path.startsWith('/api/payments/ipn')) {
    next();
    return;
  }

  const ip  = getIp(req);
  const now = Date.now();

  // ── 1. Temp-ban check ─────────────────────────────────────────
  const banUntil = tempBannedIps.get(ip);
  if (banUntil && banUntil > now) {
    const retryAfter = Math.ceil((banUntil - now) / 1000);
    res.setHeader('Retry-After', String(retryAfter));
    res.status(429).json({ error: 'Too many requests. Please try again later.' });
    return;
  }

  // ── 2. Track IP for spike detection ───────────────────────────
  const ts = ipTimestamps.get(ip) ?? [];
  ts.push(now);
  ipTimestamps.set(ip, ts);

  const uniqueIps = countUniqueIpsInWindow(now);
  if (uniqueIps >= SPIKE_THRESHOLD) {
    triggerAttack(uniqueIps);
  }

  // ── 3. Per-IP rate limiting ────────────────────────────────────
  const maxReq = underAttack ? RATE_LIMIT_ATTACK : RATE_LIMIT_NORMAL;
  const rateEntry = ipRateData.get(ip);

  if (!rateEntry || (now - rateEntry.windowStart) > RATE_LIMIT_WINDOW_MS) {
    ipRateData.set(ip, { count: 1, windowStart: now });
  } else {
    rateEntry.count++;
    if (rateEntry.count > maxReq) {
      const retryAfter = Math.ceil((rateEntry.windowStart + RATE_LIMIT_WINDOW_MS - now) / 1000);
      res.setHeader('Retry-After', String(Math.max(1, retryAfter)));
      res.status(429).json({ error: 'Rate limit exceeded. Please slow down.' });
      return;
    }
  }

  // ── 4. Advertise protection state ─────────────────────────────
  res.setHeader('X-MSK-Protection', underAttack ? 'active' : 'normal');

  next();
}
