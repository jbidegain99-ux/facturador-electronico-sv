import {
  nitSchema,
  codigoGeneracionSchema,
  numeroControlSchema,
  fecEmiSchema,
  tipoDteSchema,
  baseIdentificacionSchema,
} from './base.zod';

describe('base Zod schemas', () => {
  it('nit accepts 14 digits', () => {
    expect(nitSchema.safeParse('06141507251041').success).toBe(true);
  });

  it('nit rejects hyphens', () => {
    expect(nitSchema.safeParse('0614-150725-104-1').success).toBe(false);
  });

  it('codigoGeneracion accepts uppercase UUID', () => {
    expect(
      codigoGeneracionSchema.safeParse('A1B2C3D4-E5F6-7890-ABCD-EF1234567890').success,
    ).toBe(true);
  });

  it('codigoGeneracion rejects lowercase', () => {
    expect(
      codigoGeneracionSchema.safeParse('a1b2c3d4-e5f6-7890-abcd-ef1234567890').success,
    ).toBe(false);
  });

  it('numeroControl accepts valid pattern', () => {
    expect(
      numeroControlSchema.safeParse('DTE-03-AB12CD34-000000000000001').success,
    ).toBe(true);
  });

  it('tipoDte accepts all 11 known codes and rejects unknown', () => {
    for (const t of ['01', '03', '04', '05', '06', '07', '08', '09', '11', '14', '15']) {
      expect(tipoDteSchema.safeParse(t).success).toBe(true);
    }
    expect(tipoDteSchema.safeParse('02').success).toBe(false);
    expect(tipoDteSchema.safeParse('10').success).toBe(false);
  });

  it('baseIdentificacionSchema accepts a minimal valid identificacion', () => {
    const result = baseIdentificacionSchema.safeParse({
      version: 3,
      ambiente: '00',
      tipoDte: '03',
      numeroControl: 'DTE-03-AB12CD34-000000000000001',
      codigoGeneracion: 'A1B2C3D4-E5F6-7890-ABCD-EF1234567890',
      tipoModelo: 1,
      tipoOperacion: 1,
      fecEmi: '2026-04-15',
      horEmi: '14:30:45',
      tipoMoneda: 'USD',
    });
    expect(result.success).toBe(true);
  });
});
