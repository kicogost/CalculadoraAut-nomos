import type { SsStatus, TaxConfig, Tramo, YearProfile } from './types';
import { pctOfCents, type Cents } from './money';

/** Find the tramo a monthly net-income figure (cents) falls into. */
export function tramoForMonthlyNet(monthlyNetCents: Cents, cfg: TaxConfig): Tramo {
  const tramos = cfg.ss.tramos;
  for (const t of tramos) {
    const toCents = t.netToEurMonth === null ? Infinity : t.netToEurMonth * 100;
    if (monthlyNetCents <= toCents) return t;
  }
  return tramos[tramos.length - 1];
}

/** Suggest a tramo from projected ANNUAL net income (cents). */
export function suggestTramo(annualNetCents: Cents, cfg: TaxConfig): Tramo {
  return tramoForMonthlyNet(Math.max(0, Math.round(annualNetCents / 12)), cfg);
}

/** Monthly cuota (cents) for a given SS status. */
export function cuotaForStatus(status: SsStatus, cfg: TaxConfig): Cents {
  switch (status.kind) {
    case 'tarifa_plana_y1':
    case 'tarifa_plana_y2':
      // Use the with-MEI figure as the real monthly cost.
      return cfg.ss.tarifaPlanaWithMeiMonthlyCents;
    case 'tramo': {
      const tramo = cfg.ss.tramos.find((t) => t.tramo === status.tramo);
      const baseCents = status.baseCents || tramo?.baseMinCents || 0;
      return pctOfCents(baseCents, cfg.ss.combinedRatePct);
    }
  }
}

/**
 * Resolve the SS status in effect for each month (1..12), honouring mid-year
 * changes. Returns a 12-element array of statuses.
 */
export function monthlyStatuses(profile: YearProfile): SsStatus[] {
  const out: SsStatus[] = new Array(12).fill(profile.ssStatus);
  const changes = [...(profile.ssStatusChanges ?? [])].sort(
    (a, b) => a.fromMonth - b.fromMonth,
  );
  for (let month = 1; month <= 12; month++) {
    let status = profile.ssStatus;
    for (const ch of changes) {
      if (ch.fromMonth <= month) status = ch.status;
    }
    out[month - 1] = status;
  }
  return out;
}

/** Per-month cuotas (cents) for the whole year, honouring mid-year changes. */
export function monthlyCuotas(profile: YearProfile, cfg: TaxConfig): Cents[] {
  return monthlyStatuses(profile).map((s) => cuotaForStatus(s, cfg));
}

/** Total cuota actually paid across the year (cents). */
export function annualCuotaPaid(profile: YearProfile, cfg: TaxConfig): Cents {
  return monthlyCuotas(profile, cfg).reduce((a, b) => a + b, 0);
}

export interface RegularizacionResult {
  /** Cuotas actually paid this year (cents). */
  paidCents: Cents;
  /** Cuota implied by the real annual rendimientos (cents). */
  impliedCents: Cents;
  /** implied − paid. Positive = extra payment owed; negative = refund. */
  differenceCents: Cents;
  suggestedTramo: number;
  /** True if a tarifa plana Y2 month risks a prórroga clawback (real net ≥ SMI). */
  prorrogaClawbackRisk: boolean;
}

/**
 * Estimate the year-end Seguridad Social regularización: compare cuotas paid to
 * the cuota implied by the real annual rendimientos. Tarifa plana months keep
 * their reduced cuota (no regularización there beyond the prórroga clawback,
 * which is flagged separately).
 */
export function regularizacion(
  profile: YearProfile,
  realAnnualNetCents: Cents,
  cfg: TaxConfig,
): RegularizacionResult {
  const suggested = suggestTramo(realAnnualNetCents, cfg);
  const impliedTramoMonthly = pctOfCents(suggested.baseMinCents, cfg.ss.combinedRatePct);

  const statuses = monthlyStatuses(profile);
  const paid = monthlyCuotas(profile, cfg);

  let impliedCents = 0;
  let paidCents = 0;
  let prorrogaClawbackRisk = false;
  for (let i = 0; i < 12; i++) {
    paidCents += paid[i];
    const s = statuses[i];
    if (s.kind === 'tarifa_plana_y1' || s.kind === 'tarifa_plana_y2') {
      // Tarifa plana month: no income-based regularización of the reduced cuota.
      impliedCents += paid[i];
      if (s.kind === 'tarifa_plana_y2' && realAnnualNetCents >= cfg.ss.smiAnnualCents) {
        prorrogaClawbackRisk = true;
      }
    } else {
      impliedCents += impliedTramoMonthly;
    }
  }

  return {
    paidCents,
    impliedCents,
    differenceCents: impliedCents - paidCents,
    suggestedTramo: suggested.tramo,
    prorrogaClawbackRisk,
  };
}
