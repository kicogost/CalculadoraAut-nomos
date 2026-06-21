/**
 * Verifactu offline record generation — the huella (hash) chain and the invoice
 * QR, implemented to the AEAT spec (Orden HAC/1177/2024 + the AEAT technical
 * documents "Detalle de las especificaciones técnicas para generación de la
 * huella o hash" v0.1.2 and "Características del QR" v0.5.0).
 *
 * ⚠️ This generates Verifactu-FORMAT records and the QR offline. It does NOT
 * submit anything to the AEAT — real remisión requires a digital certificate and
 * the AEAT web service, which this app cannot do. So this is "preparación", not,
 * by itself, full legal compliance. Verified against the AEAT published test
 * vectors in verifactu.test.ts.
 */

export interface RegistroAltaHuellaFields {
  idEmisor: string;
  numSerie: string;
  /** DD-MM-YYYY */
  fechaExpedicion: string;
  tipoFactura: string;
  /** Already formatted, e.g. "12.35" (1–2 decimals; trailing zeros irrelevant). */
  cuotaTotal: string;
  importeTotal: string;
  /** Previous record's huella; empty string for the first record. */
  huellaAnterior: string;
  /** ISO 8601 with timezone offset, e.g. "2024-01-01T19:20:30+01:00". */
  fechaHoraGen: string;
}

/**
 * Build the exact concatenation string for a registro de alta, per the AEAT
 * spec: `nombreCampo1=valor1&nombreCampo2=valor2&...`, values trimmed.
 */
export function buildHuellaInputAlta(f: RegistroAltaHuellaFields): string {
  const t = (s: string) => s.trim();
  return (
    `IDEmisorFactura=${t(f.idEmisor)}` +
    `&NumSerieFactura=${t(f.numSerie)}` +
    `&FechaExpedicionFactura=${t(f.fechaExpedicion)}` +
    `&TipoFactura=${t(f.tipoFactura)}` +
    `&CuotaTotal=${t(f.cuotaTotal)}` +
    `&ImporteTotal=${t(f.importeTotal)}` +
    `&Huella=${t(f.huellaAnterior)}` +
    `&FechaHoraHusoGenRegistro=${t(f.fechaHoraGen)}`
  );
}

/** SHA-256 of a UTF-8 string, hex UPPERCASE (64 chars) — the AEAT output format. */
export async function computeHuella(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

/** Convenience: build the input and hash it. */
export async function huellaAlta(f: RegistroAltaHuellaFields): Promise<string> {
  return computeHuella(buildHuellaInputAlta(f));
}

// ---------------------------------------------------------------------------
// QR (cotejo) URL
// ---------------------------------------------------------------------------

export type VerifactuEnv = 'produccion' | 'pruebas';

const QR_BASE: Record<VerifactuEnv, { verifactu: string; noVerifactu: string }> = {
  produccion: {
    verifactu: 'https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR',
    noVerifactu: 'https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQRNoVerifactu',
  },
  pruebas: {
    verifactu: 'https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQR',
    noVerifactu: 'https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQRNoVerifactu',
  },
};

export interface QrParams {
  nif: string;
  numSerie: string;
  /** DD-MM-YYYY */
  fecha: string;
  /** Importe total, point decimal, e.g. "241.4". */
  importe: string;
  verifactu?: boolean;
  env?: VerifactuEnv;
}

/**
 * Build the QR content URL with UTF-8 URL-encoded parameters, per the AEAT spec
 * (e.g. an "&" inside numserie becomes "%26").
 */
export function buildQrUrl(p: QrParams): string {
  const env = p.env ?? 'produccion';
  const base = (p.verifactu ?? true) ? QR_BASE[env].verifactu : QR_BASE[env].noVerifactu;
  const q =
    `nif=${encodeURIComponent(p.nif)}` +
    `&numserie=${encodeURIComponent(p.numSerie)}` +
    `&fecha=${encodeURIComponent(p.fecha)}` +
    `&importe=${encodeURIComponent(p.importe)}`;
  return `${base}?${q}`;
}

/** Invoice marks required by Art. 20/21 of the order. */
export const QR_HEADER = 'QR tributario:';
export const VERIFACTU_MARK = 'VERI*FACTU';
export const VERIFIABLE_MARK = 'Factura verificable en la sede electrónica de la AEAT';

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

/** Integer cents → AEAT amount string (point decimal, 2 decimals). */
export function centsToAmountString(cents: number): string {
  return (cents / 100).toFixed(2);
}

/** ISO date (YYYY-MM-DD) → AEAT date (DD-MM-YYYY). */
export function isoToAeatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}-${m}-${y}`;
}

/** A Date → "YYYY-MM-DDTHH:mm:ss±HH:mm" (local time + offset) for the record. */
export function fechaHoraHusoGen(now: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const offMin = -now.getTimezoneOffset();
  const sign = offMin >= 0 ? '+' : '-';
  const abs = Math.abs(offMin);
  return (
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
    `T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}` +
    `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
  );
}
