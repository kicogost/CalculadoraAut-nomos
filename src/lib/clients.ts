import type { Invoice, RecognitionBasis } from '../engine';
import { recognitionMonth, retencion } from '../engine';

export interface ClientStat {
  name: string;
  invoiceCount: number;
  /** Base income (pre-IVA) recognised this year, cents. */
  baseCents: number;
  /** Retención withheld this year, cents. */
  retencionCents: number;
  /** Share of total year income, 0..1. */
  share: number;
  /** Most recent invoice date (ISO) for this client this year. */
  lastDate: string;
  /** Hours dedicated this year (user-entered, optional). */
  hours?: number;
  /** Effective hourly rate (base / hours), cents — only when hours > 0. */
  effectiveHourlyCents?: number;
}

/**
 * Aggregate invoices by client for the active year. `hoursByClient` is an
 * optional user-maintained map of client name → hours, used to compute the real
 * effective hourly rate ("¿cuánto gano de verdad por este cliente?").
 */
export function clientStats(
  invoices: Invoice[],
  basis: RecognitionBasis,
  year: number,
  hoursByClient: Record<string, number> = {},
): { clients: ClientStat[]; totalBaseCents: number; concentrationPct: number } {
  const byName = new Map<string, ClientStat>();
  let totalBaseCents = 0;

  for (const inv of invoices) {
    if (recognitionMonth(inv, basis, year) === null) continue;
    const name = inv.clientName.trim() || 'Sin nombre';
    totalBaseCents += inv.amountCents;
    const cur =
      byName.get(name) ??
      ({ name, invoiceCount: 0, baseCents: 0, retencionCents: 0, share: 0, lastDate: '' } as ClientStat);
    cur.invoiceCount += 1;
    cur.baseCents += inv.amountCents;
    cur.retencionCents += retencion(inv);
    if (inv.date > cur.lastDate) cur.lastDate = inv.date;
    byName.set(name, cur);
  }

  const clients = [...byName.values()].map((c) => {
    const hours = hoursByClient[c.name];
    return {
      ...c,
      share: totalBaseCents > 0 ? c.baseCents / totalBaseCents : 0,
      hours,
      effectiveHourlyCents: hours && hours > 0 ? Math.round(c.baseCents / hours) : undefined,
    };
  });
  clients.sort((a, b) => b.baseCents - a.baseCents);

  // Concentration = share of the single largest client (falso-autónomo / 130 signal).
  const concentrationPct = clients.length ? clients[0].share * 100 : 0;
  return { clients, totalBaseCents, concentrationPct };
}
