export interface DefaultMappingLine {
  cuenta: string;
  monto: 'total' | 'subtotal' | 'iva' | 'retention' | 'totalMinusRetention';
  descripcion: string;
}

export interface DefaultMappingConfig {
  debe: DefaultMappingLine[];
  haber: DefaultMappingLine[];
}

export interface DefaultMapping {
  operation: string;
  description: string;
  debitCode: string;
  creditCode: string;
  mappingConfig: DefaultMappingConfig;
}

// ----------------------------------------------------------------
// Reusable haber/debe line sets to eliminate repeated structures
// ----------------------------------------------------------------

const HABER_VENTAS_IVA: DefaultMappingLine[] = [
  { cuenta: '4101', monto: 'subtotal', descripcion: 'Ventas' },
  { cuenta: '210201', monto: 'iva', descripcion: 'IVA Débito Fiscal' },
];

const DEBE_CLIENTES_TOTAL: DefaultMappingLine[] = [
  { cuenta: '110301', monto: 'total', descripcion: 'Clientes Locales' },
];

const DEBE_CAJA_TOTAL: DefaultMappingLine[] = [
  { cuenta: '110101', monto: 'total', descripcion: 'Caja General' },
];

/** Helper to build a standard sale-type mapping (one debit account + Ventas/IVA haber). */
function buildSaleMapping(
  operation: string,
  description: string,
  debitCode: string,
  creditCode: string,
  debe: DefaultMappingLine[],
): DefaultMapping {
  return {
    operation,
    description,
    debitCode,
    creditCode,
    mappingConfig: { debe, haber: HABER_VENTAS_IVA },
  };
}

export const DEFAULT_MAPPINGS: DefaultMapping[] = [
  buildSaleMapping('VENTA_CONTADO', 'Venta al contado (Factura consumidor final)', '110101', '4101', DEBE_CAJA_TOTAL),
  buildSaleMapping('VENTA_CREDITO', 'Venta al crédito (Factura consumidor final)', '110301', '4101', DEBE_CLIENTES_TOTAL),
  buildSaleMapping('CREDITO_FISCAL', 'Crédito Fiscal', '110301', '4101', DEBE_CLIENTES_TOTAL),
  {
    operation: 'NOTA_CREDITO',
    description: 'Nota de Crédito',
    debitCode: '4101',
    creditCode: '110301',
    mappingConfig: {
      debe: [
        { cuenta: '4101', monto: 'subtotal', descripcion: 'Ventas (reversa)' },
        { cuenta: '210201', monto: 'iva', descripcion: 'IVA Débito Fiscal (reversa)' },
      ],
      haber: [
        { cuenta: '110301', monto: 'total', descripcion: 'Clientes Locales (reversa)' },
      ],
    },
  },
  buildSaleMapping('NOTA_DEBITO', 'Nota de Débito', '110301', '4101', DEBE_CLIENTES_TOTAL),
  {
    operation: 'RETENCION',
    description: 'Comprobante de Retención',
    debitCode: '210201',
    creditCode: '110101',
    mappingConfig: {
      debe: [
        { cuenta: '210201', monto: 'iva', descripcion: 'IVA Débito Fiscal (retenido)' },
      ],
      haber: [
        { cuenta: '110101', monto: 'iva', descripcion: 'Caja General (retención IVA)' },
      ],
    },
  },
  buildSaleMapping('NOTA_REMISION', 'Nota de Remisión (traslado de bienes)', '110301', '4101', DEBE_CLIENTES_TOTAL),
  buildSaleMapping('LIQUIDACION', 'Documento Contable de Liquidación', '110101', '4101', DEBE_CAJA_TOTAL),
  {
    operation: 'EXPORTACION',
    description: 'Factura de Exportación',
    debitCode: '110302',
    creditCode: '4102',
    mappingConfig: {
      debe: [
        { cuenta: '110302', monto: 'total', descripcion: 'Clientes Exterior' },
      ],
      haber: [
        { cuenta: '4102', monto: 'total', descripcion: 'Ventas Exportación' },
      ],
    },
  },
  {
    operation: 'SUJETO_EXCLUIDO',
    description: 'Factura Sujeto Excluido',
    debitCode: '110101',
    creditCode: '4101',
    mappingConfig: {
      debe: [
        { cuenta: '110101', monto: 'total', descripcion: 'Caja General' },
      ],
      haber: [
        { cuenta: '4101', monto: 'total', descripcion: 'Ventas' },
      ],
    },
  },

  // ============================================================
  // COMPRAS — módulo Compras + Inventario (Fase 1.2)
  // ============================================================
  {
    operation: 'COMPRA_CCFE',
    description: 'Compra con Crédito Fiscal (CCFE) — IVA separado, opcional retención 1%',
    debitCode: '110401',
    creditCode: '210101',
    mappingConfig: {
      debe: [
        { cuenta: '110401', monto: 'subtotal', descripcion: 'Inventario Mercadería' },
        { cuenta: '110303', monto: 'iva', descripcion: 'IVA Crédito Fiscal' },
      ],
      haber: [
        { cuenta: '210101', monto: 'totalMinusRetention', descripcion: 'Proveedores Locales' },
        { cuenta: '210205', monto: 'retention', descripcion: 'IVA Retenido por Pagar' },
      ],
    },
  },
  {
    operation: 'COMPRA_FCFE',
    description: 'Compra con Factura Consumidor Final (FCFE) — IVA capitalizado, opcional retención',
    debitCode: '110401',
    creditCode: '210101',
    mappingConfig: {
      debe: [
        { cuenta: '110401', monto: 'total', descripcion: 'Inventario (IVA capitalizado)' },
      ],
      haber: [
        { cuenta: '210101', monto: 'totalMinusRetention', descripcion: 'Proveedores Locales' },
        { cuenta: '210205', monto: 'retention', descripcion: 'IVA Retenido por Pagar' },
      ],
    },
  },
  {
    operation: 'COMPRA_FSEE',
    description: 'Compra a Sujeto Excluido (FSEE) — sin IVA, opcional retención',
    debitCode: '110401',
    creditCode: '210101',
    mappingConfig: {
      debe: [
        { cuenta: '110401', monto: 'total', descripcion: 'Inventario (sin IVA)' },
      ],
      haber: [
        { cuenta: '210101', monto: 'totalMinusRetention', descripcion: 'Proveedores Locales' },
        { cuenta: '210205', monto: 'retention', descripcion: 'IVA Retenido por Pagar' },
      ],
    },
  },
  {
    operation: 'SALIDA_VENTA_COGS',
    description: 'Salida de inventario por venta — carga a Costo de Venta',
    debitCode: '5101',
    creditCode: '110401',
    mappingConfig: {
      debe: [
        { cuenta: '5101', monto: 'total', descripcion: 'Costo de Mercadería Vendida' },
      ],
      haber: [
        { cuenta: '110401', monto: 'total', descripcion: 'Inventario Mercadería' },
      ],
    },
  },
  {
    operation: 'AJUSTE_FISICO_FALTANTE',
    description: 'Ajuste por faltante en toma física',
    debitCode: '5103',
    creditCode: '110401',
    mappingConfig: {
      debe: [
        { cuenta: '5103', monto: 'total', descripcion: 'Costo por Ajustes Físicos' },
      ],
      haber: [
        { cuenta: '110401', monto: 'total', descripcion: 'Inventario Mercadería' },
      ],
    },
  },
  {
    operation: 'AJUSTE_FISICO_SOBRANTE',
    description: 'Ajuste por sobrante en toma física',
    debitCode: '110401',
    creditCode: '4105',
    mappingConfig: {
      debe: [
        { cuenta: '110401', monto: 'total', descripcion: 'Inventario Mercadería' },
      ],
      haber: [
        { cuenta: '4105', monto: 'total', descripcion: 'Sobrantes de Inventario' },
      ],
    },
  },
  {
    operation: 'AJUSTE_ROBO',
    description: 'Ajuste por robo de inventario',
    debitCode: '5104',
    creditCode: '110401',
    mappingConfig: {
      debe: [{ cuenta: '5104', monto: 'total', descripcion: 'Pérdida por robo' }],
      haber: [{ cuenta: '110401', monto: 'total', descripcion: 'Inventario Mercadería' }],
    },
  },
  {
    operation: 'AJUSTE_MERMA',
    description: 'Ajuste por merma / deterioro',
    debitCode: '5105',
    creditCode: '110401',
    mappingConfig: {
      debe: [{ cuenta: '5105', monto: 'total', descripcion: 'Merma inventario' }],
      haber: [{ cuenta: '110401', monto: 'total', descripcion: 'Inventario Mercadería' }],
    },
  },
  {
    operation: 'AJUSTE_DONACION',
    description: 'Ajuste por donación de inventario',
    debitCode: '5106',
    creditCode: '110401',
    mappingConfig: {
      debe: [{ cuenta: '5106', monto: 'total', descripcion: 'Donaciones' }],
      haber: [{ cuenta: '110401', monto: 'total', descripcion: 'Inventario Mercadería' }],
    },
  },
  {
    operation: 'AJUSTE_AUTOCONSUMO',
    description: 'Ajuste por autoconsumo',
    debitCode: '5107',
    creditCode: '110401',
    mappingConfig: {
      debe: [{ cuenta: '5107', monto: 'total', descripcion: 'Gasto autoconsumo' }],
      haber: [{ cuenta: '110401', monto: 'total', descripcion: 'Inventario Mercadería' }],
    },
  },
  // NOTE: This reversal does NOT reverse the IVA Crédito Fiscal (110303) portion
  // for CCFE returns. Adding the IVA leg requires extending `DefaultMappingLine.monto`
  // enum with `'retention'` or a new `'iva_reverse'` value — deferred to Fase 1.6
  // (Spec §8 O5). For now this handles the principal amount only.
  {
    operation: 'DEVOLUCION_COMPRA',
    description: 'Devolución de compra a proveedor',
    debitCode: '210101',
    creditCode: '110401',
    mappingConfig: {
      debe: [
        { cuenta: '210101', monto: 'total', descripcion: 'Proveedores Locales (reversa)' },
      ],
      haber: [
        { cuenta: '110401', monto: 'total', descripcion: 'Inventario Mercadería (reversa)' },
      ],
    },
  },
];
