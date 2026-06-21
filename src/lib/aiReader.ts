import { eurToCents } from '../engine';
import type { DraftEntry } from '../types/reader';

interface ExtractedFields {
  kind: 'income' | 'expense';
  date: string;
  counterparty: string;
  description: string;
  baseAmount: number | null;
  ivaRate: number | null;
  ivaAmount: number | null;
  totalAmount: number | null;
  retencionRate: number | null;
  currency: string;
  confidence: number;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.readAsDataURL(file);
  });
}

let seq = 0;

function fieldsToDraft(f: ExtractedFields, filename: string): DraftEntry {
  const label = [f.counterparty, f.description].filter(Boolean).join(' · ') || filename;
  const base: DraftEntry = {
    id: `ai-${Date.now()}-${seq++}`,
    include: true,
    kind: f.kind === 'income' ? 'income' : 'expense',
    date: f.date || '',
    description: label,
    amountCents: 0,
    confidence: f.confidence,
    source: 'ai',
  };

  if (base.kind === 'income') {
    base.amountCents = eurToCents(f.baseAmount ?? f.totalAmount ?? 0);
    base.placeOfSupply = 'domestic_es';
    base.ivaRate = f.ivaRate ?? 21;
    base.retencionRate = f.retencionRate ?? 0;
  } else {
    base.amountCents = eurToCents(f.totalAmount ?? f.baseAmount ?? 0);
    base.inputIvaCents = eurToCents(f.ivaAmount ?? 0);
    base.deductiblePct = 100;
    base.category = 'Otros';
  }
  return base;
}

/** Send one PDF to the AI extractor and return a draft entry. */
export async function extractFromFile(file: File): Promise<DraftEntry> {
  if (file.type !== 'application/pdf') {
    throw new Error(`"${file.name}" no es un PDF. Solo se admiten archivos PDF.`);
  }
  const fileBase64 = await fileToBase64(file);
  const res = await fetch('/api/extract', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ fileBase64, mediaType: file.type }),
  });
  if (!res.ok) {
    let msg = 'Error al extraer los datos.';
    try {
      msg = (await res.json()).error ?? msg;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }
  const { fields } = await res.json();
  return fieldsToDraft(fields as ExtractedFields, file.name);
}
