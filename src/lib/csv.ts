import { eurToCents } from '../engine';
import type { DraftEntry } from '../types/reader';

export interface ParsedCsv {
  headers: string[];
  rows: string[][];
  delimiter: string;
}

/** Detect the delimiter by counting candidates in the first non-empty line. */
function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/).find((l) => l.trim().length > 0) ?? '';
  const candidates = [';', ',', '\t', '|'];
  let best = ';';
  let bestCount = -1;
  for (const d of candidates) {
    const count = firstLine.split(d).length;
    if (count > bestCount) {
      bestCount = count;
      best = d;
    }
  }
  return best;
}

/** Minimal CSV parser handling quoted fields and the detected delimiter. */
export function parseCsv(text: string): ParsedCsv {
  const delimiter = detectDelimiter(text);
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === delimiter) {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      if (row.some((f) => f.trim() !== '')) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== '' || row.length) {
    row.push(field);
    if (row.some((f) => f.trim() !== '')) rows.push(row);
  }

  const headers = rows.length ? rows[0].map((h) => h.trim()) : [];
  return { headers, rows: rows.slice(1), delimiter };
}

/** Parse a Spanish/English number string ("1.234,56" or "1,234.56" or "-12.30"). */
export function parseAmount(raw: string): number {
  const s = raw.trim().replace(/[^\d.,-]/g, '');
  if (!s) return NaN;
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  let normalized: string;
  if (lastComma > lastDot) {
    // Comma is the decimal separator → dots are thousands.
    normalized = s.replace(/\./g, '').replace(',', '.');
  } else {
    // Dot is the decimal separator → commas are thousands.
    normalized = s.replace(/,/g, '');
  }
  return Number(normalized);
}

/** Try to normalise a date cell to ISO (YYYY-MM-DD). Returns '' if unparseable. */
export function parseDateCell(raw: string): string {
  const s = raw.trim();
  // Already ISO-ish
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  // DD/MM/YYYY or DD-MM-YYYY (Spanish convention)
  const dmy = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
  if (dmy) {
    let [, d, m, y] = dmy;
    if (y.length === 2) y = `20${y}`;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return '';
}

export interface ColumnMapping {
  dateCol: number;
  descCol: number;
  amountCol: number;
  /** Optional separate columns for debit/credit instead of a single signed amount. */
  debitCol?: number;
  creditCol?: number;
}

let seq = 0;
function nextId(): string {
  return `csv-${Date.now()}-${seq++}`;
}

/**
 * Turn parsed CSV rows into draft entries using a column mapping. A positive
 * amount → income (base), negative → expense (total). Debit/credit columns are
 * supported as an alternative to a single signed amount column.
 */
export function csvToDrafts(parsed: ParsedCsv, map: ColumnMapping): DraftEntry[] {
  const drafts: DraftEntry[] = [];
  for (const cols of parsed.rows) {
    const date = parseDateCell(cols[map.dateCol] ?? '');
    const description = (cols[map.descCol] ?? '').trim();

    let amount: number;
    if (map.debitCol != null && map.creditCol != null) {
      const debit = parseAmount(cols[map.debitCol] ?? '') || 0;
      const credit = parseAmount(cols[map.creditCol] ?? '') || 0;
      amount = credit - debit; // credit positive (income), debit negative (expense)
    } else {
      amount = parseAmount(cols[map.amountCol] ?? '');
    }
    if (!Number.isFinite(amount) || amount === 0) continue;

    const isIncome = amount > 0;
    const cents = eurToCents(Math.abs(amount));
    drafts.push({
      id: nextId(),
      include: true,
      kind: isIncome ? 'income' : 'expense',
      date: date || '',
      description: description || (isIncome ? 'Ingreso' : 'Gasto'),
      amountCents: cents,
      source: 'csv',
      ...(isIncome
        ? { placeOfSupply: 'domestic_es', ivaRate: 0, retencionRate: 0 }
        : { category: 'Otros', inputIvaCents: 0, deductiblePct: 100 }),
    });
  }
  return drafts;
}
