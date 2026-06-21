import { describe, it, expect } from 'vitest';
import { computeIrpf, minimoPersonalYFamiliar, type IrpfInput } from './irpf';
import { TAX_CONFIG_2026 } from './taxConfig.2026';
import { eurToCents } from './money';
import type { PersonalCircumstances } from './types';

const cfg = TAX_CONFIG_2026;
const single: PersonalCircumstances = {
  children: 0,
  childrenUnder3: 0,
  over65: false,
  over75: false,
  disabilityPct: 0,
};

const base = (over: Partial<IrpfInput> = {}): IrpfInput => ({
  rendimientoNetoPrevioCents: eurToCents(40000),
  comunidadId: 'madrid',
  personal: single,
  estimacionDirecta: 'simplificada',
  ...over,
});

describe('minimoPersonalYFamiliar', () => {
  it('single taxpayer → 5.550 €', () => {
    expect(minimoPersonalYFamiliar(single, cfg)).toBe(5550);
  });

  it('two children, one under 3 → 5550 + 2400 + 2700 + 2800', () => {
    const p: PersonalCircumstances = { ...single, children: 2, childrenUnder3: 1 };
    expect(minimoPersonalYFamiliar(p, cfg)).toBe(5550 + 2400 + 2700 + 2800);
  });

  it('disability ≥65% adds 9.000 €', () => {
    expect(minimoPersonalYFamiliar({ ...single, disabilityPct: 65 }, cfg)).toBe(5550 + 9000);
  });
});

describe('gastos de difícil justificación', () => {
  it('5% below the cap is applied in full', () => {
    // 20.000 → 5% = 1.000 (< 2.000 cap)
    const r = computeIrpf(base({ rendimientoNetoPrevioCents: eurToCents(20000) }), cfg);
    expect(r.dificilJustificacionCents).toBe(eurToCents(1000));
    expect(r.baseLiquidableCents).toBe(eurToCents(19000));
  });

  it('5% above the cap is capped at 2.000 €', () => {
    // 50.000 → 5% = 2.500 → capped 2.000
    const r = computeIrpf(base({ rendimientoNetoPrevioCents: eurToCents(50000) }), cfg);
    expect(r.dificilJustificacionCents).toBe(eurToCents(2000));
    expect(r.baseLiquidableCents).toBe(eurToCents(48000));
  });

  it('estimación directa normal does not apply it', () => {
    const r = computeIrpf(base({ estimacionDirecta: 'normal' }), cfg);
    expect(r.dificilJustificacionCents).toBe(0);
  });
});

describe('Madrid vs Illes Balears (acceptance case 3)', () => {
  // Same income, both communities. IRPF must differ, and both must differ from
  // a naive combined-scale shortcut. This proves the state+autonomic split is real.
  const income = eurToCents(40000);
  const mad = computeIrpf(base({ comunidadId: 'madrid', rendimientoNetoPrevioCents: income }), cfg);
  const bal = computeIrpf(base({ comunidadId: 'baleares', rendimientoNetoPrevioCents: income }), cfg);

  it('annual IRPF differs between Madrid and Balears', () => {
    expect(mad.totalCuotaCents).not.toBe(bal.totalCuotaCents);
  });

  it('Madrid is the lower-tax community here', () => {
    expect(mad.totalCuotaCents).toBeLessThan(bal.totalCuotaCents);
  });

  it('the state half is identical (only the autonomic half differs)', () => {
    expect(mad.stateCuotaCents).toBe(bal.stateCuotaCents);
    expect(mad.autonomicCuotaCents).not.toBe(bal.autonomicCuotaCents);
  });

  it('effective rate is sane (between 10% and 25%)', () => {
    expect(mad.effectiveRatePct).toBeGreaterThan(10);
    expect(mad.effectiveRatePct).toBeLessThan(25);
  });
});

describe('foral / unsupported comunidad', () => {
  it('throws for a region with no scale', () => {
    expect(() => computeIrpf(base({ comunidadId: 'pais_vasco' }), cfg)).toThrow();
  });
});
