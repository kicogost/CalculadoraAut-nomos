import type {
  Expense,
  Invoice,
  ProvisioningSettings,
  TaxConfig,
  YearProfile,
} from './types';
import { floorZero, pctOfCents, roundCents, type Cents } from './money';
import { quarterOfMonth } from './dates';
import {
  expensesThroughMonth,
  incomeThroughMonth,
  modelo130Required,
  type ExpenseTotals,
  type IncomeTotals,
} from './income';
import { computeIrpf, type IrpfResult } from './irpf';
import { modelo303Year, type Modelo303Quarter } from './modelo303';
import { modelo130Year, type Modelo130Quarter } from './modelo130';
import { cuotaExpenses } from './cuota';
import { annualCuotaPaid, monthlyCuotas, regularizacion, type RegularizacionResult } from './ss';
import { getComunidad } from './comunidades';

export interface YearComputation {
  cfg: TaxConfig;
  profile: YearProfile;
  /** All expenses including the auto-generated cuota rows. */
  allExpenses: Expense[];
  cuotaRows: Expense[];

  income: IncomeTotals;
  expenses: ExpenseTotals;
  /** Rendimiento neto = income base − deductible expenses (incl. cuota). */
  rendimientoNetoCents: Cents;

  irpf: IrpfResult;
  modelo303: Modelo303Quarter[];
  modelo130: Modelo130Quarter[];
  modelo130Required: { required: boolean; retencionRatio: number };

  ssMonthlyCuotas: Cents[];
  ssAnnualCuotaCents: Cents;
  regularizacion: RegularizacionResult;

  /** After-tax take-home for the year = rendimiento neto − IRPF annual. */
  takeHomeCents: Cents;

  /** True when the profile's comunidad is a foral regime (IRPF can't be computed). */
  foralUnsupported: boolean;
}

/**
 * The single aggregator: takes raw entities + profile + config and produces every
 * derived figure the UI needs. Pure, no side effects. `throughMonth` lets the
 * caller compute year-to-date (defaults to the full year, i.e. a projection).
 */
export function computeYear(
  invoices: Invoice[],
  userExpenses: Expense[],
  profile: YearProfile,
  cfg: TaxConfig,
  throughMonth = 12,
): YearComputation {
  const cuotaRows = cuotaExpenses(profile, cfg);
  const allExpenses = [...userExpenses, ...cuotaRows];

  const income = incomeThroughMonth(invoices, profile.recognitionBasis, profile.year, throughMonth);
  const expenses = expensesThroughMonth(allExpenses, profile.year, throughMonth);
  const rendimientoNetoCents = income.baseCents - expenses.deductibleCents;

  const comunidad = getComunidad(profile.comunidadAutonoma);
  const foralUnsupported =
    !!comunidad?.foral || !cfg.irpf.autonomicScales[profile.comunidadAutonoma];

  let irpf: IrpfResult;
  if (foralUnsupported) {
    irpf = {
      baseLiquidableCents: floorZero(rendimientoNetoCents),
      minimoCents: 0,
      dificilJustificacionCents: 0,
      totalCuotaCents: 0,
      stateCuotaCents: 0,
      autonomicCuotaCents: 0,
      effectiveRatePct: 0,
      marginalRatePct: 0,
    };
  } else {
    irpf = computeIrpf(
      {
        rendimientoNetoPrevioCents: rendimientoNetoCents,
        comunidadId: profile.comunidadAutonoma,
        personal: profile.personal,
        estimacionDirecta: profile.estimacionDirecta,
      },
      cfg,
    );
  }

  const modelo303 = modelo303Year(invoices, allExpenses, profile.recognitionBasis, profile.year, cfg);
  const modelo130 = modelo130Year(invoices, allExpenses, profile.recognitionBasis, profile.year, cfg);
  const req = modelo130Required(income, cfg);

  const ssMonthlyCuotas = monthlyCuotas(profile, cfg);
  const ssAnnualCuotaCents = annualCuotaPaid(profile, cfg);
  const reg = regularizacion(profile, rendimientoNetoCents, cfg);

  const takeHomeCents = rendimientoNetoCents - irpf.totalCuotaCents;

  return {
    cfg,
    profile,
    allExpenses,
    cuotaRows,
    income,
    expenses,
    rendimientoNetoCents,
    irpf,
    modelo303,
    modelo130,
    modelo130Required: req,
    ssMonthlyCuotas,
    ssAnnualCuotaCents,
    regularizacion: reg,
    takeHomeCents,
    foralUnsupported,
  };
}

export interface SetAsideBreakdown {
  asOfMonth: number;
  /** IVA to provision for the current open quarter (cents). */
  ivaCents: Cents;
  /** IRPF to provision: projected annual, pro-rated by income so far, net of 130 + retención. */
  irpfCents: Cents;
  /** SS regularización to provision progressively (cents). */
  ssRegularizacionCents: Cents;
  /** Total recommended set-aside (cents). */
  totalCents: Cents;
  /** Set-aside as a percentage of income recognised so far. */
  pctOfIncome: number;
  /** Income base recognised year-to-date (cents). */
  incomeYtdCents: Cents;
}

/**
 * The headline output: how much cash to set aside as of `asOfMonth`, covering the
 * not-yet-paid liabilities attributable to income earned so far this year.
 *
 * Takes raw inputs (not a YearComputation) because it needs both a year-to-date
 * slice and the full-year projection.
 *
 * Provisioning style: 'exact' (default), 'conservative' (round up ~5%), or
 * 'custom' (a flat percentage of YTD income).
 */
export function monthlySetAside(
  invoices: Invoice[],
  userExpenses: Expense[],
  profile: YearProfile,
  cfg: TaxConfig,
  asOfMonth: number,
  provisioning: ProvisioningSettings = { style: 'exact' },
): SetAsideBreakdown {
  const ytd = computeYear(invoices, userExpenses, profile, cfg, asOfMonth);

  // Custom style short-circuits to a flat percentage of YTD income.
  if (provisioning.style === 'custom' && provisioning.customPct != null) {
    const total = pctOfCents(ytd.income.baseCents, provisioning.customPct);
    return {
      asOfMonth,
      ivaCents: 0,
      irpfCents: 0,
      ssRegularizacionCents: 0,
      totalCents: total,
      pctOfIncome: ytd.income.baseCents > 0 ? provisioning.customPct : 0,
      incomeYtdCents: ytd.income.baseCents,
    };
  }

  // --- IVA: result accrued in the current open quarter, to date. ---
  const currentQuarter = quarterOfMonth(asOfMonth);
  const ivaCents = floorZero(ytd.modelo303[currentQuarter - 1].resultCents);

  // --- IRPF: projected annual, pro-rated by income recognised so far, net of
  //     130 payments and retención already made this year. ---
  const projection = computeYear(invoices, userExpenses, profile, cfg, 12);
  const annualIrpf = projection.irpf.totalCuotaCents;
  const incomeShare =
    projection.income.baseCents > 0 ? ytd.income.baseCents / projection.income.baseCents : 0;
  const irpfProrated = roundCents(annualIrpf * incomeShare);
  // A quarter's Modelo 130 is paid in the FOLLOWING quarter, so only quarters
  // strictly before the current one have actually been handed to Hacienda. The
  // current quarter's 130 is still a not-yet-paid liability inside the set-aside.
  const paid130 = ytd.modelo130
    .slice(0, Math.max(0, currentQuarter - 1))
    .reduce((a, q) => a + q.dueCents, 0);
  const irpfCents = floorZero(irpfProrated - paid130 - ytd.income.retencionCents);

  // --- SS regularización: provision progressively if the chosen tramo is too low. ---
  const reg = projection.regularizacion;
  const ssRegularizacionCents =
    reg.differenceCents > 0 ? roundCents(reg.differenceCents * (asOfMonth / 12)) : 0;

  let total = ivaCents + irpfCents + ssRegularizacionCents;
  if (provisioning.style === 'conservative') {
    total = roundCents(total * 1.05);
  }

  const pctOfIncome = ytd.income.baseCents > 0 ? (total / ytd.income.baseCents) * 100 : 0;

  return {
    asOfMonth,
    ivaCents,
    irpfCents,
    ssRegularizacionCents,
    totalCents: total,
    pctOfIncome,
    incomeYtdCents: ytd.income.baseCents,
  };
}
