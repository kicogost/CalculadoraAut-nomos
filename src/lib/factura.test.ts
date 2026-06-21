import { describe, it, expect } from 'vitest';
import { eurToCents } from '../engine';
import {
  facturaRef,
  facturaTotals,
  legalMention,
  lineAmountCents,
  nextFacturaNumber,
} from './factura';
import type { Factura } from '../types/factura';

const baseFactura = (over: Partial<Factura> = {}): Factura => ({
  id: '1',
  docType: 'proforma',
  series: 'F',
  number: 1,
  year: 2026,
  issueDate: '2026-06-21',
  clientName: 'ACME Inc',
  clientNif: '',
  clientAddress: '',
  clientPostalCode: '',
  clientCity: '',
  clientCountry: 'Estados Unidos',
  placeOfSupply: 'non_eu_export',
  lineItems: [
    { id: 'a', concept: 'Servicio', quantity: 10, unitPriceCents: eurToCents(100) },
  ],
  ivaRate: 0,
  retencionRate: 0,
  paymentTerms: '',
  notes: '',
  currency: 'EUR',
  ...over,
});

describe('line amounts and totals', () => {
  it('line amount = quantity × unit price', () => {
    expect(lineAmountCents({ id: 'x', concept: '', quantity: 10, unitPriceCents: eurToCents(100) })).toBe(eurToCents(1000));
    expect(lineAmountCents({ id: 'x', concept: '', quantity: 2.5, unitPriceCents: eurToCents(40) })).toBe(eurToCents(100));
  });

  it('export factura: base only, no IVA, no retención', () => {
    const t = facturaTotals(baseFactura());
    expect(t.baseCents).toBe(eurToCents(1000));
    expect(t.ivaCents).toBe(0);
    expect(t.retencionCents).toBe(0);
    expect(t.totalCents).toBe(eurToCents(1000));
  });

  it('domestic factura: 21% IVA added, 15% retención subtracted', () => {
    const t = facturaTotals(
      baseFactura({ placeOfSupply: 'domestic_es', ivaRate: 21, retencionRate: 15 }),
    );
    // base 1000 → IVA 210, ret 150 → total 1060
    expect(t.baseCents).toBe(eurToCents(1000));
    expect(t.ivaCents).toBe(eurToCents(210));
    expect(t.retencionCents).toBe(eurToCents(150));
    expect(t.totalCents).toBe(eurToCents(1060));
  });

  it('sums multiple line items', () => {
    const t = facturaTotals(
      baseFactura({
        lineItems: [
          { id: 'a', concept: 'A', quantity: 1, unitPriceCents: eurToCents(500) },
          { id: 'b', concept: 'B', quantity: 3, unitPriceCents: eurToCents(200) },
        ],
      }),
    );
    expect(t.baseCents).toBe(eurToCents(1100));
  });
});

describe('reference and numbering', () => {
  it('formats the reference as SERIES-0000-YEAR', () => {
    expect(facturaRef({ series: 'F', number: 1, year: 2026 })).toBe('F-0001-2026');
    expect(facturaRef({ series: 'EXP', number: 42, year: 2026 })).toBe('EXP-0042-2026');
  });

  it('next number is per series and year', () => {
    const list = [
      baseFactura({ id: '1', series: 'F', number: 1, year: 2026 }),
      baseFactura({ id: '2', series: 'F', number: 2, year: 2026 }),
      baseFactura({ id: '3', series: 'F', number: 1, year: 2025 }),
      baseFactura({ id: '4', series: 'P', number: 9, year: 2026 }),
    ];
    expect(nextFacturaNumber(list, 'F', 2026)).toBe(3);
    expect(nextFacturaNumber(list, 'F', 2025)).toBe(2);
    expect(nextFacturaNumber(list, 'P', 2026)).toBe(10);
    expect(nextFacturaNumber(list, 'NEW', 2026)).toBe(1);
  });
});

describe('legal mentions', () => {
  it('non-EU export → art. 69.Uno.1º', () => {
    expect(legalMention('non_eu_export')).toContain('69.Uno.1');
  });
  it('EU B2B → inversión del sujeto pasivo', () => {
    expect(legalMention('eu_b2b')).toContain('Inversión del sujeto pasivo');
  });
  it('domestic → no special mention', () => {
    expect(legalMention('domestic_es')).toBe('');
  });
});
