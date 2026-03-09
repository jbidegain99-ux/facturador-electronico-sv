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

export const DEFAULT_MAPPINGS: DefaultMapping[] = [
  {
    operation: 'VENTA_CONTADO',
    description: 'Venta al contado (Factura consumidor final)',
    debitCode: '110101',
    creditCode: '4101',
    mappingConfig: {
      debe: [
        { cuenta: '110101', monto: 'total', descripcion: 'Caja General' },
      ],
      haber: [
        { cuenta: '4101', monto: 'subtotal', descripcion: 'Ventas' },
        { cuenta: '210201', monto: 'iva', descripcion: 'IVA Débito Fiscal' },
      ],
    },
  },
  {
    operation: 'VENTA_CREDITO',
    description: 'Venta al crédito (Factura consumidor final)',
    debitCode: '110301',
    creditCode: '4101',
    mappingConfig: {
      debe: [
        { cuenta: '110301', monto: 'total', descripcion: 'Clientes Locales' },
      ],
      haber: [
        { cuenta: '4101', monto: 'subtotal', descripcion: 'Ventas' },
        { cuenta: '210201', monto: 'iva', descripcion: 'IVA Débito Fiscal' },
      ],
    },
  },
  {
    operation: 'CREDITO_FISCAL',
    description: 'Crédito Fiscal',
    debitCode: '110301',
    creditCode: '4101',
    mappingConfig: {
      debe: [
        { cuenta: '110301', monto: 'total', descripcion: 'Clientes Locales' },
      ],
      haber: [
        { cuenta: '4101', monto: 'subtotal', descripcion: 'Ventas' },
        { cuenta: '210201', monto: 'iva', descripcion: 'IVA Débito Fiscal' },
      ],
    },
  },
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
  {
    operation: 'NOTA_DEBITO',
    description: 'Nota de Débito',
    debitCode: '110301',
    creditCode: '4101',
    mappingConfig: {
      debe: [
        { cuenta: '110301', monto: 'total', descripcion: 'Clientes Locales' },
      ],
      haber: [
        { cuenta: '4101', monto: 'subtotal', descripcion: 'Ventas' },
        { cuenta: '210201', monto: 'iva', descripcion: 'IVA Débito Fiscal' },
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
