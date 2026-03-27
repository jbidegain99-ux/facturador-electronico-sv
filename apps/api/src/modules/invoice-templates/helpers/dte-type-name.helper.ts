const DTE_TYPE_NAMES: Record<string, string> = {
  '01': 'FACTURA ELECTRÓNICA',
  '03': 'COMPROBANTE DE CRÉDITO FISCAL',
  '04': 'NOTA DE REMISIÓN',
  '05': 'NOTA DE CRÉDITO',
  '06': 'NOTA DE DÉBITO',
  '07': 'COMPROBANTE DE RETENCIÓN',
  '08': 'COMPROBANTE DE LIQUIDACIÓN',
  '09': 'DOCUMENTO CONTABLE DE LIQUIDACIÓN',
  '11': 'FACTURA DE EXPORTACIÓN',
  '14': 'FACTURA DE SUJETO EXCLUIDO',
  '15': 'COMPROBANTE DE DONACIÓN',
};

export function dteTypeName(code: unknown): string {
  if (!code) return '';
  return DTE_TYPE_NAMES[String(code)] || `DTE ${code}`;
}
