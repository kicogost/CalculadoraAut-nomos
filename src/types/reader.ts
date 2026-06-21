import type { PlaceOfSupply } from '../engine';

export type DraftKind = 'income' | 'expense';
export type DraftSource = 'csv' | 'ai';

/**
 * A candidate income/expense row produced by a reader (CSV or AI), shown in the
 * review-and-confirm screen before it becomes a real Invoice or Expense.
 */
export interface DraftEntry {
  id: string;
  include: boolean;
  kind: DraftKind;
  date: string; // ISO (YYYY-MM-DD)
  description: string;
  /** For income: base (pre-IVA). For expense: total incl. IVA. In cents. */
  amountCents: number;

  // Expense fields
  category?: string;
  inputIvaCents?: number;
  deductiblePct?: number;

  // Income fields
  placeOfSupply?: PlaceOfSupply;
  ivaRate?: number;
  retencionRate?: number;

  /** 0..1 extraction confidence (AI source). */
  confidence?: number;
  source: DraftSource;
}
