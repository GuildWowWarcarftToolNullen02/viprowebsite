/**
 * Brute-force protection middleware.
 *
 * Tracks failed authentication attempts per IP (HTTP 401/403 responses).
 * After MAX_FAILURES in FAILURE_WINDOW_MS, the IP is temp-banned for BAN_DURATION_MS.
 * Successful logins clear the failure counter for that IP.
 *
 * Apply to auth routes that accept credentials (signin, register).
 */

import type { Request, Response, NextFunction } from 'express';
import { banIp, getIp } from './ddos.js';

const MAX_FAILURES      = 5;
const FAILURE_WINDOW_MS = 15 * 60_000; // 15 minutes
const BAN_DURATION_MS   = 30 * 60_000; // 30-minute ban

interface FailRecord {
  count:     number;
  firstFail: number;
}

const failureStore = new Map<string, FailRecord>();

// Cleanup stale records every 10 minutes
setInterval(() => {
  const cutoff = Date.now() - FAILURE_WINDOW_MS * 2;
  for (const [ip, record] of failureStore) {
    if (record.firstFail < cutoff) failureStore.delete(ip);
  }
}, 10 * 60_000);

function recordFailure(ip: string): void {
  const now    = Date.now();
  const record = failureStore.get(ip);

  if (!record || now - record.firstFail > FAILURE_WINDOW_MS) {
    failureStore.set(ip, { count: 1, firstFail: now });
    return;
  }

  record.count++;

  if (record.count >= MAX_FAILURES) {
    failureStore.delete(ip);
    banIp(ip, BAN_DURATION_MS);
    console.warn(`[bruteForce] ${ip} banned after ${MAX_FAILURES} failed attempts in ${FAILURE_WINDOW_MS / 60_000} min`);
  }
}

function clearFailures(ip: string): void {
  failureStore.delete(ip);
}

/**
 * Middleware - wraps res.json to intercept auth failure/success signals.
 * Must be applied *before* the route handler.
 */
export function bruteForceProtection(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const ip = getIp(req);

  // Intercept the response to record outcome
  const origJson = res.json.bind(res) as typeof res.json;

  res.json = function (body: unknown) {
    if (res.statusCode === 401 || res.statusCode === 403) {
      recordFailure(ip);
    } else if (res.statusCode >= 200 && res.statusCode < 300) {
      clearFailures(ip);
    }
    return origJson(body);
  };

  next();
}
