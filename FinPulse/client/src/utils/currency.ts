const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

const inrFormatterNoDecimals = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const inrNumberFormatter = new Intl.NumberFormat('en-IN');

/**
 * Formats a number as Indian Rupees using the Indian digit-grouping convention
 * (e.g. ₹1,25,000.00). This is the ONLY place currency formatting logic should live —
 * every component imports from here rather than re-implementing formatting.
 */
export function formatINR(value: number | null | undefined, opts: { decimals?: boolean } = {}): string {
  if (value === null || value === undefined || !isFinite(value)) return '—';
  const formatter = opts.decimals === false ? inrFormatterNoDecimals : inrFormatter;
  return formatter.format(value);
}

/** Formats a plain number with Indian digit grouping (no currency symbol), e.g. for volume. */
export function formatIndianNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || !isFinite(value)) return '—';
  return inrNumberFormatter.format(value);
}

/** Formats a percentage change with an explicit +/- sign, e.g. +5.42% / -2.31%. */
export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || !isFinite(value)) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatISTTime(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true }) + ' IST';
}
