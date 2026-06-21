import { describe, it, expect } from 'vitest';
import { eurToCents } from '../engine';
import type { Invoice } from '../engine';
import { clientStats } from './clients';

let seq = 0;
function inv(client: string, month: number, amount: number, ret = 0): Invoice {
  const mm = String(month).padStart(2, '0');
  return {
    id: `i${seq++}`,
    date: `2026-${mm}-10`,
    clientName: client,
    amountCents: eurToCents(amount),
    placeOfSupply: 'domestic_es',
    ivaRate: 21,
    retencionRate: ret,
  };
}

describe('clientStats', () => {
  const invoices = [
    inv('ACME', 1, 6000),
    inv('ACME', 2, 2000),
    inv('Bob SL', 3, 2000, 15),
  ];

  it('groups by client and computes totals + share', () => {
    const { clients, totalBaseCents, concentrationPct } = clientStats(invoices, 'devengo', 2026);
    expect(totalBaseCents).toBe(eurToCents(10000));
    expect(clients).toHaveLength(2);
    const acme = clients.find((c) => c.name === 'ACME')!;
    expect(acme.baseCents).toBe(eurToCents(8000));
    expect(acme.invoiceCount).toBe(2);
    expect(Math.round(acme.share * 100)).toBe(80);
    expect(acme.lastDate).toBe('2026-02-10');
    expect(Math.round(concentrationPct)).toBe(80);
  });

  it('sorts clients by amount descending', () => {
    const { clients } = clientStats(invoices, 'devengo', 2026);
    expect(clients[0].name).toBe('ACME');
  });

  it('computes effective hourly rate from hours', () => {
    const { clients } = clientStats(invoices, 'devengo', 2026, { ACME: 100 });
    const acme = clients.find((c) => c.name === 'ACME')!;
    // 8.000 € / 100 h = 80 €/h
    expect(acme.effectiveHourlyCents).toBe(eurToCents(80));
    const bob = clients.find((c) => c.name === 'Bob SL')!;
    expect(bob.effectiveHourlyCents).toBeUndefined();
  });

  it('excludes invoices from other years', () => {
    const other = [...invoices, { ...inv('ACME', 1, 5000), date: '2025-01-10' }];
    const { totalBaseCents } = clientStats(other, 'devengo', 2026);
    expect(totalBaseCents).toBe(eurToCents(10000));
  });
});
