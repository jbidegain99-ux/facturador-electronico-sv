import { DEFAULT_MAPPINGS } from './default-mappings.data';

describe('Default Mappings — Purchases (Fase 1.2)', () => {
  const ops = new Set(DEFAULT_MAPPINGS.map((m) => m.operation));

  it('has COMPRA_CCFE mapping', () => {
    expect(ops.has('COMPRA_CCFE')).toBe(true);
  });

  it('has COMPRA_FCFE mapping', () => {
    expect(ops.has('COMPRA_FCFE')).toBe(true);
  });

  it('has COMPRA_FSEE mapping', () => {
    expect(ops.has('COMPRA_FSEE')).toBe(true);
  });

  it('has SALIDA_VENTA_COGS mapping (COGS on sale)', () => {
    expect(ops.has('SALIDA_VENTA_COGS')).toBe(true);
  });

  it('has AJUSTE_FISICO_FALTANTE mapping', () => {
    expect(ops.has('AJUSTE_FISICO_FALTANTE')).toBe(true);
  });

  it('has AJUSTE_FISICO_SOBRANTE mapping', () => {
    expect(ops.has('AJUSTE_FISICO_SOBRANTE')).toBe(true);
  });

  it('has DEVOLUCION_COMPRA mapping', () => {
    expect(ops.has('DEVOLUCION_COMPRA')).toBe(true);
  });

  it('COMPRA_CCFE splits IVA to credit fiscal account', () => {
    const m = DEFAULT_MAPPINGS.find((x) => x.operation === 'COMPRA_CCFE')!;
    const hasIvaCreditoFiscal = m.mappingConfig.debe.some(
      (l) => l.cuenta === '110303' && l.monto === 'iva',
    );
    expect(hasIvaCreditoFiscal).toBe(true);
  });

  it('COMPRA_FCFE capitalizes IVA into inventory (uses total)', () => {
    const m = DEFAULT_MAPPINGS.find((x) => x.operation === 'COMPRA_FCFE')!;
    const singleDebitTotal =
      m.mappingConfig.debe.length === 1 &&
      m.mappingConfig.debe[0].cuenta === '110401' &&
      m.mappingConfig.debe[0].monto === 'total';
    expect(singleDebitTotal).toBe(true);
  });
});
