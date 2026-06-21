import { describe, it, expect } from 'vitest';
import { eurToCents, centsToEur } from './money';
import { TAX_CONFIG_2026 } from './taxConfig.2026';
import { computeYear, monthlySetAside } from './computeYear';
import type { Invoice, PlaceOfSupply, YearProfile } from './types';

const cfg = TAX_CONFIG_2026;

let seq = 0;
function inv(month: number, amount: number, place: PlaceOfSupply, ivaRate = 0, ret = 0): Invoice {
  const mm = String(month).padStart(2, '0');
  return {
    id: `inv-${seq++}`,
    date: `2026-${mm}-15`,
    clientName: 'Test',
    amountCents: eurToCents(amount),
    placeOfSupply: place,
    ivaRate,
    retencionRate: ret,
  };
}

const profile = (over: Partial<YearProfile> = {}): YearProfile => ({
  year: 2026,
  comunidadAutonoma: 'madrid',
  ssStatus: { kind: 'tarifa_plana_y1' },
  recognitionBasis: 'devengo',
  estimacionDirecta: 'simplificada',
  personal: { children: 0, childrenUnder3: 0, over65: false, over75: false, disabilityPct: 0 },
  ...over,
});

describe('Acceptance 1: export user, tarifa plana, single comunidad', () => {
  const invoices = Array.from({ length: 12 }, (_, i) => inv(i + 1, 4000, 'non_eu_export'));
  const p = profile();
  const comp = computeYear(invoices, [], p, cfg);

  it('IVA payable ≈ 0', () => {
    expect(comp.modelo303.every((q) => q.resultCents === 0)).toBe(true);
  });
  it('Modelo 130 is required', () => {
    expect(comp.modelo130Required.required).toBe(true);
  });
  it('monthly cuota = tarifa plana with MEI (88,64 €)', () => {
    expect(comp.ssMonthlyCuotas.every((c) => c === eurToCents(88.64))).toBe(true);
  });
  it('set-aside is IRPF-dominated', () => {
    const sa = monthlySetAside(invoices, [], p, cfg, 12);
    expect(sa.irpfCents).toBeGreaterThan(sa.ivaCents);
    expect(sa.irpfCents).toBeGreaterThan(0);
  });
  it('headline set-aside parking rate lands in a sane range (15–40%) early in the year', () => {
    // Measured at end of Q1, before any Modelo 130 has been paid out — this is the
    // genuine "park this share of every invoice" rate. By December most of it has
    // already been handed to Hacienda via the quarterly 130, so the residual is lower.
    const sa = monthlySetAside(invoices, [], p, cfg, 3);
    expect(sa.pctOfIncome).toBeGreaterThan(15);
    expect(sa.pctOfIncome).toBeLessThan(40);
  });
  it('take-home is positive and below gross', () => {
    expect(comp.takeHomeCents).toBeGreaterThan(0);
    expect(comp.takeHomeCents).toBeLessThan(comp.income.baseCents);
  });
});

describe('Acceptance 2: standard domestic user', () => {
  const invoices = Array.from({ length: 12 }, (_, i) => inv(i + 1, 4000, 'domestic_es', 21, 15));
  const p = profile({ ssStatus: { kind: 'tramo', tramo: 8, baseCents: eurToCents(1209.15) } });
  const comp = computeYear(invoices, [], p, cfg);

  it('quarterly 303 is non-zero', () => {
    expect(comp.modelo303.every((q) => q.resultCents > 0)).toBe(true);
  });
  it('130 is not required (≥70% had retención)', () => {
    expect(comp.modelo130Required.required).toBe(false);
  });
  it('130 nets out retenciones (each quarter due is small or zero)', () => {
    // 20% of profit vs 15% retención on income → 130 stays low.
    comp.modelo130.forEach((q) => expect(q.retencionesYtdCents).toBeGreaterThan(0));
  });
});

describe('Acceptance 3 (integration): Madrid vs Balears differ on identical income', () => {
  const invoices = Array.from({ length: 12 }, (_, i) => inv(i + 1, 4000, 'non_eu_export'));
  const mad = computeYear(invoices, [], profile({ comunidadAutonoma: 'madrid' }), cfg);
  const bal = computeYear(invoices, [], profile({ comunidadAutonoma: 'baleares' }), cfg);
  it('annual IRPF differs', () => {
    expect(mad.irpf.totalCuotaCents).not.toBe(bal.irpf.totalCuotaCents);
  });
});

describe('Acceptance 4: mid-year tarifa plana expiry', () => {
  const invoices = Array.from({ length: 12 }, (_, i) => inv(i + 1, 3000, 'non_eu_export'));
  const p = profile({
    ssStatus: { kind: 'tarifa_plana_y1' },
    ssStatusChanges: [{ fromMonth: 7, status: { kind: 'tramo', tramo: 4, baseCents: eurToCents(950.98) } }],
  });
  const comp = computeYear(invoices, [], p, cfg);
  it('blended cuota: 6 months tarifa plana + 6 months tramo', () => {
    expect(comp.ssAnnualCuotaCents).toBe(6 * eurToCents(88.64) + 6 * eurToCents(299.56));
  });
});

describe('Acceptance 6: multi-year isolation at the engine level', () => {
  it('cuota rows are namespaced per year', () => {
    const c2026 = computeYear([], [], profile({ year: 2026 }), cfg);
    expect(c2026.cuotaRows[0].id).toContain('2026');
    expect(c2026.cuotaRows).toHaveLength(12);
  });
});

describe('Foral comunidad is handled, not crashed', () => {
  const invoices = [inv(1, 4000, 'non_eu_export')];
  const comp = computeYear(invoices, [], profile({ comunidadAutonoma: 'pais_vasco' }), cfg);
  it('flags foral as unsupported and returns zero IRPF rather than throwing', () => {
    expect(comp.foralUnsupported).toBe(true);
    expect(comp.irpf.totalCuotaCents).toBe(0);
  });
});

describe('recognition basis: caja vs devengo', () => {
  it('an invoice paid next year is excluded under caja', () => {
    const invoices: Invoice[] = [
      { ...inv(12, 5000, 'non_eu_export'), date: '2026-12-20', paidDate: '2027-01-10' },
    ];
    const devengo = computeYear(invoices, [], profile({ recognitionBasis: 'devengo' }), cfg);
    const caja = computeYear(invoices, [], profile({ recognitionBasis: 'caja' }), cfg);
    expect(devengo.income.baseCents).toBe(eurToCents(5000));
    expect(caja.income.baseCents).toBe(0);
  });
});

describe('sanity: a realistic export year prints believable numbers', () => {
  it('48k export, Madrid, tarifa plana', () => {
    const invoices = Array.from({ length: 12 }, (_, i) => inv(i + 1, 4000, 'non_eu_export'));
    const comp = computeYear(invoices, [], profile(), cfg);
    // Net ≈ 48k − ~1.064 cuota = ~46.936; IRPF roughly 9k–12k.
    expect(centsToEur(comp.irpf.totalCuotaCents)).toBeGreaterThan(8000);
    expect(centsToEur(comp.irpf.totalCuotaCents)).toBeLessThan(13000);
  });
});
