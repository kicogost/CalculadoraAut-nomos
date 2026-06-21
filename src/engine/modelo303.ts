import type { Expense, Invoice, RecognitionBasis, TaxConfig } from './types';
import type { Cents } from './money';
import { expensesInQuarter, incomeInQuarter } from './income';

export interface Modelo303Quarter {
  quarter: number;
  outputIvaCents: Cents;
  deductibleIvaCents: Cents;
  /** output − deductible. Positive = pay; negative = to compensate/refund. */
  resultCents: Cents;
}

/**
 * Modelo 303 per quarter: IVA repercutido (output) − IVA soportado deducible (input).
 * A negative result is carried forward / refunded; we surface the raw figure.
 */
export function modelo303Quarter(
  invoices: Invoice[],
  expenses: Expense[],
  basis: RecognitionBasis,
  year: number,
  quarter: number,
  _cfg: TaxConfig,
): Modelo303Quarter {
  const income = incomeInQuarter(invoices, basis, year, quarter);
  const exp = expensesInQuarter(expenses, year, quarter);
  const output = income.outputIvaCents;
  const deductible = exp.inputIvaCents;
  return {
    quarter,
    outputIvaCents: output,
    deductibleIvaCents: deductible,
    resultCents: output - deductible,
  };
}

export function modelo303Year(
  invoices: Invoice[],
  expenses: Expense[],
  basis: RecognitionBasis,
  year: number,
  cfg: TaxConfig,
): Modelo303Quarter[] {
  return [1, 2, 3, 4].map((q) =>
    modelo303Quarter(invoices, expenses, basis, year, q, cfg),
  );
}
