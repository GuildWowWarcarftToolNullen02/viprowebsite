import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { CURRENCIES, type Currency } from '@/components/CurrencySelector';

// Fallback rates vs USD (used if live API fails)
const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.91,
  GBP: 0.78,
  CAD: 1.37,
  AUD: 1.55,
  JPY: 144,
  CNY: 7.28,
  INR: 84,
  BRL: 5.70,
  MXN: 17.3,
  KRW: 1380,
  SGD: 1.34,
  HKD: 7.80,
  CHF: 0.90,
  SEK: 10.5,
  NOK: 10.7,
  DKK: 6.92,
  NZD: 1.68,
  ZAR: 18.5,
  AED: 3.67,
  SAR: 3.75,
  TRY: 40.0,
  PLN: 3.90,
  CZK: 23.0,
  HUF: 375,
  THB: 34.5,
  MYR: 4.42,
  IDR: 16500,
  PHP: 58,
  VND: 25500,
  PKR: 282,
  EGP: 57.0,
  NGN: 1680,
  ILS: 3.70,
  RUB: 88,
};

// Live rates fetched from API (updated every 6 hours)
export let RATES: Record<string, number> = { ...FALLBACK_RATES };

// Fetch live exchange rates from API
async function fetchLiveRates(): Promise<void> {
  try {
    // Use exchangerate-api.com free tier (1500 requests/month, updates daily)
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    if (!res.ok) throw new Error('API request failed');
    
    const data = await res.json() as { rates?: Record<string, number> };
    if (data.rates) {
      // Update RATES with live values
      Object.keys(FALLBACK_RATES).forEach((code) => {
        if (data.rates![code]) {
          RATES[code] = data.rates![code];
        }
      });
      
      // Cache the rates in localStorage with timestamp
      localStorage.setItem('msk_exchange_rates', JSON.stringify(RATES));
      localStorage.setItem('msk_exchange_rates_ts', String(Date.now()));
      
      console.log('[CurrencyContext] Live exchange rates updated successfully');
    }
  } catch (err) {
    console.warn('[CurrencyContext] Failed to fetch live rates, using fallback:', err);
  }
}

// Load cached rates or fetch fresh ones
function initializeRates(): void {
  const cached = localStorage.getItem('msk_exchange_rates');
  const cachedTs = localStorage.getItem('msk_exchange_rates_ts');
  
  // Use cached rates if less than 6 hours old
  if (cached && cachedTs) {
    const age = Date.now() - Number(cachedTs);
    const SIX_HOURS = 6 * 60 * 60 * 1000;
    
    if (age < SIX_HOURS) {
      try {
        RATES = JSON.parse(cached);
        console.log('[CurrencyContext] Using cached exchange rates');
        return;
      } catch {
        // Invalid cache, fetch fresh
      }
    }
  }
  
  // Fetch fresh rates
  fetchLiveRates();
}

// Initialize rates on module load
initializeRates();

/** Convert a USD amount to the selected currency, return a formatted string */
export function convertPrice(usd: number, currency: Currency): string {
  const rate = RATES[currency.code] ?? 1;
  const converted = usd * rate;

  // Currencies with no decimal places
  const noDecimal = ['JPY', 'KRW', 'IDR', 'VND', 'HUF', 'NGN', 'PKR', 'CZK'];
  // Currencies better shown rounded to whole number when large
  const rounded = converted >= 1000;

  const amount =
    noDecimal.includes(currency.code) || rounded
      ? Math.round(converted).toLocaleString()
      : converted < 10
        ? converted.toFixed(2)
        : Math.round(converted).toLocaleString();

  return `${currency.symbol}${amount}`;
}

interface CurrencyContextValue {
  currency: Currency;
  setCurrency: (c: Currency) => void;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: CURRENCIES[0],
  setCurrency: () => {},
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(CURRENCIES[0]);

  // Auto-detect from IP on first load
  useEffect(() => {
    const saved = sessionStorage.getItem('msk_currency');
    if (saved) {
      const match = CURRENCIES.find((c) => c.code === saved);
      if (match) { setCurrencyState(match); return; }
    }
    fetch('https://ipapi.co/json/')
      .then((r) => r.json())
      .then((data: { currency?: string }) => {
        if (data.currency) {
          const match = CURRENCIES.find((c) => c.code === data.currency);
          if (match) setCurrencyState(match);
        }
      })
      .catch(() => {});
  }, []);

  // Refresh exchange rates every 6 hours while page is open
  useEffect(() => {
    const SIX_HOURS = 6 * 60 * 60 * 1000;
    const interval = setInterval(() => {
      fetchLiveRates();
    }, SIX_HOURS);
    
    return () => clearInterval(interval);
  }, []);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    sessionStorage.setItem('msk_currency', c.code);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
