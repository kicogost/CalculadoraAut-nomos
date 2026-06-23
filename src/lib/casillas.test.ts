import { describe, it, expect } from 'vitest';
import { eurToCents, TAX_CONFIG_2026 } from '../engine';
import type { Expense, Invoice, PlaceOfSupply, YearProfile } from '../engine';
import { modelo130Casillas, modelo303Casillas, modelo349Rows, type Casilla } from './casillas';

const cfg = TAX_CONFIG_2026;
let seq = 0;
const inv = (month: number, amount: number, place: PlaceOfSupply, iva = 0, ret = 0): Invoice => ({
  id: `i${seq++}`,
  date: `2026-${String(month).padStart(2, '0')}-15`,
  clientName: 'C',
  amountCents: eurToCents(amount),
  placeOfSupply: place,
  ivaRate: iva,
  retencionRate: ret,
});
const exp = (month: number, amount: number, inputIva: number): Expense => ({
  id: `e${seq++}`,
  date: `2026-${String(month).padStart(2, '0')}-10`,
  category: 'Otros',
  amountCents: eurToCents(amount),
  deductiblePct: 100,
  inputIvaCents: eurToCents(inputIva),
});

const profile = (over: Partial<YearProfile> = {}): YearProfile => ({
  year: 2026,
  comunidadAutonoma: 'madrid',
  ssStatus: { kind: 'tarifa_plana_y1' },
  recognitionBasis: 'devengo',
  estimacionDirecta: 'simplificada',
  personal: { children: 0, childrenUnder3: 0, over65: false, over75: false, disabilityPct: 0 },
  ...over,
});

const box = (rows: Casilla[], n: number) => rows.find((r) => r.n === n);
const allRows = (groups: { rows: Casilla[] }[]) => groups.flatMap((g) => g.rows);

describe('Modelo 303 casillas', () => {
  it('domestic 21%: base→01, cuota→03, total→27, resultado→46/71', () => {
    // Q1: one 1.000 € invoice at 21% (IVA 210), one expense with 42 € input IVA.
    const invoices = [inv(2, 1000, 'domestic_es', 21, 15)];
    const expenses = [exp(2, 242, 42)];
    const r = modelo303Casillas(invoices, expenses, profile(), cfg, 1);
    const rows = allRows(r.groups);
    expect(box(rows, 1)!.cents).toBe(eurToCents(1000));
    expect(box(rows, 3)!.cents).toBe(eurToCents(210));
    expect(box(rows, 27)!.cents).toBe(eurToCents(210));
    expect(box(rows, 29)!.cents).toBe(eurToCents(42));
    expect(box(rows, 45)!.cents).toBe(eurToCents(42));
    expect(box(rows, 46)!.cents).toBe(eurToCents(168)); // 210 − 42
    expect(box(rows, 71)!.cents).toBe(eurToCents(168));
    expect(r.resultCents).toBe(eurToCents(168));
  });

  it('export user: no output IVA → 27 = 0, base in casilla 120, negative result', () => {
    const invoices = [inv(2, 3000, 'non_eu_export')];
    const expenses = [exp(2, 121, 21)];
    const r = modelo303Casillas(invoices, expenses, profile(), cfg, 1);
    const rows = allRows(r.groups);
    expect(box(rows, 27)!.cents).toBe(0);
    expect(box(rows, 120)!.cents).toBe(eurToCents(3000)); // no sujeta por localización
    expect(r.resultCents).toBe(-eurToCents(21));
    expect(r.notes.join(' ')).toMatch(/localización|60/);
  });

  it('EU B2B: base in casilla 120 and a Modelo 349 note', () => {
    const invoices = [inv(2, 5000, 'eu_b2b')];
    const r = modelo303Casillas(invoices, [], profile(), cfg, 1);
    expect(box(allRows(r.groups), 120)!.cents).toBe(eurToCents(5000));
    expect(r.notes.join(' ')).toMatch(/349/);
  });
});

describe('Modelo 349 rows', () => {
  it('lists EU B2B clients with base and clave S', () => {
    const invoices = [
      inv(2, 5000, 'eu_b2b'), // Q1, ACME
      inv(3, 1500, 'eu_b2b'), // Q1, ACME (grouped)
      inv(5, 2000, 'eu_b2b'), // Q2 → excluded from Q1
      inv(2, 1000, 'domestic_es', 21), // excluded (not UE)
      inv(2, 9000, 'non_eu_export'), // excluded (not UE)
    ];
    invoices[0].clientName = 'ACME GmbH';
    invoices[1].clientName = 'ACME GmbH';
    invoices[2].clientName = 'Otra UE';
    const rows = modelo349Rows(invoices, profile(), 1);
    expect(rows).toHaveLength(1); // only ACME in Q1; "Otra UE" is Q2
    expect(rows[0].clientName).toBe('ACME GmbH');
    expect(rows[0].clave).toBe('S');
    expect(rows[0].baseCents).toBe(eurToCents(6500)); // 5000 + 1500 grouped
  });
});

describe('Modelo 130 casillas', () => {
  it('first quarter maps ingresos/gastos/20%/result', () => {
    // Q1 income 3.000 (export, no retención); expenses incl. auto cuota.
    const invoices = [inv(2, 3000, 'non_eu_export')];
    const r = modelo130Casillas(invoices, [], profile(), cfg, 1);
    const rows = allRows(r.groups);
    expect(box(rows, 1)!.cents).toBe(eurToCents(3000));
    // 02 includes the auto-generated cuota (3 months tarifa plana ≈ 88,64 × 3)
    expect(box(rows, 2)!.cents).toBeGreaterThan(0);
    // 03 = 01 − 02; 04 = 20% of 03
    const c3 = box(rows, 3)!.cents!;
    expect(c3).toBe(box(rows, 1)!.cents! - box(rows, 2)!.cents!);
    expect(box(rows, 4)!.cents).toBe(Math.round(c3 * 0.2));
    // no retención, no prior payments → 07 = 04, result = 04
    expect(box(rows, 7)!.cents).toBe(box(rows, 4)!.cents);
    expect(r.resultCents).toBe(box(rows, 4)!.cents);
  });

  it('domestic with retención reduces the result (130 nets retenciones)', () => {
    const invoices = [inv(2, 4000, 'domestic_es', 21, 15)];
    const r = modelo130Casillas(invoices, [], profile(), cfg, 1);
    const rows = allRows(r.groups);
    expect(box(rows, 6)!.cents).toBe(eurToCents(600)); // 15% of 4.000
  });
});
