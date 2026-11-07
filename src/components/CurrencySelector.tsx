import { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check, Search } from 'lucide-react';

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

export const CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar',           symbol: '$',   flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro',                 symbol: '€',   flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound',        symbol: '£',   flag: '🇬🇧' },
  { code: 'CAD', name: 'Canadian Dollar',      symbol: 'CA$', flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar',    symbol: 'A$',  flag: '🇦🇺' },
  { code: 'JPY', name: 'Japanese Yen',         symbol: '¥',   flag: '🇯🇵' },
  { code: 'CNY', name: 'Chinese Yuan',         symbol: '¥',   flag: '🇨🇳' },
  { code: 'INR', name: 'Indian Rupee',         symbol: '₹',   flag: '🇮🇳' },
  { code: 'BRL', name: 'Brazilian Real',       symbol: 'R$',  flag: '🇧🇷' },
  { code: 'MXN', name: 'Mexican Peso',         symbol: 'MX$', flag: '🇲🇽' },
  { code: 'KRW', name: 'South Korean Won',     symbol: '₩',   flag: '🇰🇷' },
  { code: 'SGD', name: 'Singapore Dollar',     symbol: 'S$',  flag: '🇸🇬' },
  { code: 'HKD', name: 'Hong Kong Dollar',     symbol: 'HK$', flag: '🇭🇰' },
  { code: 'CHF', name: 'Swiss Franc',          symbol: 'Fr',  flag: '🇨🇭' },
  { code: 'SEK', name: 'Swedish Krona',        symbol: 'kr',  flag: '🇸🇪' },
  { code: 'NOK', name: 'Norwegian Krone',      symbol: 'kr',  flag: '🇳🇴' },
  { code: 'DKK', name: 'Danish Krone',         symbol: 'kr',  flag: '🇩🇰' },
  { code: 'NZD', name: 'New Zealand Dollar',   symbol: 'NZ$', flag: '🇳🇿' },
  { code: 'ZAR', name: 'South African Rand',   symbol: 'R',   flag: '🇿🇦' },
  { code: 'AED', name: 'UAE Dirham',           symbol: 'د.إ', flag: '🇦🇪' },
  { code: 'SAR', name: 'Saudi Riyal',          symbol: '﷼',   flag: '🇸🇦' },
  { code: 'TRY', name: 'Turkish Lira',         symbol: '₺',   flag: '🇹🇷' },
  { code: 'PLN', name: 'Polish Złoty',         symbol: 'zł',  flag: '🇵🇱' },
  { code: 'CZK', name: 'Czech Koruna',         symbol: 'Kč',  flag: '🇨🇿' },
  { code: 'HUF', name: 'Hungarian Forint',     symbol: 'Ft',  flag: '🇭🇺' },
  { code: 'THB', name: 'Thai Baht',            symbol: '฿',   flag: '🇹🇭' },
  { code: 'MYR', name: 'Malaysian Ringgit',    symbol: 'RM',  flag: '🇲🇾' },
  { code: 'IDR', name: 'Indonesian Rupiah',    symbol: 'Rp',  flag: '🇮🇩' },
  { code: 'PHP', name: 'Philippine Peso',      symbol: '₱',   flag: '🇵🇭' },
  { code: 'VND', name: 'Vietnamese Dong',      symbol: '₫',   flag: '🇻🇳' },
  { code: 'PKR', name: 'Pakistani Rupee',      symbol: '₨',   flag: '🇵🇰' },
  { code: 'EGP', name: 'Egyptian Pound',       symbol: 'L.E', flag: '🇪🇬' },
  { code: 'NGN', name: 'Nigerian Naira',       symbol: '₦',   flag: '🇳🇬' },
  { code: 'ILS', name: 'Israeli Shekel',       symbol: '₪',   flag: '🇮🇱' },
  { code: 'RUB', name: 'Russian Ruble',        symbol: '₽',   flag: '🇷🇺' },
];

interface Props {
  selected: Currency;
  onSelect: (c: Currency) => void;
}

export function CurrencySelector({ selected, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = CURRENCIES.filter(
    (c) =>
      c.code.toLowerCase().includes(query.toLowerCase()) ||
      c.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => { setOpen(!open); setQuery(''); }}
        className="h-10 flex items-center gap-2 px-3.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 active:bg-white/[0.12] transition-all text-xs font-semibold text-white/90 shadow-sm"
        aria-label="Select currency"
      >
        <Globe size={14} className="shrink-0 text-white/60" />
        <span className="font-mono font-bold tracking-wider text-xs">{selected.code}</span>
        <span className="text-white/40 text-xs">{selected.symbol}</span>
        <ChevronDown
          size={12}
          className={`shrink-0 text-white/40 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-white/10 bg-black/90 backdrop-blur-xl shadow-[0_24px_64px_rgba(0,0,0,0.8)] z-[300] overflow-hidden">
          {/* Header */}
          <div className="px-4 pt-4 pb-3 border-b border-white/8">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40 mb-3">
              Currency
            </p>
            {/* Search */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus-within:border-white/25 transition-colors">
              <Search size={12} className="text-white/35 shrink-0" />
              <input
                type="text"
                placeholder="Search currencies…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-xs text-white placeholder:text-white/30 outline-none"
                autoFocus
              />
            </div>
          </div>

          {/* List */}
          <ul className="max-h-60 overflow-y-auto overscroll-contain py-1.5 currency-scroll">
            {filtered.length === 0 ? (
              <li className="px-4 py-6 text-center text-xs text-white/30">No results</li>
            ) : (
              filtered.map((c) => {
                const isActive = c.code === selected.code;
                return (
                  <li key={c.code}>
                    <button
                      onClick={() => { onSelect(c); setOpen(false); setQuery(''); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors group ${
                        isActive
                          ? 'bg-white/8 text-white'
                          : 'text-white/60 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span className="text-base leading-none">{c.flag}</span>
                      <span className="font-mono font-bold text-xs tracking-wider text-white/90 group-hover:text-white">
                        {c.code}
                      </span>
                      <span className="text-xs text-white/40 flex-1 truncate">- {c.name}</span>
                      {isActive && (
                        <Check size={12} className="shrink-0 text-white/70" />
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>

          {/* Footer note */}
          <div className="px-4 py-2.5 border-t border-white/8">
            <p className="text-[10px] text-white/25 text-center">
              Prices in USD. Currency shown for reference.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
