import { db } from './db';
import type { Expense, Invoice } from '../engine/types';
import { centsToEur, formatEur } from '../engine/money';

export function newId(): string {
  return crypto.randomUUID();
}

// ---------------------------------------------------------------------------
// Backup / restore — the user owns their data.
// ---------------------------------------------------------------------------

export async function exportAll(): Promise<string> {
  const [invoices, expenses, profiles, settings] = await Promise.all([
    db.invoices.toArray(),
    db.expenses.toArray(),
    db.profiles.toArray(),
    db.settings.toArray(),
  ]);
  const backup = {
    app: 'calculadora-autonomos',
    version: 1,
    exportedAt: new Date().toISOString(),
    invoices,
    expenses,
    profiles,
    settings,
  };
  return JSON.stringify(backup, null, 2);
}

export async function importAll(json: string): Promise<void> {
  const data = JSON.parse(json);
  if (data.app !== 'calculadora-autonomos') {
    throw new Error('Este archivo no es una copia de seguridad de la Calculadora Autónomos.');
  }
  await db.transaction('rw', db.invoices, db.expenses, db.profiles, db.settings, async () => {
    await Promise.all([
      db.invoices.clear(),
      db.expenses.clear(),
      db.profiles.clear(),
      db.settings.clear(),
    ]);
    if (data.invoices?.length) await db.invoices.bulkAdd(data.invoices);
    if (data.expenses?.length) await db.expenses.bulkAdd(data.expenses);
    if (data.profiles?.length) await db.profiles.bulkAdd(data.profiles);
    if (data.settings?.length) await db.settings.bulkAdd(data.settings);
  });
}

export async function wipeAll(): Promise<void> {
  await db.transaction('rw', db.invoices, db.expenses, db.profiles, db.settings, async () => {
    await Promise.all([
      db.invoices.clear(),
      db.expenses.clear(),
      db.profiles.clear(),
      db.settings.clear(),
    ]);
  });
}

// ---------------------------------------------------------------------------
// CSV export
// ---------------------------------------------------------------------------

function csvEscape(value: string): string {
  if (/[",\n;]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function toCsv(rows: string[][]): string {
  return rows.map((r) => r.map(csvEscape).join(';')).join('\n');
}

export function invoicesToCsv(invoices: Invoice[]): string {
  const header = ['Fecha', 'Cobro', 'Cliente', 'Base (€)', 'Tipo', 'IVA %', 'Retención %', 'Notas'];
  const rows = invoices.map((i) => [
    i.date,
    i.paidDate ?? '',
    i.clientName,
    centsToEur(i.amountCents).toFixed(2),
    i.placeOfSupply,
    String(i.ivaRate),
    String(i.retencionRate),
    i.notes ?? '',
  ]);
  return toCsv([header, ...rows]);
}

export function expensesToCsv(expenses: Expense[]): string {
  const header = ['Fecha', 'Categoría', 'Importe (€)', 'Deducible %', 'IVA soportado (€)', 'Notas'];
  const rows = expenses.map((e) => [
    e.date,
    e.category,
    centsToEur(e.amountCents).toFixed(2),
    String(e.deductiblePct),
    centsToEur(e.inputIvaCents).toFixed(2),
    e.notes ?? '',
  ]);
  return toCsv([header, ...rows]);
}

/** Trigger a browser download of text content. */
export function downloadText(filename: string, content: string, mime = 'text/plain'): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Format helper re-export for convenience in UI tables. */
export { formatEur };
