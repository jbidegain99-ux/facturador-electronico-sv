// Tipos DTE basados en JSON Schemas oficiales del MH El Salvador

// Tipos de DTE
export type TipoDte = '01' | '03' | '05' | '06' | '07' | '14';
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

// Union type para cualquier DTE
export type DTE = FacturaElectronica | ComprobanteCreditoFiscal | NotaCredito | NotaDebito;

// Versiones por tipo de DTE
export const DTE_VERSIONS: Record<TipoDte, number> = {
  '01': 1, // Factura
  '03': 3, // CCF
  '05': 3, // Nota Credito
  '06': 3, // Nota Debito
  '07': 3, // Comprobante Retencion
  '14': 1, // Factura Sujeto Excluido
};
