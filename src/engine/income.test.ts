import { describe, it, expect } from 'vitest';
import { eurToCents } from './money';
import { TAX_CONFIG_2026 } from './taxConfig.2026';
import { modelo130Required, outputIva, retencion, type IncomeTotals } from './income';
import { modelo303Year } from './modelo303';
import { modelo130Year } from './modelo130';
import type { Invoice, PlaceOfSupply } from './types';

const cfg = TAX_CONFIG_2026;

let seq = 0;
function inv(
  month: number,
  amount: number,
  place: PlaceOfSupply,
  ivaRate = 0,
  retencionRate = 0,
): Invoice {
  const mm = String(month).padStart(2, '0');
  return {
    id: `inv-${seq++}`,
    date: `2026-${mm}-15`,
    clientName: 'Test',
    amountCents: eurToCents(amount),
    placeOfSupply: place,
    ivaRate,
    retencionRate,
  };
}

describe('outputIva by place of supply', () => {
  it('domestic charges output IVA', () => {
    expect(outputIva(inv(1, 1000, 'domestic_es', 21))).toBe(eurToCents(210));
  });
  it('non-EU export is no sujeto → 0', () => {
    expect(outputIva(inv(1, 1000, 'non_eu_export', 21))).toBe(0);
  });
  it('EU B2B is reverse charge → 0', () => {
    expect(outputIva(inv(1, 1000, 'eu_b2b', 21))).toBe(0);
  });
  it('retención is withheld at its rate', () => {
    expect(retencion(inv(1, 1000, 'domestic_es', 21, 15))).toBe(eurToCents(150));
  });
});

describe('Modelo 130 70% exemption flag', () => {
  const required = (income: Partial<IncomeTotals>) =>
    modelo130Required(
      { baseCents: 0, outputIvaCents: 0, retencionCents: 0, baseWithRetencionCents: 0, ...income },
      cfg,
    ).required;

  it('all income with retención → not required', () => {
    expect(required({ baseCents: eurToCents(10000), baseWithRetencionCents: eurToCents(10000) })).toBe(false);
  });
  it('no retención (export) → required', () => {
    expect(required({ baseCents: eurToCents(10000), baseWithRetencionCents: 0 })).toBe(true);
  });
  it('50% with retención (< 70%) → required', () => {
    expect(required({ baseCents: eurToCents(10000), baseWithRetencionCents: eurToCents(5000) })).toBe(true);
  });
});

describe('Modelo 303 quarterly (hand-worked)', () => {
  it('domestic: Q1 output IVA = 10.000 × 21% = 2.100 €', () => {
    const invoices = [inv(2, 10000, 'domestic_es', 21, 15)];
    const r = modelo303Year(invoices, [], 'devengo', 2026, cfg);
    expect(r[0].outputIvaCents).toBe(eurToCents(2100));
    expect(r[0].resultCents).toBe(eurToCents(2100));
  });

  it('pure export: every quarter result ≈ 0', () => {
    const invoices = [1, 4, 7, 10].map((m) => inv(m, 4000, 'non_eu_export'));
    const r = modelo303Year(invoices, [], 'devengo', 2026, cfg);
    expect(r.every((q) => q.resultCents === 0)).toBe(true);
  });
});

describe('Modelo 130 cumulative (hand-worked)', () => {
  it('domestic 10.000 €/quarter with 15% retención → 500 € each quarter', () => {
    // Q1: 20%*10000 − 0 − 1500 = 500; each subsequent quarter nets to 500 too.
    const invoices = [1, 4, 7, 10].map((m) => inv(m, 10000, 'domestic_es', 21, 15));
    const r = modelo130Year(invoices, [], 'devengo', 2026, cfg);
    expect(r.map((q) => q.dueCents)).toEqual([
      eurToCents(500),
      eurToCents(500),
      eurToCents(500),
      eurToCents(500),
    ]);
  });

  it('export 4.000 €/month, no retención → 2.400 € each quarter', () => {
    // 20% of 12.000 accumulated per quarter, minus prior payments, no retención.
    const invoices = Array.from({ length: 12 }, (_, i) => inv(i + 1, 4000, 'non_eu_export'));
    const r = modelo130Year(invoices, [], 'devengo', 2026, cfg);
    expect(r.map((q) => q.dueCents)).toEqual([
      eurToCents(2400),
      eurToCents(2400),
      eurToCents(2400),
      eurToCents(2400),
    ]);
  });

  it('never goes negative (floors at zero, carries forward)', () => {
    // Heavy retención early → a quarter could otherwise be negative.
    const invoices = [inv(2, 10000, 'domestic_es', 21, 15)];
    const r = modelo130Year(invoices, [], 'devengo', 2026, cfg);
    expect(r.every((q) => q.dueCents >= 0)).toBe(true);
  });
});
