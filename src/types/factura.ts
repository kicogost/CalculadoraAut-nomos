import type { PlaceOfSupply } from '../engine';

/** The autónomo issuing the invoice (their own fiscal data + logo). */
export interface IssuerProfile {
  name: string;
  nif: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
  /** Logo as a data URL (stored locally, embedded in the PDF). */
  logoDataUrl?: string;
  iban?: string;
}

export interface FacturaLineItem {
  id: string;
  concept: string;
  quantity: number;
  /** Unit price, pre-IVA, in integer cents. */
  unitPriceCents: number;
}

/** Document kind. All are non-fiscal drafts in this tool (see DISCLAIMER). */
export type FacturaDocType = 'factura' | 'proforma' | 'presupuesto';

export interface Factura {
  id: string;
  docType: FacturaDocType;
  series: string;
  number: number;
  year: number;
  issueDate: string; // ISO

  clientName: string;
  clientNif: string;
  clientAddress: string;
  clientPostalCode: string;
  clientCity: string;
  clientCountry: string;

  placeOfSupply: PlaceOfSupply;
  lineItems: FacturaLineItem[];
  ivaRate: number;
  retencionRate: number;

  paymentTerms: string;
  notes: string;
  currency: string;

  /** Set when this factura has been added to the income/calculator. */
  linkedInvoiceId?: string;
}

export const EMPTY_ISSUER: IssuerProfile = {
  name: '',
  nif: '',
  address: '',
  postalCode: '',
  city: '',
  country: 'España',
};
