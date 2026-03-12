// Tipos DTE basados en JSON Schemas oficiales del MH El Salvador

// Tipos de DTE
export type TipoDte = '01' | '03' | '04' | '05' | '06' | '07' | '09' | '11' | '14';
export type Ambiente = '00' | '01'; // 00=Pruebas, 01=Produccion
export type TipoModelo = 1 | 2; // 1=Normal, 2=Contingencia
export type TipoOperacion = 1 | 2; // 1=Normal, 2=Contingencia
export type TipoContingencia = 1 | 2 | 3 | 4 | 5 | null;
export type CondicionOperacion = 1 | 2 | 3; // 1=Contado, 2=Credito, 3=Otro
export type TipoItem = 1 | 2 | 3 | 4; // 1=Bienes, 2=Servicios, 3=Ambos, 4=Otros tributos

// Dirección
export interface Direccion {
  departamento: string; // 01-14
  municipio: string; // 01-XX según depto
  complemento: string;
}

// Identificación del DTE
export interface Identificacion {
  version: number;
  ambiente: Ambiente;
  tipoDte: TipoDte;
  numeroControl: string; // DTE-XX-MMMMMMMM-NNNNNNNNNNNNNNN (31 chars)
  codigoGeneracion: string; // UUID v4 (36 chars)
  tipoModelo: TipoModelo;
  tipoOperacion: TipoOperacion;
  tipoContingencia: TipoContingencia;
  motivoContin: string | null;
  fecEmi: string; // YYYY-MM-DD
  horEmi: string; // HH:mm:ss
  tipoMoneda: 'USD';
}

// Documento Relacionado
export interface DocumentoRelacionado {
  tipoDocumento: string;
  tipoGeneracion: 1 | 2; // 1=Fisico, 2=Electronico
  numeroDocumento: string;
  fechaEmision: string;
}

// Emisor
export interface Emisor {
  nit: string;
  nrc: string;
  nombre: string;
  codActividad: string;
  descActividad: string;
  nombreComercial: string | null;
  tipoEstablecimiento: '01' | '02' | '04' | '07' | '20';
  direccion: Direccion;
  telefono: string;
  correo: string;
  codEstableMH: string | null;
  codEstable: string | null;
  codPuntoVentaMH: string | null;
  codPuntoVenta: string | null;
}

// Receptor para Factura (01)
export interface ReceptorFactura {
  tipoDocumento: '36' | '13' | '02' | '03' | '37' | null;
  numDocumento: string | null;
  nrc: string | null;
  nombre: string | null;
  codActividad: string | null;
  descActividad: string | null;
  direccion: Direccion | null;
  telefono: string | null;
  correo: string | null;
}

// Receptor para CCF (03), NC (05), ND (06)
export interface ReceptorCCF {
  nit: string;
  nrc: string;
  nombre: string;
  codActividad: string;
  descActividad: string;
  nombreComercial: string | null;
  direccion: Direccion;
  telefono: string | null;
  correo: string;
}

// Otros Documentos
export interface Medico {
  nombre: string;
  nit: string | null;
  docIdentificacion: string | null;
  tipoServicio: number;
}

export interface OtroDocumento {
  codDocAsociado: 1 | 2 | 3 | 4;
  descDocumento: string | null;
  detalleDocumento: string | null;
  medico: Medico | null;
}

// Venta Tercero
export interface VentaTercero {
  nit: string;
  nombre: string;
}

// Item del Cuerpo Documento para Factura (01)
export interface CuerpoDocumentoFactura {
  numItem: number;
  tipoItem: TipoItem;
  numeroDocumento: string | null;
  cantidad: number;
  codigo: string | null;
  codTributo: string | null;
  uniMedida: number;
  descripcion: string;
  precioUni: number;
  montoDescu: number;
  ventaNoSuj: number;
  ventaExenta: number;
  ventaGravada: number;
  tributos: string[] | null;
  psv: number;
  noGravado: number;
  ivaItem: number;
}

// Item del Cuerpo Documento para CCF (03)
export interface CuerpoDocumentoCCF {
  numItem: number;
  tipoItem: TipoItem;
  numeroDocumento: string | null;
  cantidad: number;
  codigo: string | null;
  codTributo: string | null;
  uniMedida: number;
  descripcion: string;
  precioUni: number;
  montoDescu: number;
  ventaNoSuj: number;
  ventaExenta: number;
  ventaGravada: number;
  tributos: string[] | null;
  psv: number;
  noGravado: number;
}

// Item del Cuerpo Documento para NC/ND
export interface CuerpoDocumentoNotaCredito {
  numItem: number;
  tipoItem: TipoItem;
  numeroDocumento: string;
  cantidad: number;
  codigo: string | null;
  codTributo: string | null;
  uniMedida: number;
  descripcion: string | null;
  precioUni: number;
  montoDescu: number;
  ventaNoSuj: number;
  ventaExenta: number;
  ventaGravada: number;
  tributos: string[] | null;
}

// Tributo en Resumen
export interface TributoResumen {
  codigo: string;
  descripcion: string;
  valor: number;
}

// Pago
export interface Pago {
  codigo: string; // 01-14, 99
  montoPago: number;
  referencia: string | null;
  plazo: string | null; // 01-03
  periodo: number | null;
}

// Resumen para Factura (01)
export interface ResumenFactura {
  totalNoSuj: number;
  totalExenta: number;
  totalGravada: number;
  subTotalVentas: number;
  descuNoSuj: number;
  descuExenta: number;
  descuGravada: number;
  porcentajeDescuento: number;
  totalDescu: number;
  tributos: TributoResumen[] | null;
  subTotal: number;
  ivaRete1: number;
  reteRenta: number;
  montoTotalOperacion: number;
  totalNoGravado: number;
  totalPagar: number;
  totalLetras: string;
  totalIva: number;
  saldoFavor: number;
  condicionOperacion: CondicionOperacion;
  pagos: Pago[] | null;
  numPagoElectronico: string | null;
}

// Resumen para CCF (03)
export interface ResumenCCF {
  totalNoSuj: number;
  totalExenta: number;
  totalGravada: number;
  subTotalVentas: number;
  descuNoSuj: number;
  descuExenta: number;
  descuGravada: number;
  porcentajeDescuento: number;
  totalDescu: number;
  tributos: TributoResumen[] | null;
  subTotal: number;
  ivaPerci1: number;
  ivaRete1: number;
  reteRenta: number;
  montoTotalOperacion: number;
  totalNoGravado: number;
  totalPagar: number;
  totalLetras: string;
  saldoFavor: number;
  condicionOperacion: CondicionOperacion;
  pagos: Pago[] | null;
  numPagoElectronico: string | null;
}

// Resumen para NC/ND
export interface ResumenNotaCredito {
  totalNoSuj: number;
  totalExenta: number;
  totalGravada: number;
  subTotalVentas: number;
  descuNoSuj: number;
  descuExenta: number;
  descuGravada: number;
  totalDescu: number;
  tributos: TributoResumen[] | null;
  subTotal: number;
  ivaPerci1: number;
  ivaRete1: number;
  reteRenta: number;
  montoTotalOperacion: number;
  totalLetras: string;
  condicionOperacion: CondicionOperacion;
}

// Extension
export interface Extension {
  nombEntrega: string | null;
  docuEntrega: string | null;
  nombRecibe: string | null;
  docuRecibe: string | null;
  observaciones: string | null;
  placaVehiculo?: string | null;
}

// Apendice
export interface Apendice {
  campo: string;
  etiqueta: string;
  valor: string;
}

// DTE Factura Completo (01)
export interface FacturaElectronica {
  identificacion: Identificacion;
  documentoRelacionado: DocumentoRelacionado[] | null;
  emisor: Emisor;
  receptor: ReceptorFactura | null;
  otrosDocumentos: OtroDocumento[] | null;
  ventaTercero: VentaTercero | null;
  cuerpoDocumento: CuerpoDocumentoFactura[];
  resumen: ResumenFactura;
  extension: Extension | null;
  apendice: Apendice[] | null;
}

// DTE CCF Completo (03)
export interface ComprobanteCreditoFiscal {
  identificacion: Identificacion;
  documentoRelacionado: DocumentoRelacionado[] | null;
  emisor: Emisor;
  receptor: ReceptorCCF;
  otrosDocumentos: OtroDocumento[] | null;
  ventaTercero: VentaTercero | null;
  cuerpoDocumento: CuerpoDocumentoCCF[];
  resumen: ResumenCCF;
  extension: Extension | null;
  apendice: Apendice[] | null;
}

// DTE Nota de Credito (05)
export interface NotaCredito {
  identificacion: Identificacion;
  documentoRelacionado: DocumentoRelacionado[];
  emisor: Omit<Emisor, 'codEstableMH' | 'codEstable' | 'codPuntoVentaMH' | 'codPuntoVenta'>;
  receptor: ReceptorCCF;
  ventaTercero: VentaTercero | null;
  cuerpoDocumento: CuerpoDocumentoNotaCredito[];
  resumen: ResumenNotaCredito;
  extension: Omit<Extension, 'placaVehiculo'> | null;
  apendice: Apendice[] | null;
}

// DTE Nota de Debito (06)
export interface NotaDebito {
  identificacion: Identificacion;
  documentoRelacionado: DocumentoRelacionado[];
  emisor: Omit<Emisor, 'codEstableMH' | 'codEstable' | 'codPuntoVentaMH' | 'codPuntoVenta'>;
  receptor: ReceptorCCF;
  ventaTercero: VentaTercero | null;
  cuerpoDocumento: CuerpoDocumentoNotaCredito[];
  resumen: ResumenNotaCredito & { numPagoElectronico: string | null };
  extension: Omit<Extension, 'placaVehiculo'> | null;
  apendice: Apendice[] | null;
}

// Receptor para Comprobante de Retención (07) - same as CCF
export type ReceptorRetencion = ReceptorCCF;

// Item del Cuerpo Documento para Comprobante de Retención (07)
export interface CuerpoDocumentoRetencion {
  numItem: number;
  tipoDte: string; // tipo del DTE original retenido
  tipoDoc: number; // 1=Fisico, 2=Electronico
  numDocumento: string;
  fechaEmision: string;
  montoSujetoGrav: number;
  codigoRetencionMH: string; // Código retención MH (22=ISR, C4=IVA, etc.)
  ivaRetenido: number;
  descripcion: string;
}

// Resumen para Comprobante de Retención (07)
export interface ResumenRetencion {
  totalSujetoRetencion: number;
  totalIVAretenido: number;
  totalIVAretenidoLetras: string;
}

// DTE Comprobante de Retención (07)
export interface ComprobanteRetencion {
  identificacion: Identificacion;
  emisor: Omit<Emisor, 'codEstableMH' | 'codEstable' | 'codPuntoVentaMH' | 'codPuntoVenta'>;
  receptor: ReceptorRetencion;
  cuerpoDocumento: CuerpoDocumentoRetencion[];
  resumen: ResumenRetencion;
  extension: Omit<Extension, 'placaVehiculo'> | null;
  apendice: Apendice[] | null;
}

// Receptor para Factura de Sujeto Excluido (14) - persona natural sin NIT
export interface ReceptorSujetoExcluido {
  tipoDocumento: '36' | '13' | '02' | '03' | '37' | null;
  numDocumento: string | null;
  nombre: string;
  codActividad: string | null;
  descActividad: string | null;
  direccion: Direccion;
  telefono: string | null;
  correo: string;
}

// Item del Cuerpo Documento para Sujeto Excluido (14) - sin IVA
export interface CuerpoDocumentoSujetoExcluido {
  numItem: number;
  tipoItem: TipoItem;
  cantidad: number;
  codigo: string | null;
  uniMedida: number;
  descripcion: string;
  precioUni: number;
  montoDescu: number;
  compra: number; // monto total de compra (sin IVA)
}

// Resumen para Sujeto Excluido (14)
export interface ResumenSujetoExcluido {
  totalCompra: number;
  descu: number;
  totalDescu: number;
  subTotal: number;
  ivaRete1: number;
  reteRenta: number;
  totalPagar: number;
  totalLetras: string;
  condicionOperacion: CondicionOperacion;
  pagos: Pago[] | null;
  observaciones: string | null;
}

// DTE Factura de Sujeto Excluido (14)
export interface FacturaSujetoExcluido {
  identificacion: Identificacion;
  emisor: Emisor;
  sujetoExcluido: ReceptorSujetoExcluido;
  cuerpoDocumento: CuerpoDocumentoSujetoExcluido[];
  resumen: ResumenSujetoExcluido;
  apendice: Apendice[] | null;
}

// === Tipo 04: Nota de Remisión ===

// Receptor para Nota de Remisión (04) - includes bienTitulo
export interface ReceptorNotaRemision {
  tipoDocumento: '36' | '13' | '02' | '03' | '37';
  numDocumento: string;
  nrc: string | null;
  nombre: string;
  codActividad: string | null;
  descActividad: string | null;
  nombreComercial: string | null;
  direccion: Direccion;
  telefono: string | null;
  correo: string;
  bienTitulo: string; // 2-char code for type of goods being transferred
}

// Resumen para Nota de Remisión (04) - similar to CCF but no pagos
export interface ResumenNotaRemision {
  totalNoSuj: number;
  totalExenta: number;
  totalGravada: number;
  subTotalVentas: number;
  descuNoSuj: number;
  descuExenta: number;
  descuGravada: number;
  porcentajeDescuento: number | null;
  totalDescu: number;
  tributos: TributoResumen[] | null;
  subTotal: number;
  montoTotalOperacion: number;
  totalLetras: string;
}

// DTE Nota de Remisión (04)
export interface NotaRemision {
  identificacion: Identificacion;
  documentoRelacionado: DocumentoRelacionado[] | null;
  emisor: Emisor;
  receptor: ReceptorNotaRemision;
  ventaTercero: VentaTercero | null;
  cuerpoDocumento: CuerpoDocumentoNotaCredito[]; // same item structure as NC
  resumen: ResumenNotaRemision;
  extension: Extension | null;
  apendice: Apendice[] | null;
}

// === Tipo 09: Documento Contable de Liquidación ===

// Receptor for DCL (09) - includes establishment fields
export interface ReceptorLiquidacion {
  nit: string;
  nrc: string;
  nombre: string;
  codActividad: string;
  descActividad: string;
  nombreComercial: string | null;
  tipoEstablecimiento: '01' | '02' | '04' | '07' | '20';
  direccion: Direccion;
  telefono: string | null;
  correo: string;
  codigoMH: string | null;
  puntoVentaMH: string | null;
}

// Cuerpo Documento for DCL (09) - single object, not array
export interface CuerpoDocumentoLiquidacion {
  periodoLiquidacionFechaInicio: string; // YYYY-MM-DD
  periodoLiquidacionFechaFin: string; // YYYY-MM-DD
  codLiquidacion: string | null;
  cantidadDoc: number | null;
  valorOperaciones: number;
  montoSinPercepcion: number;
  descripSinPercepcion: string | null;
  subTotal: number;
  iva: number;
  montoSujetoPercepcion: number;
  ivaPercibido: number;
  comision: number;
  porcentComision: string | null;
  ivaComision: number;
  liquidoApagar: number;
  totalLetras: string;
  observaciones: string | null;
}

// Extension for DCL (09) - required, different from general Extension
export interface ExtensionLiquidacion {
  nombEntrega: string;
  docuEntrega: string;
  codEmpleado: string | null;
}

// Emisor for DCL (09) - includes MH establishment codes
export interface EmisorLiquidacion {
  nit: string;
  nrc: string;
  nombre: string;
  codActividad: string;
  descActividad: string;
  nombreComercial: string | null;
  tipoEstablecimiento: '01' | '02' | '04' | '07' | '20';
  direccion: Direccion;
  telefono: string;
  correo: string;
  codigoMH: string | null;
  codigo: string | null;
  puntoVentaMH: string | null;
  puntoVentaContri: string | null;
}

// DTE Documento Contable de Liquidación (09)
export interface DocumentoContableLiquidacion {
  identificacion: Omit<Identificacion, 'tipoContingencia' | 'motivoContin'>;
  emisor: EmisorLiquidacion;
  receptor: ReceptorLiquidacion;
  cuerpoDocumento: CuerpoDocumentoLiquidacion; // single object, not array
  extension: ExtensionLiquidacion;
  apendice: Apendice[] | null;
}

// === Tipo 11: Factura de Exportación ===

// Emisor for FEX (11) - includes export-specific fields
export interface EmisorExportacion extends Emisor {
  tipoItemExpor: 1 | 2 | 3; // 1=Bienes, 2=Servicios, 3=Ambos
  recintoFiscal: string | null; // required if tipoItemExpor != 2
  regimen: string | null; // export regime, required if tipoItemExpor != 2
}

// Receptor for FEX (11) - international buyer
export interface ReceptorExportacion {
  nombre: string;
  tipoDocumento: '36' | '13' | '02' | '03' | '37';
  numDocumento: string;
  nombreComercial: string | null;
  codPais: string; // 4-digit country code
  nombrePais: string;
  complemento: string; // international address
  tipoPersona: 1 | 2; // 1=Jurídica, 2=Natural
  descActividad: string;
  telefono: string | null;
  correo: string | null;
}

// Otros Documentos for FEX (11) - transport/logistics
export interface OtroDocumentoExportacion {
  codDocAsociado: 1 | 2 | 3 | 4;
  descDocumento: string | null;
  detalleDocumento: string | null;
  placaTrans: string | null;
  modoTransp: 1 | 2 | 3 | 4 | 5 | 6 | 7 | null;
  numConductor: string | null;
  nombreConductor: string | null;
}

// Item del Cuerpo Documento for FEX (11)
export interface CuerpoDocumentoExportacion {
  numItem: number;
  cantidad: number;
  codigo: string | null;
  uniMedida: number;
  descripcion: string;
  precioUni: number;
  montoDescu: number;
  ventaGravada: number;
  tributos: string[] | null; // e.g., ["C3"]
  noGravado: number;
}

// Resumen for FEX (11) - includes Incoterms, flete, seguro
export interface ResumenExportacion {
  totalGravada: number;
  descuento: number;
  porcentajeDescuento: number;
  totalDescu: number;
  seguro: number | null;
  flete: number | null;
  montoTotalOperacion: number;
  totalNoGravado: number;
  totalPagar: number;
  totalLetras: string;
  condicionOperacion: CondicionOperacion;
  pagos: Pago[] | null;
  codIncoterms: string | null;
  descIncoterms: string | null;
  numPagoElectronico: string | null;
  observaciones: string | null;
}

// DTE Factura de Exportación (11)
export interface FacturaExportacion {
  identificacion: Identificacion;
  emisor: EmisorExportacion;
  receptor: ReceptorExportacion | null;
  otrosDocumentos: OtroDocumentoExportacion[] | null;
  ventaTercero: VentaTercero | null;
  cuerpoDocumento: CuerpoDocumentoExportacion[];
  resumen: ResumenExportacion;
  apendice: Apendice[] | null;
}

// Union type para cualquier DTE
export type DTE = FacturaElectronica | ComprobanteCreditoFiscal | NotaCredito | NotaDebito | ComprobanteRetencion | FacturaSujetoExcluido | NotaRemision | DocumentoContableLiquidacion | FacturaExportacion;

// Versiones por tipo de DTE
export const DTE_VERSIONS: Record<TipoDte, number> = {
  '01': 1, // Factura
  '03': 3, // CCF
  '04': 3, // Nota de Remisión
  '05': 3, // Nota Credito
  '06': 3, // Nota Debito
  '07': 3, // Comprobante Retencion
  '09': 1, // Documento Contable Liquidación
  '11': 1, // Factura de Exportación
  '14': 1, // Factura Sujeto Excluido
};
