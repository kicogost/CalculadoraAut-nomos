import { describe, it, expect } from 'vitest';
import { isEuCountry, placeOfSupplyForCountry } from './countries';

describe('country → place of supply', () => {
  it('Spain → domestic', () => {
    expect(placeOfSupplyForCountry('España')).toBe('domestic_es');
  });
  it('EU country → reverse charge (eu_b2b)', () => {
    expect(placeOfSupplyForCountry('Francia')).toBe('eu_b2b');
    expect(placeOfSupplyForCountry('Alemania')).toBe('eu_b2b');
  });
  it('non-EU → export (non_eu_export)', () => {
    expect(placeOfSupplyForCountry('Estados Unidos')).toBe('non_eu_export');
    expect(placeOfSupplyForCountry('Reino Unido')).toBe('non_eu_export');
    expect(placeOfSupplyForCountry('Suiza')).toBe('non_eu_export');
  });
  it('isEuCountry', () => {
    expect(isEuCountry('España')).toBe(true);
    expect(isEuCountry('Italia')).toBe(true);
    expect(isEuCountry('Estados Unidos')).toBe(false);
  });
});
