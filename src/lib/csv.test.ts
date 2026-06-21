import { describe, it, expect } from 'vitest';
import { eurToCents } from '../engine';
import { csvToDrafts, parseAmount, parseCsv, parseDateCell } from './csv';

describe('parseAmount', () => {
  it('Spanish format 1.234,56', () => {
    expect(parseAmount('1.234,56')).toBe(1234.56);
  });
  it('English format 1,234.56', () => {
    expect(parseAmount('1,234.56')).toBe(1234.56);
  });
  it('negative with currency symbol', () => {
    expect(parseAmount('-42,30 €')).toBe(-42.3);
  });
  it('plain integer', () => {
    expect(parseAmount('100')).toBe(100);
  });
});

describe('parseDateCell', () => {
  it('parses ISO', () => {
    expect(parseDateCell('2026-03-04')).toBe('2026-03-04');
  });
  it('parses DD/MM/YYYY', () => {
    expect(parseDateCell('04/03/2026')).toBe('2026-03-04');
  });
  it('parses DD-MM-YY', () => {
    expect(parseDateCell('4-3-26')).toBe('2026-03-04');
  });
  it('returns empty for junk', () => {
    expect(parseDateCell('not a date')).toBe('');
  });
});

describe('parseCsv', () => {
  it('detects semicolon delimiter and quoted fields', () => {
    const csv = 'Fecha;Concepto;Importe\n2026-03-04;"Pago, ACME";1.000,00\n2026-03-05;AWS;-42,30';
    const p = parseCsv(csv);
    expect(p.delimiter).toBe(';');
    expect(p.headers).toEqual(['Fecha', 'Concepto', 'Importe']);
    expect(p.rows).toHaveLength(2);
    expect(p.rows[0][1]).toBe('Pago, ACME');
  });
});

describe('csvToDrafts', () => {
  const csv = 'Fecha;Concepto;Importe\n2026-03-04;Cliente X;1.000,00\n2026-03-05;AWS;-42,30';
  const p = parseCsv(csv);

  it('positive → income, negative → expense', () => {
    const drafts = csvToDrafts(p, { dateCol: 0, descCol: 1, amountCol: 2 });
    expect(drafts).toHaveLength(2);
    expect(drafts[0].kind).toBe('income');
    expect(drafts[0].amountCents).toBe(eurToCents(1000));
    expect(drafts[1].kind).toBe('expense');
    expect(drafts[1].amountCents).toBe(eurToCents(42.3));
  });

  it('supports separate debit/credit columns', () => {
    const csv2 = 'Fecha;Concepto;Cargo;Abono\n2026-03-05;AWS;42,30;\n2026-03-04;Cliente;;1000,00';
    const p2 = parseCsv(csv2);
    const drafts = csvToDrafts(p2, { dateCol: 0, descCol: 1, amountCol: 2, debitCol: 2, creditCol: 3 });
    expect(drafts[0].kind).toBe('expense');
    expect(drafts[1].kind).toBe('income');
  });

  it('skips zero/blank amounts', () => {
    const csv3 = 'Fecha;Concepto;Importe\n2026-03-04;Saldo;0,00\n2026-03-05;X;';
    const drafts = csvToDrafts(parseCsv(csv3), { dateCol: 0, descCol: 1, amountCol: 2 });
    expect(drafts).toHaveLength(0);
  });
});
