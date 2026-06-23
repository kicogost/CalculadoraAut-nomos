/**
 * Casilla-a-casilla mapping: turns the engine's figures into the official AEAT
 * box numbers for Modelo 130 and Modelo 303 (plus annual 390/349 summaries), so
 * the user can type/import them into the AEAT form and submit with their Cl@ve.
 *
 * Box numbers verified against the AEAT instructions (Modelo 130 instrucciones;
 * Modelo 303 instrucciones 2025). Values come from the engine (already tested).
 * Advanced/edge boxes (minoración rentas bajas, deducción vivienda,
 * complementarias, export/intracom informative boxes) are flagged for review
 * rather than auto-filled, because mis-placing them causes real errors.
 */
import type { Expense, Invoice, TaxConfig, YearProfile } from '../engine';
import {
  cuotaExpenses,
  expensesThroughMonth,
  incomeThroughMonth,
  modelo130Year,
  monthsInQuarter,
  outputIva,
  quarterOfMonth,
  recognitionMonth,
  QUARTER_LABELS,
  type Cents,
} from '../engine';

export interface Casilla {
  n: number;
  label: string;
  /** Monetary value in cents (rendered as €). Mutually exclusive with `text`. */
  cents?: Cents;
  /** Non-monetary value (e.g. a tipo "21%"). */
  text?: string;
  note?: string;
}

export interface CasillaGroup {
  title: string;
  rows: Casilla[];
}

export interface ModeloCasillas {
  model: string;
  period: string;
  groups: CasillaGroup[];
  /** The bottom-line "resultado" value (cents). */
  resultCents: Cents;
  resultLabel: string;
  notes: string[];
}

const RATE_ROWS = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
] as const;

/** Modelo 303 (IVA) — régimen general, for one quarter. */
export function modelo303Casillas(
  invoices: Invoice[],
  userExpenses: Expense[],
  profile: YearProfile,
  _cfg: TaxConfig,
  quarter: number,
): ModeloCasillas {
  const { recognitionBasis: basis, year } = profile;

  // IVA devengado, grouped by rate (descending) → the three régimen-general rows.
  const byRate = new Map<number, { base: Cents; cuota: Cents }>();
  let exportBase = 0; // non_eu_export (services → no sujeto por localización)
  let euBase = 0; // eu_b2b (no sujeto por localización + Modelo 349)
  for (const inv of invoices) {
    const m = recognitionMonth(inv, basis, year);
    if (m === null || quarterOfMonth(m) !== quarter) continue;
    if (inv.placeOfSupply === 'non_eu_export') exportBase += inv.amountCents;
    if (inv.placeOfSupply === 'eu_b2b') euBase += inv.amountCents;
    const cuota = outputIva(inv);
    if (cuota <= 0) continue;
    const cur = byRate.get(inv.ivaRate) ?? { base: 0, cuota: 0 };
    cur.base += inv.amountCents;
    cur.cuota += cuota;
    byRate.set(inv.ivaRate, cur);
  }
  const noSujetaBase = exportBase + euBase;
  const rates = [...byRate.keys()].sort((a, b) => b - a).slice(0, 3);

  const devengadoRows: Casilla[] = [];
  let totalDevengado = 0;
  rates.forEach((rate, i) => {
    const row = RATE_ROWS[i];
    const { base, cuota } = byRate.get(rate)!;
    totalDevengado += cuota;
    devengadoRows.push(
      { n: row[0], label: `Base imponible (${rate}%)`, cents: base },
      { n: row[1], label: 'Tipo %', text: `${rate}%` },
      { n: row[2], label: 'Cuota', cents: cuota },
    );
  });
  if (devengadoRows.length === 0) {
    devengadoRows.push({ n: 1, label: 'Base imponible', cents: 0 }, { n: 3, label: 'Cuota', cents: 0 });
  }
  devengadoRows.push({ n: 27, label: 'Total cuota devengada', cents: totalDevengado });

  // IVA deducible — operaciones interiores corrientes (casillas 28/29).
  let deduBase = 0;
  let deduCuota = 0;
  for (const exp of userExpenses) {
    const [ey, em] = exp.date.split('-').map(Number);
    if (ey !== year || quarterOfMonth(em) !== quarter) continue;
    if (exp.inputIvaCents > 0) {
      deduBase += exp.amountCents - exp.inputIvaCents;
      deduCuota += exp.inputIvaCents;
    }
  }
  const resultado = totalDevengado - deduCuota;

  const notes: string[] = [];
  if (euBase > 0) {
    notes.push(
      'Las operaciones intracomunitarias (UE) van además en el Modelo 349 (clave S, prestaciones de servicios), con el NIF-IVA del cliente.',
    );
  }
  if (exportBase > 0) {
    notes.push(
      'Servicios fuera de la UE: no sujetos por reglas de localización → casilla 120. Si fueran exportaciones de bienes, irían en la casilla 60.',
    );
  }
  if (resultado < 0) {
    notes.push(
      quarter === 4
        ? 'Resultado negativo: va a la casilla 72 (a compensar) o 73 (a devolver, solo 4T).'
        : 'Resultado negativo: va a la casilla 72 (a compensar en periodos siguientes).',
    );
  }

  const groups: CasillaGroup[] = [
    { title: 'IVA devengado (régimen general)', rows: devengadoRows },
    {
      title: 'IVA deducible (operaciones interiores corrientes)',
      rows: [
        { n: 28, label: 'Base imponible', cents: deduBase },
        { n: 29, label: 'Cuota deducible', cents: deduCuota },
        { n: 45, label: 'Total a deducir', cents: deduCuota },
      ],
    },
    {
      title: 'Resultado',
      rows: [
        { n: 46, label: 'Resultado régimen general (27 − 45)', cents: resultado },
        { n: 71, label: 'Resultado de la autoliquidación', cents: resultado },
      ],
    },
  ];
  // Información adicional: operaciones no sujetas por reglas de localización
  // (servicios a clientes UE y de fuera de la UE).
  if (noSujetaBase > 0) {
    groups.push({
      title: 'Información adicional (operaciones no sujetas por localización)',
      rows: [{ n: 120, label: 'Operaciones no sujetas por reglas de localización', cents: noSujetaBase }],
    });
  }

  return {
    model: 'Modelo 303 · IVA',
    period: `${QUARTER_LABELS[quarter - 1]} ${year}`,
    groups,
    resultCents: resultado,
    resultLabel: resultado >= 0 ? 'A ingresar (casilla 71)' : 'A compensar/devolver',
    notes,
  };
}

// Modelo 390 régimen ordinario devengado: rate → [base casilla, cuota casilla].
const M390_DEVENGADO: Record<number, [number, number]> = {
  4: [1, 2],
  10: [3, 4],
  21: [5, 6],
};

/**
 * Modelo 390 (resumen anual de IVA) — annual summary, common-case boxes for an
 * autónomo en régimen general. Box numbers verified vs the AEAT 390 instructions.
 * Note: SII filers and (quarterly) régimen-simplificado/urban-rental-only filers
 * are EXEMPT from 390. The form has many more boxes for special regimes /
 * modifications not covered here.
 */
export function modelo390Casillas(
  invoices: Invoice[],
  userExpenses: Expense[],
  profile: YearProfile,
  _cfg: TaxConfig,
): ModeloCasillas {
  const { recognitionBasis: basis, year } = profile;

  const byRate = new Map<number, { base: Cents; cuota: Cents }>();
  let regGeneralBase = 0;
  for (const inv of invoices) {
    if (recognitionMonth(inv, basis, year) === null) continue;
    const cuota = outputIva(inv);
    if (cuota <= 0) continue;
    regGeneralBase += inv.amountCents;
    const cur = byRate.get(inv.ivaRate) ?? { base: 0, cuota: 0 };
    cur.base += inv.amountCents;
    cur.cuota += cuota;
    byRate.set(inv.ivaRate, cur);
  }

  const devengadoRows: Casilla[] = [];
  let totalDevengado = 0;
  let unmappedRate = false;
  for (const rate of [21, 10, 4]) {
    const v = byRate.get(rate);
    if (!v) continue;
    const [baseN, cuotaN] = M390_DEVENGADO[rate];
    totalDevengado += v.cuota;
    devengadoRows.push(
      { n: baseN, label: `Base imponible (${rate}%)`, cents: v.base },
      { n: cuotaN, label: `Cuota (${rate}%)`, cents: v.cuota },
    );
  }
  for (const rate of byRate.keys()) if (!M390_DEVENGADO[rate]) unmappedRate = true;
  devengadoRows.push({ n: 47, label: 'Total cuotas IVA y recargo devengadas', cents: totalDevengado });

  // Deducible operaciones interiores corrientes (annual).
  let deduBase = 0;
  let deduCuota = 0;
  for (const exp of userExpenses) {
    const [ey] = exp.date.split('-').map(Number);
    if (ey !== year) continue;
    if (exp.inputIvaCents > 0) {
      deduBase += exp.amountCents - exp.inputIvaCents;
      deduCuota += exp.inputIvaCents;
    }
  }
  const resultado = totalDevengado - deduCuota;

  const notes = [
    'Resumen anual: casillas principales del régimen general. El 390 tiene más casillas para regímenes especiales y modificaciones.',
    'No presentan 390: incluidos en SII, y (en trimestral) quienes solo tributan en régimen simplificado o arrendamiento de inmuebles urbanos.',
  ];
  if (unmappedRate) notes.push('Hay operaciones a tipos distintos de 4/10/21%: revisa sus casillas específicas.');

  return {
    model: 'Modelo 390 · resumen anual IVA',
    period: `${year} (anual)`,
    groups: [
      { title: 'IVA devengado (régimen ordinario)', rows: devengadoRows },
      {
        title: 'IVA deducible (operaciones interiores corrientes)',
        rows: [
          { n: 48, label: 'Base imponible', cents: deduBase },
          { n: 49, label: 'Cuota deducible', cents: deduCuota },
        ],
      },
      {
        title: 'Resultado',
        rows: [
          { n: 65, label: 'Resultado régimen general', cents: resultado },
          { n: 86, label: 'Resultado de la liquidación anual', cents: resultado },
        ],
      },
      {
        title: 'Volumen de operaciones',
        rows: [{ n: 99, label: 'Operaciones en régimen general (base)', cents: regGeneralBase }],
      },
    ],
    resultCents: resultado,
    resultLabel: 'Resultado anual (informativo)',
    notes,
  };
}

export interface Modelo349Row {
  clientName: string;
  baseCents: Cents;
  clave: string;
}

/**
 * Modelo 349 (recapitulativa intracomunitaria) for one quarter: one row per EU
 * B2B client with the base and clave S (prestaciones de servicios). The client's
 * NIF-IVA must be added by the user (not stored on income invoices).
 */
export function modelo349Rows(invoices: Invoice[], profile: YearProfile, quarter: number): Modelo349Row[] {
  const { recognitionBasis: basis, year } = profile;
  const byClient = new Map<string, number>();
  for (const inv of invoices) {
    if (inv.placeOfSupply !== 'eu_b2b') continue;
    const m = recognitionMonth(inv, basis, year);
    if (m === null || quarterOfMonth(m) !== quarter) continue;
    const name = inv.clientName.trim() || 'Cliente UE';
    byClient.set(name, (byClient.get(name) ?? 0) + inv.amountCents);
  }
  return [...byClient.entries()]
    .map(([clientName, baseCents]) => ({ clientName, baseCents, clave: 'S' }))
    .sort((a, b) => b.baseCents - a.baseCents);
}

/** Modelo 130 (pago fraccionado IRPF) — estimación directa, for one quarter. */
export function modelo130Casillas(
  invoices: Invoice[],
  userExpenses: Expense[],
  profile: YearProfile,
  cfg: TaxConfig,
  quarter: number,
): ModeloCasillas {
  const { recognitionBasis: basis, year } = profile;
  const allExpenses = [...userExpenses, ...cuotaExpenses(profile, cfg)];
  const m = modelo130Year(invoices, allExpenses, basis, year, cfg)[quarter - 1];
  const throughMonth = monthsInQuarter(quarter)[2];
  const income = incomeThroughMonth(invoices, basis, year, throughMonth);
  const exp = expensesThroughMonth(allExpenses, year, throughMonth);

  const c07 = m.grossPaymentCents - m.priorPaymentsCents - m.retencionesYtdCents;

  return {
    model: 'Modelo 130 · IRPF',
    period: `${QUARTER_LABELS[quarter - 1]} ${year}`,
    groups: [
      {
        title: 'Actividades económicas en estimación directa',
        rows: [
          { n: 1, label: 'Ingresos íntegros computables (acumulado)', cents: income.baseCents },
          { n: 2, label: 'Gastos deducibles (acumulado, incl. cuota)', cents: exp.deductibleCents },
          { n: 3, label: 'Rendimiento neto (01 − 02)', cents: m.accumulatedNetCents },
          { n: 4, label: 'Cuota: 20% del positivo de 03', cents: m.grossPaymentCents },
          { n: 5, label: 'Pagos fraccionados de trimestres anteriores', cents: m.priorPaymentsCents },
          { n: 6, label: 'Retenciones e ingresos a cuenta', cents: m.retencionesYtdCents },
          { n: 7, label: 'Resultado (04 − 05 − 06)', cents: c07 },
        ],
      },
      {
        title: 'Liquidación',
        rows: [{ n: 19, label: 'Resultado a ingresar', cents: m.dueCents }],
      },
    ],
    resultCents: m.dueCents,
    resultLabel: 'A ingresar (casilla 19)',
    notes: [
      'Casillas 13 (minoración por rendimientos bajos), 16 (deducción vivienda habitual) y 18 (complementaria) se dejan en blanco salvo que apliquen a tu caso.',
    ],
  };
}
