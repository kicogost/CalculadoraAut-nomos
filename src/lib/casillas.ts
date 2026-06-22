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
  let exportSeen = false;
  let euSeen = false;
  for (const inv of invoices) {
    const m = recognitionMonth(inv, basis, year);
    if (m === null || quarterOfMonth(m) !== quarter) continue;
    if (inv.placeOfSupply === 'non_eu_export') exportSeen = true;
    if (inv.placeOfSupply === 'eu_b2b') euSeen = true;
    const cuota = outputIva(inv);
    if (cuota <= 0) continue;
    const cur = byRate.get(inv.ivaRate) ?? { base: 0, cuota: 0 };
    cur.base += inv.amountCents;
    cur.cuota += cuota;
    byRate.set(inv.ivaRate, cur);
  }
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
  if (exportSeen) {
    notes.push(
      'Tienes operaciones fuera de la UE (no sujetas): su base va en casillas informativas (p. ej. 120/123), no en el IVA devengado. Revísalo.',
    );
  }
  if (euSeen) {
    notes.push(
      'Tienes operaciones intracomunitarias (UE, inversión del sujeto pasivo): se informan también en el Modelo 349 y en casillas específicas del 303. Revísalo.',
    );
  }
  if (resultado < 0) {
    notes.push(
      quarter === 4
        ? 'Resultado negativo: va a la casilla 72 (a compensar) o 73 (a devolver, solo 4T).'
        : 'Resultado negativo: va a la casilla 72 (a compensar en periodos siguientes).',
    );
  }

  return {
    model: 'Modelo 303 · IVA',
    period: `${QUARTER_LABELS[quarter - 1]} ${year}`,
    groups: [
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
    ],
    resultCents: resultado,
    resultLabel: resultado >= 0 ? 'A ingresar (casilla 71)' : 'A compensar/devolver',
    notes,
  };
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
