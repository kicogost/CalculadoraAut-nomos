import { pctOfCents, roundCents, type Cents, type PlaceOfSupply } from '../engine';
import type { Factura as FacturaType, FacturaDocType, FacturaLineItem } from '../types/factura';

export interface FacturaTotals {
  baseCents: Cents;
  ivaCents: Cents;
  retencionCents: Cents;
  totalCents: Cents;
}

/** Line amount = quantity × unit price, rounded to cents. */
export function lineAmountCents(line: FacturaLineItem): Cents {
  return roundCents(line.quantity * line.unitPriceCents);
}

export function facturaTotals(f: Pick<FacturaType, 'lineItems' | 'ivaRate' | 'retencionRate'>): FacturaTotals {
  const baseCents = f.lineItems.reduce((sum, l) => sum + lineAmountCents(l), 0);
  const ivaCents = pctOfCents(baseCents, f.ivaRate);
  const retencionCents = pctOfCents(baseCents, f.retencionRate);
  return {
    baseCents,
    ivaCents,
    retencionCents,
    totalCents: baseCents + ivaCents - retencionCents,
  };
}

/** Human invoice reference, e.g. "F-0001-2026". */
export function facturaRef(f: Pick<FacturaType, 'series' | 'number' | 'year'>): string {
  return `${f.series}-${String(f.number).padStart(4, '0')}-${f.year}`;
}

/** Next correlative number for a given series + year. */
export function nextFacturaNumber(facturas: FacturaType[], series: string, year: number): number {
  const max = facturas
    .filter((f) => f.series === series && f.year === year)
    .reduce((m, f) => Math.max(m, f.number), 0);
  return max + 1;
}

/** The legal IVA mention required for the place of supply (empty if none). */
export function legalMention(place: PlaceOfSupply): string {
  switch (place) {
    case 'non_eu_export':
      return 'Operación no sujeta al IVA conforme al art. 69.Uno.1.º de la Ley 37/1992.';
    case 'eu_b2b':
      return 'Inversión del sujeto pasivo (art. 84.Uno.2.º LIVA). Operación intracomunitaria exenta.';
    case 'domestic_es':
    case 'domestic_b2c':
    case 'other':
      return '';
  }
}

export const DOC_TYPE_LABELS: Record<FacturaDocType, string> = {
  factura: 'Factura',
  proforma: 'Factura proforma',
  presupuesto: 'Presupuesto',
};

/**
 * Standard non-fiscal notice. Verifactu obligations apply from 2027 (autónomos:
 * 1 jul 2027); until then plain PDFs are allowed, but this tool never issues a
 * fiscal invoice (no huella, no QR tributario, no envío a la AEAT).
 */
export const NON_FISCAL_NOTICE =
  'Documento generado sin medios de facturación verificable (Verifactu). No incluye huella, QR tributario ni registro ante la AEAT. Verifica los requisitos legales aplicables antes de entregarlo como factura oficial.';

/** Map a factura to the engine Invoice fields used by the tax calculator. */
export function facturaToInvoiceFields(f: FacturaType): {
  date: string;
  clientName: string;
  amountCents: number;
  placeOfSupply: PlaceOfSupply;
  ivaRate: number;
  retencionRate: number;
  notes: string;
} {
  const { baseCents } = facturaTotals(f);
  return {
    date: f.issueDate,
    clientName: f.clientName || 'Cliente',
    amountCents: baseCents,
    placeOfSupply: f.placeOfSupply,
    ivaRate: f.ivaRate,
    retencionRate: f.retencionRate,
    notes: `Generada desde ${facturaRef(f)}`,
  };
}
