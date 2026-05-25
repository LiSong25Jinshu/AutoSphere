/**
 * Currency utility — Ghana Cedis (GHS)
 * Use these helpers everywhere a monetary value is displayed.
 */

export const CURRENCY_SYMBOL = 'GH₵';
export const CURRENCY_CODE = 'GHS';
export const CURRENCY_LOCALE = 'en-GH';

/**
 * Format a number as Ghana Cedis.
 * e.g.  formatPrice(24500)  →  "GH₵ 24,500"
 *       formatPrice(45.5)   →  "GH₵ 45.50"
 */
export const formatPrice = (amount, decimals = 0) => {
  if (amount === null || amount === undefined || amount === '') return '—';
  const num = parseFloat(amount);
  if (isNaN(num)) return '—';
  return `${CURRENCY_SYMBOL} ${num.toLocaleString(CURRENCY_LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
};

/**
 * Format with 2 decimal places (for service costs / booking prices).
 * e.g.  formatCost(45)  →  "GH₵ 45.00"
 */
export const formatCost = (amount) => formatPrice(amount, 2);

/**
 * Compact format for large numbers (revenue totals).
 * e.g.  formatRevenue(485000)  →  "GH₵ 485,000"
 */
export const formatRevenue = (amount) => formatPrice(amount, 0);
