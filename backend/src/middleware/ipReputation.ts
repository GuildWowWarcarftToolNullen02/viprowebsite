/**
 * IP Reputation scoring middleware.
 *
 * Scores each request 0-100 based on behavioral and header signals.
 * Requests scoring ≥70 are blocked and the IP is temp-banned for 5 min.
 * Requests scoring 40-69 are flagged but allowed through (used by other
 * middleware to apply stricter sub-limits).
 *
 * Signals checked:
 *   - Absent or clearly-automated User-Agent
 *   - Headless browser / WebDriver indicators
 *   - Missing Accept / Accept-Language headers (real browsers always send these)
 *   - HTTP/1.0 (modern browsers use HTTP/1.1+)
 */

import type { Request, Response, NextFunction } from 'express';
import { banIp, getIp } from './ddos.js';

// ── Known bot / automation UA patterns ───────────────────────────
const BOT_UA_PATTERNS: RegExp[] = [
  /\bbot\b/i, /\bcrawler\b/i, /\bspider\b/i, /\bscraper\b/i,
  /\bslurp\b/i, /\bfeedparser\b/i,
  /^python-requests\//i, /^python-urllib\//i,
  /^go-http-client\//i, /^Java\//i, /^okhttp\//i,
  /^axios\//i, /^node-fetch\//i, /^undici\//i, /^libwww-perl\//i,
  /^curl\//i, /^wget\//i, /^httpx\//i, /^aiohttp\//i,
  /^Scrapy\//i, /^Mechanize\//i,
];

// ── Headless / automation indicators inside UA strings ────────────
const HEADLESS_PATTERNS: RegExp[] = [
  /HeadlessChrome/i, /headless/i,
  /PhantomJS/i, /Selenium/i, /WebDriver/i,
  /Playwright/i, /Puppeteer/i, /Cypress\//i,
  /nightmare/i, /slimerjs/i,
];

// ── Paths that skip reputation checks ────────────────────────────
const SKIP_PATHS = new Set([
  '/api/health',
  '/api/payments/ipn', // NowPayments webhook - can't pass browser challenges
]);

function scoreRequest(req: Request): { score: number; reasons: string[] } {
  const ua      = req.headers['user-agent'] ?? '';
  const accept  = req.headers['accept'];
  const accLang = req.headers['accept-language'];
  const reasons: string[] = [];
  let score = 0;

  // No User-Agent at all
  if (!ua) {
    score += 30;
    reasons.push('no-ua');
  } else {
    // Bot UA
    for (const pattern of BOT_UA_PATTERNS) {
      if (pattern.test(ua)) {
        score += 35;
        reasons.push(`bot-ua`);
        break;
      }
    }

    // Headless / automation indicator
    for (const pattern of HEADLESS_PATTERNS) {
      if (pattern.test(ua)) {
        score += 50;
        reasons.push('headless');
        break;
      }
    }
  }

  // Missing Accept header (all real browsers send this)
  if (!accept) {
    score += 15;
    reasons.push('no-accept');
  }

  // Missing Accept-Language (real browsers send this for every non-preflight request)
  if (!accLang && req.method !== 'OPTIONS') {
    score += 15;
    reasons.push('no-accept-language');
  }

  // HTTP/1.0 - modern clients never use this
  if (req.httpVersion === '1.0') {
    score += 20;
    reasons.push('http-1.0');
  }

  return { score, reasons };
}

export function ipReputationCheck(req: Request, res: Response, next: NextFunction): void {
  const path = req.path;

  // Skip paths that should not be gated
  if (SKIP_PATHS.has(path)) {
    next();
    return;
  }

  const ip = getIp(req);
  const { score, reasons } = scoreRequest(req);

  // Attach score for downstream middleware
  (req as unknown as Record<string, unknown>)['reputationScore'] = score;

  if (score >= 70) {
    // High risk - block and temp-ban
    banIp(ip, 5 * 60_000); // 5 minutes
    console.warn(`[ipReputation] Blocked ${ip} score=${score} reasons=[${reasons.join(', ')}]`);
    res.status(403).json({ error: 'Request blocked.' });
    return;
  }

  next();
}
