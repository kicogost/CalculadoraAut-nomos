import type { Bracket } from './types';
import { eurToCents, roundCents, type Cents } from './money';

/**
 * Apply a progressive bracket scale to a taxable base (in cents), returning the
 * tax due in cents. Bracket bounds (`upTo`) are in EUR; null = ∞.
 */
export function applyScale(baseCents: Cents, brackets: Bracket[]): Cents {
  if (baseCents <= 0) return 0;
  let tax = 0;
  let lowerCents = 0;
  for (const b of brackets) {
    const upperCents = b.upTo === null ? Infinity : eurToCents(b.upTo);
    const slice = Math.min(baseCents, upperCents) - lowerCents;
    if (slice > 0) tax += (slice * b.rate) / 100;
    lowerCents = upperCents;
    if (baseCents <= upperCents) break;
  }
  return roundCents(tax);
}

/** The marginal rate (percentage) that applies to the next euro above `baseCents`. */
export function marginalRate(baseCents: Cents, brackets: Bracket[]): number {
  for (const b of brackets) {
    const upperCents = b.upTo === null ? Infinity : eurToCents(b.upTo);
    if (baseCents < upperCents) return b.rate;
  }
  // Above all finite bounds → top bracket.
  return brackets.length ? brackets[brackets.length - 1].rate : 0;
}
