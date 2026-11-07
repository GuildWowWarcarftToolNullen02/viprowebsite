/**
 * Price calculation utilities.
 *
 * Selling price = ceil(supplierPrice Ã- (1 + markupPercent/100) Ã- 100) / 100
 * This gives the next whole cent above the exact markup price.
 *
 * Example: supplier=$0.25, markup=40% â†’ 0.25Ã-1.40=0.35 â†’ $0.35
 * Example: supplier=$0.30, markup=40% â†’ 0.30Ã-1.40=0.42 â†’ $0.42
 */

function getMarkup(envKey: string, defaultPct = 40): number {
  const raw = process.env[envKey];
  if (!raw) return defaultPct;
  const n = parseFloat(raw);
  return isNaN(n) ? defaultPct : n;
}

/**
 * Calculate our selling price per unit from the supplier's cost.
 * Result is rounded UP to the nearest cent.
 */
export function calcSellingPrice(supplierCost: number, markupPercent: number): number {
  return Math.ceil(supplierCost * (1 + markupPercent / 100) * 100) / 100;
}

export function getBoostMarkup(): number   { return getMarkup('BOOST_MARKUP_PERCENT'); }
export function getNitroMarkup(): number   { return getMarkup('NITRO_MARKUP_PERCENT'); }
export function getTokenMarkup(): number   { return getMarkup('TOKEN_MARKUP_PERCENT'); }

/** Round a price to 2 decimal places (for display) */
export function roundPrice(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Calculate total price for a quantity */
export function calcTotal(unitPrice: number, quantity: number): number {
  return roundPrice(unitPrice * quantity);
}
