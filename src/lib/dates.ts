/** The month (1..12) to treat as "now" for a given tax year. */
export function currentMonthForYear(year: number): number {
  const now = new Date();
  if (year < now.getFullYear()) return 12;
  if (year > now.getFullYear()) return 1;
  return now.getMonth() + 1;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatISODate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export const MONTH_LABELS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];
