/** Quarter (1..4) for a 1..12 month. */
export function quarterOfMonth(month: number): number {
  return Math.floor((month - 1) / 3) + 1;
}

/** The three months (1..12) belonging to a quarter (1..4). */
export function monthsInQuarter(quarter: number): number[] {
  const start = (quarter - 1) * 3 + 1;
  return [start, start + 1, start + 2];
}

/** Parse an ISO date string to { year, month (1..12) }. */
export function parseYearMonth(iso: string): { year: number; month: number } {
  const [y, m] = iso.split('-');
  return { year: Number(y), month: Number(m) };
}

export const QUARTER_LABELS = ['1T', '2T', '3T', '4T'] as const;
