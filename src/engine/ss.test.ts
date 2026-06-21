import { describe, it, expect } from 'vitest';
import {
  cuotaForStatus,
  monthlyCuotas,
  regularizacion,
  suggestTramo,
  tramoForMonthlyNet,
} from './ss';
import { TAX_CONFIG_2026 } from './taxConfig.2026';
import { eurToCents } from './money';
import type { YearProfile } from './types';

const cfg = TAX_CONFIG_2026;

const baseProfile = (over: Partial<YearProfile> = {}): YearProfile => ({
  year: 2026,
  comunidadAutonoma: 'madrid',
  ssStatus: { kind: 'tramo', tramo: 1, baseCents: cfg.ss.tramos[0].baseMinCents },
  recognitionBasis: 'devengo',
  estimacionDirecta: 'simplificada',
  personal: { children: 0, childrenUnder3: 0, over65: false, over75: false, disabilityPct: 0 },
  ...over,
});

describe('tramo selection', () => {
  it('monthly net 2.000 € → tramo 8', () => {
    expect(tramoForMonthlyNet(eurToCents(2000), cfg).tramo).toBe(8);
  });
  it('annual net 24.000 € (2.000/mes) → tramo 8', () => {
    expect(suggestTramo(eurToCents(24000), cfg).tramo).toBe(8);
  });
  it('very low income → tramo 1', () => {
    expect(suggestTramo(eurToCents(3000), cfg).tramo).toBe(1);
  });
});

describe('cuota for status', () => {
  it('tarifa plana = with-MEI figure (88,64 €)', () => {
    expect(cuotaForStatus({ kind: 'tarifa_plana_y1' }, cfg)).toBe(eurToCents(88.64));
  });
  it('tramo 8 cuota = base 1.209,15 × 31,5% = 380,88 €', () => {
    const status = { kind: 'tramo' as const, tramo: 8, baseCents: eurToCents(1209.15) };
    expect(cuotaForStatus(status, cfg)).toBe(eurToCents(380.88));
  });
});

describe('mid-year status change (acceptance case 4)', () => {
  const profile = baseProfile({
    ssStatus: { kind: 'tarifa_plana_y1' },
    ssStatusChanges: [{ fromMonth: 7, status: { kind: 'tramo', tramo: 4, baseCents: eurToCents(950.98) } }],
  });
  const cuotas = monthlyCuotas(profile, cfg);

  it('first half is tarifa plana, second half is the tramo cuota', () => {
    expect(cuotas.slice(0, 6)).toEqual(Array(6).fill(eurToCents(88.64)));
    expect(cuotas.slice(6)).toEqual(Array(6).fill(eurToCents(299.56)));
  });

  it('annual total blends both', () => {
    const total = cuotas.reduce((a, b) => a + b, 0);
    expect(total).toBe(6 * eurToCents(88.64) + 6 * eurToCents(299.56));
  });
});

describe('regularización (acceptance case 5)', () => {
  it('a too-low tramo for real income → extra payment owed', () => {
    const profile = baseProfile(); // tramo 1 all year
    const realAnnualNet = eurToCents(36000); // 3.000/mes → tramo 11
    const reg = regularizacion(profile, realAnnualNet, cfg);
    expect(reg.suggestedTramo).toBe(11);
    expect(reg.differenceCents).toBeGreaterThan(0);
  });

  it('tarifa plana Y2 with net ≥ SMI flags a prórroga clawback risk', () => {
    const profile = baseProfile({ ssStatus: { kind: 'tarifa_plana_y2' } });
    const reg = regularizacion(profile, cfg.ss.smiAnnualCents + 100, cfg);
    expect(reg.prorrogaClawbackRisk).toBe(true);
  });
});
