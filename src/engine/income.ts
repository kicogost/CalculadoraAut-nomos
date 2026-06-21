import type {
  Expense,
  Invoice,
  RecognitionBasis,
  TaxConfig,
} from './types';
import { pctOfCents, type Cents } from './money';
import { parseYearMonth, quarterOfMonth } from './dates';

/** The recognition date for an invoice under the chosen basis. */
export function recognitionDate(inv: Invoice, basis: RecognitionBasis): string | null {
  if (basis === 'caja') return inv.paidDate ?? null;
  return inv.date;
}

/** Month (1..12) an invoice is recognised in for the given year, or null if not this year. */
export function recognitionMonth(
  inv: Invoice,
  basis: RecognitionBasis,
  year: number,
): number | null {
  const d = recognitionDate(inv, basis);
  if (!d) return null;
  const { year: y, month } = parseYearMonth(d);
  return y === year ? month : null;
}

/** Output (repercutido) IVA for an invoice (cents), per place of supply. */
export function outputIva(inv: Invoice): Cents {
  switch (inv.placeOfSupply) {
    case 'domestic_es':
    case 'domestic_b2c':
    case 'other':
      return pctOfCents(inv.amountCents, inv.ivaRate);
    case 'eu_b2b': // reverse charge — no Spanish output IVA
    case 'non_eu_export': // no sujeto — no output IVA
      return 0;
  }
}

/** Retención withheld on an invoice (cents). */
export function retencion(inv: Invoice): Cents {
  return pctOfCents(inv.amountCents, inv.retencionRate);
}

export interface IncomeTotals {
  /** Base income recognised (cents). */
  baseCents: Cents;
  /** Output IVA charged (cents). */
  outputIvaCents: Cents;
  /** Retención suffered (cents). */
  retencionCents: Cents;
  /** Base income that suffered retención (for the 70% test). */
  baseWithRetencionCents: Cents;
}

const ZERO_TOTALS = (): IncomeTotals => ({
  baseCents: 0,
  outputIvaCents: 0,
  retencionCents: 0,
  baseWithRetencionCents: 0,
});

/** Aggregate invoices recognised up to and including `throughMonth` of `year`. */
export function incomeThroughMonth(
  invoices: Invoice[],
  basis: RecognitionBasis,
  year: number,
  throughMonth: number,
): IncomeTotals {
  const totals = ZERO_TOTALS();
  for (const inv of invoices) {
    const m = recognitionMonth(inv, basis, year);
    if (m === null || m > throughMonth) continue;
    totals.baseCents += inv.amountCents;
    totals.outputIvaCents += outputIva(inv);
    const ret = retencion(inv);
    totals.retencionCents += ret;
    if (inv.retencionRate > 0) totals.baseWithRetencionCents += inv.amountCents;
  }
  return totals;
}

/** Aggregate invoices recognised within a specific quarter. */
export function incomeInQuarter(
  invoices: Invoice[],
  basis: RecognitionBasis,
  year: number,
  quarter: number,
): IncomeTotals {
  const totals = ZERO_TOTALS();
  for (const inv of invoices) {
    const m = recognitionMonth(inv, basis, year);
    if (m === null || quarterOfMonth(m) !== quarter) continue;
    totals.baseCents += inv.amountCents;
    totals.outputIvaCents += outputIva(inv);
    const ret = retencion(inv);
    totals.retencionCents += ret;
    if (inv.retencionRate > 0) totals.baseWithRetencionCents += inv.amountCents;
  }
  return totals;
}

export interface ExpenseTotals {
  /** Total expense amount (cents). */
  totalCents: Cents;
  /** Deductible portion for IRPF (cents). */
  deductibleCents: Cents;
  /** Deductible input IVA (cents). */
  inputIvaCents: Cents;
}

/** Expense month under accrual (expenses always recognised by their date). */
function expenseMonth(exp: Expense, year: number): number | null {
  const { year: y, month } = parseYearMonth(exp.date);
  return y === year ? month : null;
}

export function expensesThroughMonth(
  expenses: Expense[],
  year: number,
  throughMonth: number,
): ExpenseTotals {
  const totals: ExpenseTotals = { totalCents: 0, deductibleCents: 0, inputIvaCents: 0 };
  for (const exp of expenses) {
    const m = expenseMonth(exp, year);
    if (m === null || m > throughMonth) continue;
    totals.totalCents += exp.amountCents;
    // Deductible base = (amount − input IVA) × deductible%.
    const netOfIva = exp.amountCents - exp.inputIvaCents;
    totals.deductibleCents += pctOfCents(netOfIva, exp.deductiblePct);
    totals.inputIvaCents += exp.inputIvaCents;
  }
  return totals;
}

export function expensesInQuarter(
  expenses: Expense[],
  year: number,
  quarter: number,
): ExpenseTotals {
  const totals: ExpenseTotals = { totalCents: 0, deductibleCents: 0, inputIvaCents: 0 };
  for (const exp of expenses) {
    const m = expenseMonth(exp, year);
    if (m === null || quarterOfMonth(m) !== quarter) continue;
    totals.totalCents += exp.amountCents;
    const netOfIva = exp.amountCents - exp.inputIvaCents;
    totals.deductibleCents += pctOfCents(netOfIva, exp.deductiblePct);
    totals.inputIvaCents += exp.inputIvaCents;
  }
  return totals;
}

/**
 * Whether Modelo 130 is required: required if LESS than the exemption threshold
 * (70%) of income by amount suffered retención. Returns the flag plus the ratio.
 */
export function modelo130Required(
  income: IncomeTotals,
  cfg: TaxConfig,
): { required: boolean; retencionRatio: number } {
  if (income.baseCents <= 0) return { required: false, retencionRatio: 0 };
  const ratio = income.baseWithRetencionCents / income.baseCents;
  return { required: ratio < cfg.modelo130.retencionExemptionThreshold, retencionRatio: ratio };
}
