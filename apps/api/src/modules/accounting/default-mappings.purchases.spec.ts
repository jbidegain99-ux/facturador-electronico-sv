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

  it('has AJUSTE_ROBO mapping (debe 5104 / haber 110401)', () => {
    const m = DEFAULT_MAPPINGS.find((x) => x.operation === 'AJUSTE_ROBO');
    expect(m).toBeDefined();
    expect(m?.debitCode).toBe('5104');
    expect(m?.creditCode).toBe('110401');
  });

  it('has AJUSTE_MERMA mapping (debe 5105 / haber 110401)', () => {
    const m = DEFAULT_MAPPINGS.find((x) => x.operation === 'AJUSTE_MERMA');
    expect(m).toBeDefined();
    expect(m?.debitCode).toBe('5105');
    expect(m?.creditCode).toBe('110401');
  });

  it('has AJUSTE_DONACION mapping (debe 5106 / haber 110401)', () => {
    const m = DEFAULT_MAPPINGS.find((x) => x.operation === 'AJUSTE_DONACION');
    expect(m).toBeDefined();
    expect(m?.debitCode).toBe('5106');
    expect(m?.creditCode).toBe('110401');
  });

  it('has AJUSTE_AUTOCONSUMO mapping (debe 5107 / haber 110401)', () => {
    const m = DEFAULT_MAPPINGS.find((x) => x.operation === 'AJUSTE_AUTOCONSUMO');
    expect(m).toBeDefined();
    expect(m?.debitCode).toBe('5107');
    expect(m?.creditCode).toBe('110401');
  });
});
