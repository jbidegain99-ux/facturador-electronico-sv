export interface DefaultMappingLine {
  cuenta: string;
  monto: 'total' | 'subtotal' | 'iva';
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
];
