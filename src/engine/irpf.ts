import type { PersonalCircumstances, TaxConfig } from './types';
import { floorZero, roundCents, type Cents } from './money';
import { applyScale, marginalRate } from './progressive';

/**
 * Compute the total mínimo personal y familiar (in EUR) from the taxpayer's
 * circumstances. The mínimo is applied via the real "credit" mechanic, not a
 * flat base reduction — see computeIrpf.
 */
export function minimoPersonalYFamiliar(
  personal: PersonalCircumstances,
  cfg: TaxConfig,
): number {
  const m = cfg.irpf.minimums;
  let total = m.contribuyenteGeneral;
  if (personal.over65) total += m.contribuyenteOver65;
  if (personal.over75) total += m.contribuyenteOver75;

  // Descendants: each child gets the minimum for its ordinal (1st..4th+).
  for (let i = 0; i < personal.children; i++) {
    total += m.descendant[Math.min(i, m.descendant.length - 1)];
  }
  total += personal.childrenUnder3 * m.descendantUnder3Extra;

  if (personal.disabilityPct >= 65) total += m.disability65plus;
  else if (personal.disabilityPct >= 33) total += m.disability33to64;

  return total;
}

export interface IrpfResult {
  /** Taxable base after gastos de difícil justificación (cents). */
  baseLiquidableCents: Cents;
  /** Mínimo personal y familiar applied (cents). */
  minimoCents: Cents;
  /** Gastos de difícil justificación applied (cents). */
  dificilJustificacionCents: Cents;
  /** Total IRPF cuota (state + autonomic, net of mínimo), floored at zero. */
  totalCuotaCents: Cents;
  stateCuotaCents: Cents;
  autonomicCuotaCents: Cents;
  /** Average effective rate over the taxable base, as a percentage. */
  effectiveRatePct: number;
  /** Marginal rate (state + autonomic) on the next euro, as a percentage. */
  marginalRatePct: number;
}

export interface IrpfInput {
  /** Rendimiento neto previo = ingresos computables − gastos deducibles (cents). */
  rendimientoNetoPrevioCents: Cents;
  comunidadId: string;
  personal: PersonalCircumstances;
  estimacionDirecta: 'simplificada' | 'normal';
}

/**
 * Compute estimated annual IRPF using the real two-scale mechanic:
 *  - apply gastos de difícil justificación (simplificada only) to reach the base;
 *  - run the base through state and autonomic scales separately;
 *  - apply the mínimo as a quasi-credit (scale applied to the mínimo, subtracted),
 *    on BOTH the state and autonomic halves;
 *  - sum, floor at zero.
 *
 * Throws if the comunidad has no scale (e.g. a foral regime) — callers must guard.
 */
export function computeIrpf(input: IrpfInput, cfg: TaxConfig): IrpfResult {
  const autonomicScale = cfg.irpf.autonomicScales[input.comunidadId];
  if (!autonomicScale) {
    throw new Error(
      `No autonomic IRPF scale for "${input.comunidadId}" (foral or unsupported region)`,
    );
  }

  // Gastos de difícil justificación: 5% of positive rendimiento neto previo, capped.
  let dificil = 0;
  if (input.estimacionDirecta === 'simplificada' && input.rendimientoNetoPrevioCents > 0) {
    const raw = roundCents(
      (input.rendimientoNetoPrevioCents * cfg.irpf.dificilJustificacion.ratePct) / 100,
    );
    dificil = Math.min(raw, cfg.irpf.dificilJustificacion.capCents);
  }

  const baseCents = floorZero(input.rendimientoNetoPrevioCents - dificil);
  const minimoEur = minimoPersonalYFamiliar(input.personal, cfg);
  const minimoCents = roundCents(minimoEur * 100);

  // State half: tax(base) − tax(mínimo), each at the state scale.
  const stateGross = applyScale(baseCents, cfg.irpf.stateScale);
  const stateMinimo = applyScale(minimoCents, cfg.irpf.stateScale);
  const stateCuota = floorZero(stateGross - stateMinimo);

  // Autonomic half: same mechanic with the autonomic scale. v1 uses the state
  // baseline mínimo for the autonomic half too (documented simplification).
  const autGross = applyScale(baseCents, autonomicScale);
  const autMinimo = applyScale(minimoCents, autonomicScale);
  const autCuota = floorZero(autGross - autMinimo);

  const total = stateCuota + autCuota;
  const effectiveRatePct = baseCents > 0 ? (total / baseCents) * 100 : 0;
  const marginalRatePct =
    marginalRate(baseCents, cfg.irpf.stateScale) +
    marginalRate(baseCents, autonomicScale);

  return {
    baseLiquidableCents: baseCents,
    minimoCents,
    dificilJustificacionCents: dificil,
    totalCuotaCents: total,
    stateCuotaCents: stateCuota,
    autonomicCuotaCents: autCuota,
    effectiveRatePct,
    marginalRatePct,
  };
}
