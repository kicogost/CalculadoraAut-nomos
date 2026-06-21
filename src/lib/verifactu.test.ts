import { describe, it, expect } from 'vitest';
import {
  buildHuellaInputAlta,
  huellaAlta,
  buildQrUrl,
  centsToAmountString,
  isoToAeatDate,
  fechaHoraHusoGen,
  type RegistroAltaHuellaFields,
} from './verifactu';

// Official AEAT test vectors from "Detalle de las especificaciones técnicas para
// generación de la huella o hash de los registros de facturación" v0.1.2, §6.
const CASE1: RegistroAltaHuellaFields = {
  idEmisor: '89890001K',
  numSerie: '12345678/G33',
  fechaExpedicion: '01-01-2024',
  tipoFactura: 'F1',
  cuotaTotal: '12.35',
  importeTotal: '123.45',
  huellaAnterior: '',
  fechaHoraGen: '2024-01-01T19:20:30+01:00',
};
const CASE1_HASH = '3C464DAF61ACB827C65FDA19F352A4E3BDC2C640E9E9FC4CC058073F38F12F60';

const CASE2: RegistroAltaHuellaFields = {
  idEmisor: '89890001K',
  numSerie: '12345679/G34',
  fechaExpedicion: '01-01-2024',
  tipoFactura: 'F1',
  cuotaTotal: '12.35',
  importeTotal: '123.45',
  huellaAnterior: CASE1_HASH,
  fechaHoraGen: '2024-01-01T19:20:35+01:00',
};
const CASE2_HASH = 'F7B94CFD8924EDFF273501B01EE5153E4CE8F259766F88CF6ACB8935802A2B97';

describe('huella concatenation (AEAT spec §6)', () => {
  it('builds the exact input string for the first record', () => {
    expect(buildHuellaInputAlta(CASE1)).toBe(
      'IDEmisorFactura=89890001K&NumSerieFactura=12345678/G33&FechaExpedicionFactura=01-01-2024&TipoFactura=F1&CuotaTotal=12.35&ImporteTotal=123.45&Huella=&FechaHoraHusoGenRegistro=2024-01-01T19:20:30+01:00',
    );
  });
});

describe('huella hash matches the official AEAT test vectors', () => {
  it('Caso 1: first record', async () => {
    expect(await huellaAlta(CASE1)).toBe(CASE1_HASH);
  });
  it('Caso 2: chained second record', async () => {
    expect(await huellaAlta(CASE2)).toBe(CASE2_HASH);
  });
});

describe('QR url', () => {
  it('URL-encodes params (& → %26) and uses the production verifactu endpoint', () => {
    const url = buildQrUrl({ nif: '89890001K', numSerie: '12345678&G33', fecha: '01-01-2024', importe: '241.4' });
    expect(url).toBe(
      'https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR?nif=89890001K&numserie=12345678%26G33&fecha=01-01-2024&importe=241.4',
    );
  });
  it('uses the test endpoint and ValidarQRNoVerifactu when requested', () => {
    const url = buildQrUrl({ nif: 'X', numSerie: 'A1', fecha: '01-01-2026', importe: '10.00', verifactu: false, env: 'pruebas' });
    expect(url).toContain('https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQRNoVerifactu?');
  });
});

describe('formatting helpers', () => {
  it('cents → amount string', () => {
    expect(centsToAmountString(12345)).toBe('123.45');
    expect(centsToAmountString(12300)).toBe('123.00');
  });
  it('ISO date → AEAT date', () => {
    expect(isoToAeatDate('2024-01-01')).toBe('01-01-2024');
  });
  it('fechaHoraHusoGen has an offset', () => {
    expect(fechaHoraHusoGen(new Date(Date.UTC(2024, 0, 1, 12, 0, 0)))).toMatch(
      /^2024-01-01T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/,
    );
  });
});
