import type { PlaceOfSupply } from '../engine';

export interface Country {
  name: string;
  /** EU member (for VAT place-of-supply / reverse charge). */
  eu: boolean;
}

/**
 * Country list with EU membership. Spain first, then EU members, then common
 * non-EU destinations. Used to auto-suggest the place of supply for B2B services.
 */
export const COUNTRIES: Country[] = [
  { name: 'España', eu: true },
  { name: 'Alemania', eu: true },
  { name: 'Austria', eu: true },
  { name: 'Bélgica', eu: true },
  { name: 'Bulgaria', eu: true },
  { name: 'Chipre', eu: true },
  { name: 'Croacia', eu: true },
  { name: 'Dinamarca', eu: true },
  { name: 'Eslovaquia', eu: true },
  { name: 'Eslovenia', eu: true },
  { name: 'Estonia', eu: true },
  { name: 'Finlandia', eu: true },
  { name: 'Francia', eu: true },
  { name: 'Grecia', eu: true },
  { name: 'Hungría', eu: true },
  { name: 'Irlanda', eu: true },
  { name: 'Italia', eu: true },
  { name: 'Letonia', eu: true },
  { name: 'Lituania', eu: true },
  { name: 'Luxemburgo', eu: true },
  { name: 'Malta', eu: true },
  { name: 'Países Bajos', eu: true },
  { name: 'Polonia', eu: true },
  { name: 'Portugal', eu: true },
  { name: 'República Checa', eu: true },
  { name: 'Rumanía', eu: true },
  { name: 'Suecia', eu: true },
  // Common non-EU destinations
  { name: 'Estados Unidos', eu: false },
  { name: 'Reino Unido', eu: false },
  { name: 'Suiza', eu: false },
  { name: 'Canadá', eu: false },
  { name: 'México', eu: false },
  { name: 'Argentina', eu: false },
  { name: 'Noruega', eu: false },
  { name: 'Australia', eu: false },
  { name: 'Otro (fuera de la UE)', eu: false },
];

export function isEuCountry(name: string): boolean {
  return COUNTRIES.find((c) => c.name === name)?.eu ?? false;
}

/**
 * Suggest the place of supply for a B2B service invoice based on the client's
 * country: Spain → domestic; another EU country → reverse charge; otherwise
 * non-EU export (no sujeto). B2C is not auto-detected here.
 */
export function placeOfSupplyForCountry(name: string): PlaceOfSupply {
  if (name === 'España') return 'domestic_es';
  return isEuCountry(name) ? 'eu_b2b' : 'non_eu_export';
}

export const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'CAD', 'MXN', 'AUD', 'NOK'] as const;
