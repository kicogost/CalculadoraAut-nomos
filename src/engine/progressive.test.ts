import { describe, it, expect } from 'vitest';
import { applyScale, marginalRate } from './progressive';
import { TAX_CONFIG_2026 } from './taxConfig.2026';
import { eurToCents } from './money';

const state = TAX_CONFIG_2026.irpf.stateScale;
const madrid = TAX_CONFIG_2026.irpf.autonomicScales.madrid;

describe('applyScale (hand-worked anchors)', () => {
  it('zero or negative base → 0', () => {
    expect(applyScale(0, state)).toBe(0);
    expect(applyScale(-1000, state)).toBe(0);
  });

  it('state scale on 30.000 € = 3.582,75 €', () => {
    // 12450*9.5% + 7750*12% + 9800*15% = 1182.75 + 930 + 1470 = 3582.75
    expect(applyScale(eurToCents(30000), state)).toBe(eurToCents(3582.75));
  });

  it('state scale on first-bracket amount uses the first rate only', () => {
    // 5550 * 9.5% = 527.25
    expect(applyScale(eurToCents(5550), state)).toBe(eurToCents(527.25));
  });

  it('Madrid scale on 30.000 € = 3.146,93 €', () => {
    // 13362.22*8.5% + 5642.41*10.7% + 10995.37*12.8%
    // = 1135.7887 + 603.73787 + 1407.40736 = 3146.93393 → 3146.93
    expect(applyScale(eurToCents(30000), madrid)).toBe(eurToCents(3146.93));
  });
});

describe('marginalRate', () => {
  it('returns the bracket rate for the next euro', () => {
    expect(marginalRate(eurToCents(10000), state)).toBe(9.5);
    expect(marginalRate(eurToCents(30000), state)).toBe(15.0);
    expect(marginalRate(eurToCents(500000), state)).toBe(24.5);
  });
});
