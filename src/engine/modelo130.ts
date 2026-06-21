import type { Expense, Invoice, RecognitionBasis, TaxConfig } from './types';
import { floorZero, pctOfCents, type Cents } from './money';
import { monthsInQuarter } from './dates';
import { expensesThroughMonth, incomeThroughMonth } from './income';

export interface Modelo130Quarter {
  quarter: number;
  /** Accumulated net profit Jan→quarter end (cents). */
  accumulatedNetCents: Cents;
  /** 20% of accumulated net (cents). */
  grossPaymentCents: Cents;
  /** Retenciones suffered YTD (cents). */
  retencionesYtdCents: Cents;
  /** Prior 130 payments this year (cents). */
  priorPaymentsCents: Cents;
  /** Amount due this quarter (cents), floored at zero. */
  dueCents: Cents;
}

/**
 * Modelo 130 across the year, cumulative. For each quarter:
 *   due = max(0, 20% × accumulated net − prior 130 payments − retenciones YTD)
 * Net profit = accumulated income base − accumulated deductible expenses (the
 * monthly cuota, auto-generated as an expense, is included). Gastos de difícil
 * justificación are NOT applied here (they belong to the annual Renta).
 */
export function modelo130Year(
  invoices: Invoice[],
  expenses: Expense[],
  basis: RecognitionBasis,
  year: number,
  cfg: TaxConfig,
): Modelo130Quarter[] {
  const out: Modelo130Quarter[] = [];
  let priorPayments = 0;
  for (let quarter = 1; quarter <= 4; quarter++) {
    const throughMonth = monthsInQuarter(quarter)[2];
    const income = incomeThroughMonth(invoices, basis, year, throughMonth);
    const exp = expensesThroughMonth(expenses, year, throughMonth);
    const accumulatedNet = income.baseCents - exp.deductibleCents;
    const gross = floorZero(pctOfCents(floorZero(accumulatedNet), cfg.modelo130.ratePct));
    const due = floorZero(gross - priorPayments - income.retencionCents);
    out.push({
      quarter,
      accumulatedNetCents: accumulatedNet,
      grossPaymentCents: gross,
      retencionesYtdCents: income.retencionCents,
      priorPaymentsCents: priorPayments,
      dueCents: due,
    });
    priorPayments += due;
  }
  return out;
}
