import { EL_SALVADOR_CHART_OF_ACCOUNTS } from './chart-of-accounts.data';

describe('Chart of Accounts — Purchases & Inventory (Fase 1.2)', () => {
  const codes = new Set(EL_SALVADOR_CHART_OF_ACCOUNTS.map((a) => a.code));
  const byCode = new Map(EL_SALVADOR_CHART_OF_ACCOUNTS.map((a) => [a.code, a]));

  // ============ Existentes (reusar) ============
  it('has inventario Mercadería (existing)', () => {
    expect(codes.has('110401')).toBe(true);
  });

  it('has IVA Crédito Fiscal (existing)', () => {
    expect(codes.has('110303')).toBe(true);
  });

  it('has Proveedores (existing) — reused for CxP', () => {
    expect(codes.has('210101')).toBe(true);
  });

  it('has IVA Retenido (existing) — reused for retención 1%', () => {
    expect(codes.has('210205')).toBe(true);
  });

  it('has Costo de Mercadería Vendida (existing) — reused for COGS', () => {
    const a = byCode.get('5101');
    expect(a).toBeDefined();
    expect(a!.allowsPosting).toBe(true);
  });

  // ============ Nuevas (agregar) ============
  it('has IVA Anticipo a Cuenta 2% (new 110306)', () => {
    const a = byCode.get('110306');
    expect(a).toBeDefined();
    expect(a!.accountType).toBe('ASSET');
    expect(a!.normalBalance).toBe('DEBIT');
    expect(a!.parentCode).toBe('1103');
    expect(a!.allowsPosting).toBe(true);
  });

  it('has Sobrantes de Inventario (new 4105)', () => {
    const a = byCode.get('4105');
    expect(a).toBeDefined();
    expect(a!.accountType).toBe('INCOME');
    expect(a!.normalBalance).toBe('CREDIT');
    expect(a!.parentCode).toBe('41');
    expect(a!.allowsPosting).toBe(true);
  });

  it('has Costo por Ajustes Físicos (new 5103)', () => {
    const a = byCode.get('5103');
    expect(a).toBeDefined();
    expect(a!.accountType).toBe('EXPENSE');
    expect(a!.normalBalance).toBe('DEBIT');
    expect(a!.parentCode).toBe('51');
    expect(a!.allowsPosting).toBe(true);
  });
});
