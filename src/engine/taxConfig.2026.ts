import type { TaxConfig, Tramo } from './types';
import { eurToCents } from './money';

/**
 * Tax configuration for the 2026 tax year.
 *
 * Every value here is documented and sourced in RESEARCH.md (verified 2026-06-21).
 * The engine takes a TaxConfig as a parameter and never reads a global, so adding
 * a future year is just dropping in a new config object.
 *
 * Scales are { upTo, rate } with rate in percent and upTo in EUR (null = ∞).
 * Foral regimes (País Vasco, Navarra) are deliberately ABSENT — out of scope in v1.
 */

const COMBINED_RATE_PCT = 31.5;

/** Build a tramo row, deriving the min cuota from the base at the combined rate. */
function tramo(
  n: number,
  netFrom: number,
  netTo: number | null,
  baseMin: number,
  baseMax: number,
): Tramo {
  return {
    tramo: n,
    netFromEurMonth: netFrom,
    netToEurMonth: netTo,
    baseMinCents: eurToCents(baseMin),
    baseMaxCents: eurToCents(baseMax),
    cuotaMinCents: eurToCents((baseMin * COMBINED_RATE_PCT) / 100),
  };
}

// RETA 2026 tramos — bases penny-exact from BOE-A-2026-7296 Art. 18.1.
const TRAMOS_2026: Tramo[] = [
  tramo(1, 0, 670, 653.59, 718.94),
  tramo(2, 670, 900, 718.95, 900.0),
  tramo(3, 900, 1166.7, 849.67, 1166.7),
  tramo(4, 1166.7, 1300, 950.98, 1300.0),
  tramo(5, 1300, 1500, 960.78, 1500.0),
  tramo(6, 1500, 1700, 960.78, 1700.0),
  tramo(7, 1700, 1850, 1143.79, 1850.0),
  tramo(8, 1850, 2030, 1209.15, 2030.0),
  tramo(9, 2030, 2330, 1274.51, 2330.0),
  tramo(10, 2330, 2760, 1356.21, 2760.0),
  tramo(11, 2760, 3190, 1437.91, 3190.0),
  tramo(12, 3190, 3620, 1519.61, 3620.0),
  tramo(13, 3620, 4050, 1601.31, 4050.0),
  tramo(14, 4050, 6000, 1732.03, 5101.2),
  tramo(15, 6000, null, 1928.1, 5101.2),
];

export const TAX_CONFIG_2026: TaxConfig = {
  year: 2026,
  verifiedOn: '2026-06-21',

  ss: {
    tramos: TRAMOS_2026,
    combinedRatePct: COMBINED_RATE_PCT,
    meiRatePct: 0.9,
    tarifaPlanaMonthlyCents: eurToCents(80),
    tarifaPlanaWithMeiMonthlyCents: eurToCents(88.64),
    smiAnnualCents: eurToCents(17094),
  },

  irpf: {
    // State general scale (Art. 63.1 Ley 35/2006) — unchanged since 2021.
    stateScale: [
      { upTo: 12450, rate: 9.5 },
      { upTo: 20200, rate: 12.0 },
      { upTo: 35200, rate: 15.0 },
      { upTo: 60000, rate: 18.5 },
      { upTo: 300000, rate: 22.5 },
      { upTo: null, rate: 24.5 },
    ],

    // Autonomic general scales — 2026. See RESEARCH.md §2.2.
    autonomicScales: {
      madrid: [
        { upTo: 13362.22, rate: 8.5 },
        { upTo: 19004.63, rate: 10.7 },
        { upTo: 35425.68, rate: 12.8 },
        { upTo: 57320.4, rate: 17.4 },
        { upTo: null, rate: 20.5 },
      ],
      baleares: [
        { upTo: 10000, rate: 9.0 },
        { upTo: 18000, rate: 11.25 },
        { upTo: 30000, rate: 14.25 },
        { upTo: 48000, rate: 17.5 },
        { upTo: 70000, rate: 19.0 },
        { upTo: 90000, rate: 21.75 },
        { upTo: 120000, rate: 22.75 },
        { upTo: 175000, rate: 23.75 },
        { upTo: null, rate: 24.75 },
      ],
      andalucia: [
        { upTo: 13000, rate: 9.5 },
        { upTo: 21100, rate: 12.0 },
        { upTo: 35200, rate: 15.0 },
        { upTo: 60000, rate: 18.5 },
        { upTo: null, rate: 22.5 },
      ],
      cataluna: [
        { upTo: 12500, rate: 9.5 },
        { upTo: 22000, rate: 12.5 },
        { upTo: 33000, rate: 16.0 },
        { upTo: 53000, rate: 19.0 },
        { upTo: 90000, rate: 21.5 },
        { upTo: 120000, rate: 23.5 },
        { upTo: 175000, rate: 24.5 },
        { upTo: null, rate: 25.5 },
      ],
      // ⚠️ Pending anteproyecto may lower the first 8 brackets retroactive to
      // 2026-01-01 (not law as of 2026-06-21). Current in-force scale shipped.
      valencia: [
        { upTo: 12000, rate: 9.0 },
        { upTo: 22000, rate: 12.0 },
        { upTo: 32000, rate: 15.0 },
        { upTo: 42000, rate: 17.5 },
        { upTo: 52000, rate: 20.0 },
        { upTo: 62000, rate: 22.5 },
        { upTo: 72000, rate: 25.0 },
        { upTo: 100000, rate: 26.5 },
        { upTo: 150000, rate: 27.5 },
        { upTo: 200000, rate: 28.5 },
        { upTo: null, rate: 29.5 },
      ],
      galicia: [
        { upTo: 12985.35, rate: 9.0 },
        { upTo: 21068.6, rate: 11.65 },
        { upTo: 35200, rate: 14.9 },
        { upTo: 60000, rate: 18.4 },
        { upTo: null, rate: 22.5 },
      ],
      castilla_leon: [
        { upTo: 12450, rate: 9.0 },
        { upTo: 20200, rate: 12.0 },
        { upTo: 35200, rate: 14.0 },
        { upTo: 53407.2, rate: 18.5 },
        { upTo: null, rate: 21.5 },
      ],
      castilla_la_mancha: [
        { upTo: 12450, rate: 9.5 },
        { upTo: 20200, rate: 12.0 },
        { upTo: 35200, rate: 15.0 },
        { upTo: 60000, rate: 18.5 },
        { upTo: null, rate: 22.5 },
      ],
      aragon: [
        { upTo: 13072.5, rate: 9.5 },
        { upTo: 21210, rate: 12.0 },
        { upTo: 36960, rate: 15.0 },
        { upTo: 52500, rate: 18.5 },
        { upTo: 60000, rate: 20.5 },
        { upTo: 80000, rate: 23.0 },
        { upTo: 90000, rate: 24.0 },
        { upTo: 130000, rate: 25.0 },
        { upTo: null, rate: 25.5 },
      ],
      asturias: [
        { upTo: 12450, rate: 9.0 },
        { upTo: 17707.2, rate: 12.0 },
        { upTo: 33007.2, rate: 14.0 },
        { upTo: 53407.2, rate: 19.2 },
        { upTo: 70000, rate: 21.5 },
        { upTo: 90000, rate: 22.5 },
        { upTo: 175000, rate: 25.0 },
        { upTo: null, rate: 26.0 },
      ],
      cantabria: [
        { upTo: 13000, rate: 8.5 },
        { upTo: 21000, rate: 11.0 },
        { upTo: 35200, rate: 14.5 },
        { upTo: 60000, rate: 18.0 },
        { upTo: 90000, rate: 22.5 },
        { upTo: null, rate: 24.5 },
      ],
      extremadura: [
        { upTo: 12450, rate: 8.0 },
        { upTo: 20200, rate: 10.0 },
        { upTo: 24200, rate: 16.0 },
        { upTo: 35200, rate: 17.5 },
        { upTo: 60000, rate: 21.0 },
        { upTo: 80200, rate: 23.5 },
        { upTo: 99200, rate: 24.0 },
        { upTo: 120200, rate: 24.5 },
        { upTo: null, rate: 25.0 },
      ],
      murcia: [
        { upTo: 12450, rate: 9.5 },
        { upTo: 20200, rate: 11.2 },
        { upTo: 34000, rate: 13.3 },
        { upTo: 60000, rate: 17.9 },
        { upTo: null, rate: 22.5 },
      ],
      la_rioja: [
        { upTo: 12450, rate: 8.0 },
        { upTo: 20200, rate: 10.6 },
        { upTo: 35200, rate: 13.6 },
        { upTo: 40000, rate: 17.8 },
        { upTo: 50000, rate: 18.3 },
        { upTo: 60000, rate: 19.0 },
        { upTo: 120000, rate: 24.5 },
        { upTo: null, rate: 27.0 },
      ],
      // Canarias deflactated +2.1% for 2026 (Ley 9/2025).
      canarias: [
        { upTo: 13748, rate: 9.0 },
        { upTo: 19422, rate: 11.5 },
        { upTo: 35924, rate: 14.0 },
        { upTo: 57566, rate: 18.5 },
        { upTo: 93268, rate: 23.5 },
        { upTo: 123745, rate: 25.0 },
        { upTo: null, rate: 26.0 },
      ],
    },

    minimums: {
      contribuyenteGeneral: 5550,
      contribuyenteOver65: 1150,
      contribuyenteOver75: 1400,
      descendant: [2400, 2700, 4000, 4500],
      descendantUnder3Extra: 2800,
      disability33to64: 3000,
      disability65plus: 9000,
    },

    dificilJustificacion: { ratePct: 5, capCents: eurToCents(2000) },
    simplificadaThresholdCents: eurToCents(600000),
  },

  modelo130: {
    ratePct: 20,
    retencionExemptionThreshold: 0.7,
  },

  iva: { standardPct: 21, reducedPct: 10, superReducedPct: 4 },

  retencion: { standardPct: 15, reducedPct: 7 },

  deadlines: {
    // Q1–Q3 2026 are weekday dates (HIGH). Q4 nominal 2027-01-30 is a Saturday →
    // rolls to Mon 2027-02-01. Re-verify against the 2027 calendar when published.
    quarterly: ['2026-04-20', '2026-07-20', '2026-10-20', '2027-02-01'],
    modelo390: '2027-02-01',
    modelo100: '2027-06-30',
  },
};

/** Registry of available year configs. Add next year by dropping in a new object. */
export const TAX_CONFIGS: Record<number, TaxConfig> = {
  2026: TAX_CONFIG_2026,
};

export function getTaxConfig(year: number): TaxConfig | undefined {
  return TAX_CONFIGS[year];
}
