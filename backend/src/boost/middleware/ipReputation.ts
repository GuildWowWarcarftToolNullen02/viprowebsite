import type { Request, Response, NextFunction } from 'express';
import { banIp, getIp } from './ddos.js';

const BOT_UA: RegExp[] = [
  /\bbot\b/i, /\bcrawler\b/i, /\bspider\b/i, /\bscraper\b/i,
  /^python-requests\//i, /^python-urllib\//i, /^go-http-client\//i,
  /^axios\//i, /^node-fetch\//i, /^undici\//i, /^curl\//i,
  /^wget\//i, /^httpx\//i, /^aiohttp\//i,
];
const HEADLESS: RegExp[] = [
  /HeadlessChrome/i, /PhantomJS/i, /Selenium/i, /WebDriver/i,
  /Playwright/i, /Puppeteer/i, /Cypress\//i,
];
const SKIP_PATHS = new Set(['/api/health', '/api/orders/ipn']);

export function ipReputationCheck(req: Request, res: Response, next: NextFunction): void {
  if (SKIP_PATHS.has(req.path)) { next(); return; }

  const ua      = req.headers['user-agent'] ?? '';
  const accept  = req.headers['accept'];
  const accLang = req.headers['accept-language'];
  let score = 0;

  if (!ua) { score += 30; }
  else {
    if (BOT_UA.some(p => p.test(ua))) score += 35;
    if (HEADLESS.some(p => p.test(ua))) score += 50;
  }
  if (!accept) score += 15;
  if (!accLang && req.method !== 'OPTIONS') score += 15;
  if (req.httpVersion === '1.0') score += 20;

  if (score >= 70) {
    banIp(getIp(req), 5 * 60_000);
    res.status(403).json({ error: 'Request blocked.' });
    return;
  }
  next();
}
