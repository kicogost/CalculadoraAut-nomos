/**
 * Money helpers. All monetary values in the engine are integer **cents** (EUR).
 * Never use floats for money. Convert to euros only for display.
 */

export type Cents = number;

/** Round a fractional cents value to the nearest whole cent (half away from zero). */
export function roundCents(value: number): Cents {
  return value < 0 ? -Math.round(-value) : Math.round(value);
}

/** Euros (possibly fractional) → integer cents. */
export function eurToCents(eur: number): Cents {
  return roundCents(eur * 100);
}

/** Integer cents → euros as a number (for calculations/tests, not display). */
export function centsToEur(cents: Cents): number {
  return cents / 100;
}

/**
 * Apply a percentage rate (e.g. 21 for 21%, 9.5 for 9.5%) to a cents amount,
 * returning rounded cents.
 */
export function pctOfCents(cents: Cents, ratePct: number): Cents {
  return roundCents((cents * ratePct) / 100);
}

/** Sum a list of cents values. */
export function sumCents(values: Cents[]): Cents {
  return values.reduce((acc, v) => acc + v, 0);
}

/** Clamp a value to a minimum of zero (liabilities never go negative for set-aside). */
export function floorZero(cents: Cents): Cents {
  return cents < 0 ? 0 : cents;
}

/** Format cents as a Spanish euro string, e.g. 123456 → "1.234,56 €". */
export function formatEur(cents: Cents, opts: { decimals?: boolean } = {}): string {
  const decimals = opts.decimals ?? true;
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  }).format(cents / 100);
}

/** Format a percentage for display, e.g. 31.5 → "31,5 %". */
export function formatPct(ratePct: number, fractionDigits = 1): string {
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  }).format(ratePct) + ' %';
}
