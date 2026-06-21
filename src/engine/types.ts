import type { Cents } from './money';

// ---------------------------------------------------------------------------
// Tax configuration (versioned by year — single source of truth for rates)
// ---------------------------------------------------------------------------

/** A progressive tax bracket. `upTo` is the upper bound in EUR (not cents); null = ∞. */
export interface Bracket {
  upTo: number | null;
  /** Marginal rate as a percentage, e.g. 9.5 for 9.5%. */
  rate: number;
}

/** A Seguridad Social (RETA) contribution tramo. */
export interface Tramo {
  tramo: number;
  /** Monthly net-income lower bound (EUR), inclusive per the table's boundary rules. */
  netFromEurMonth: number;
  /** Monthly net-income upper bound (EUR); null = no upper bound. */
  netToEurMonth: number | null;
  /** Minimum monthly contribution base (cents). */
  baseMinCents: Cents;
  /** Maximum monthly contribution base (cents). */
  baseMaxCents: Cents;
  /** Resulting minimum monthly cuota (cents) at the config's combined rate. */
  cuotaMinCents: Cents;
}

/** Family/personal circumstances that drive the mínimo personal y familiar. */
export interface PersonalCircumstances {
  /** Number of children/descendants living with the taxpayer. */
  children: number;
  /** Of those, how many are under 3 years old. */
  childrenUnder3: number;
  /** Taxpayer is over 65. */
  over65: boolean;
  /** Taxpayer is over 75 (implies over65). */
  over75: boolean;
  /** Taxpayer disability percentage (0, 33..64, or >=65). 0 = none. */
  disabilityPct: number;
}

export interface IrpfMinimums {
  /** General mínimo del contribuyente (EUR). */
  contribuyenteGeneral: number;
  contribuyenteOver65: number;
  contribuyenteOver75: number;
  /** Descendant minimums by ordinal (1st, 2nd, 3rd, 4th+). */
  descendant: [number, number, number, number];
  descendantUnder3Extra: number;
  /** Disability minimums. */
  disability33to64: number;
  disability65plus: number;
}

export interface DeadlineSet {
  /** Quarterly deadlines (Modelo 130 & 303), index 0..3 → Q1..Q4. ISO dates. */
  quarterly: [string, string, string, string];
  /** Annual IVA summary (Modelo 390) for this tax year. ISO date. */
  modelo390: string;
  /** Renta annual (Modelo 100) campaign end for this tax year. ISO date. */
  modelo100: string;
}

export interface TaxConfig {
  year: number;
  /** ISO date the constants were last verified. Surfaced in the UI. */
  verifiedOn: string;
  ss: {
    tramos: Tramo[];
    /** Combined contribution rate applied to the base, as a percentage. */
    combinedRatePct: number;
    /** MEI rate for the year (percentage), informational. */
    meiRatePct: number;
    /** Tarifa plana nominal monthly cuota (cents). */
    tarifaPlanaMonthlyCents: Cents;
    /** Tarifa plana real monthly cuota with MEI (cents), informational. */
    tarifaPlanaWithMeiMonthlyCents: Cents;
    /** SMI annual figure (cents) — gates the tarifa plana prórroga. */
    smiAnnualCents: Cents;
  };
  irpf: {
    stateScale: Bracket[];
    /** Autonomic scales keyed by comunidad id. Foral regimes are absent. */
    autonomicScales: Record<string, Bracket[]>;
    minimums: IrpfMinimums;
    /** Gastos de difícil justificación (estimación directa simplificada). */
    dificilJustificacion: { ratePct: number; capCents: Cents };
    /** Turnover threshold (cents) above which estimación directa normal is required. */
    simplificadaThresholdCents: Cents;
  };
  modelo130: {
    ratePct: number;
    /** Fraction of income with retención above which 130 is not required. */
    retencionExemptionThreshold: number;
  };
  iva: { standardPct: number; reducedPct: number; superReducedPct: number };
  retencion: { standardPct: number; reducedPct: number };
  deadlines: DeadlineSet;
}

// ---------------------------------------------------------------------------
// Comunidades autónomas
// ---------------------------------------------------------------------------

export interface Comunidad {
  id: string;
  name: string;
  /** Foral regimes (País Vasco, Navarra) are out of scope in v1. */
  foral: boolean;
}

// ---------------------------------------------------------------------------
// Domain entities (also the persisted shapes)
// ---------------------------------------------------------------------------

export type PlaceOfSupply =
  | 'domestic_es'
  | 'eu_b2b'
  | 'non_eu_export'
  | 'domestic_b2c'
  | 'other';

export interface Invoice {
  id: string;
  /** ISO date; used for income recognition under devengo. */
  date: string;
  /** ISO date of payment; used under criterio de caja. */
  paidDate?: string;
  clientName: string;
  /** Base (pre-IVA) amount in cents. */
  amountCents: Cents;
  placeOfSupply: PlaceOfSupply;
  /** Output IVA rate as a percentage (0, 4, 10, 21). */
  ivaRate: number;
  /** Retención rate as a percentage (0, 7, 15). */
  retencionRate: number;
  notes?: string;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  /** Total amount including IVA (cents). */
  amountCents: Cents;
  /** Deductible portion for IRPF, 0..100. */
  deductiblePct: number;
  /** Deductible input IVA (cents); 0 if none. */
  inputIvaCents: Cents;
  /** True for engine-created rows (e.g. the monthly cuota). */
  autoGenerated?: boolean;
  notes?: string;
}

export type RecognitionBasis = 'devengo' | 'caja';

export type SsStatus =
  | { kind: 'tarifa_plana_y1' }
  | { kind: 'tarifa_plana_y2' }
  | { kind: 'tramo'; tramo: number; baseCents: Cents };

/** A mid-year SS status change: the new status applies from `fromMonth` (1..12) onward. */
export interface SsStatusChange {
  fromMonth: number;
  status: SsStatus;
}

export interface YearProfile {
  year: number;
  comunidadAutonoma: string;
  ssStatus: SsStatus;
  ssStatusChanges?: SsStatusChange[];
  recognitionBasis: RecognitionBasis;
  estimacionDirecta: 'simplificada' | 'normal';
  personal: PersonalCircumstances;
}

export type ProvisioningStyle = 'conservative' | 'exact' | 'custom';

export interface ProvisioningSettings {
  style: ProvisioningStyle;
  /** Used when style === 'custom': a flat percentage of income. */
  customPct?: number;
}
