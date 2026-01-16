export interface Direccion {
  departamento: string;
  municipio: string;
  complemento: string;
}

export interface Emisor {
  nit: string;
  nrc: string;
  nombre: string;
  codActividad: string;
  descActividad: string;
  nombreComercial: string | null;
  tipoEstablecimiento: string;
  direccion: Direccion;
  telefono: string;
  correo: string;
}

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

export interface ReceptorFC {
  tipoDocumento: string | null;
  numDocumento: string | null;
  nrc: string | null;
  nombre: string | null;
  codActividad: string | null;
  descActividad: string | null;
  direccion: Direccion | null;
  telefono: string | null;
  correo: string | null;
}

export interface CuerpoDocumentoItem {
  numItem: number;
  tipoItem: number;
  cantidad: number;
  codigo: string | null;
  uniMedida: number;
  descripcion: string;
  precioUni: number;
  montoDescu: number;
  ventaNoSuj: number;
  ventaExenta: number;
  ventaGravada: number;
  tributos: string[] | null;
  psv?: number;
  noGravado?: number;
  ivaItem?: number;
}

export interface ResumenTributo {
  codigo: string;
  descripcion: string;
  valor: number;
}

export interface PagoItem {
  codigo: string;
  montoPago: number;
  referencia: string | null;
  plazo: string | null;
  periodo: number | null;
}

export interface Resumen {
  totalNoSuj: number;
  totalExenta: number;
  totalGravada: number;
  subTotalVentas: number;
  descuNoSuj: number;
  descuExenta: number;
  descuGravada: number;
  porcentajeDescuento?: number;
  totalDescu: number;
  tributos: ResumenTributo[] | null;
  subTotal: number;
  ivaRete1?: number;
  reteRenta?: number;
  montoTotalOperacion: number;
  totalNoGravado?: number;
  totalPagar?: number;
  totalLetras: string;
  totalIva?: number;
  saldoFavor?: number;
  condicionOperacion: number;
  pagos?: PagoItem[] | null;
  numPagoElectronico?: string | null;
}

export interface Extension {
  nombEntrega: string | null;
  docuEntrega: string | null;
  nombRecibe: string | null;
  docuRecibe: string | null;
  observaciones: string | null;
}

export interface Apendice {
  campo: string;
  etiqueta: string;
  valor: string;
}

export interface Identificacion {
  version: number;
  ambiente: string;
  tipoDte: string;
  numeroControl: string;
  codigoGeneracion: string;
  tipoModelo: number;
  tipoOperacion: number;
  tipoContingencia: number | null;
  motivoContin: string | null;
  fecEmi: string;
  horEmi: string;
  tipoMoneda: string;
}

export interface DocumentoRelacionado {
  tipoDocumento: string;
  tipoGeneracion: number;
  numeroDocumento: string;
  fechaEmision: string;
}

export type TipoDTE = '01' | '03' | '05' | '06';

export interface DTEBase {
  identificacion: Identificacion;
  emisor: Emisor;
  cuerpoDocumento: CuerpoDocumentoItem[];
  resumen: Resumen;
  extension: Extension | null;
  apendice: Apendice[] | null;
}

export interface FacturaConsumidorFinal extends DTEBase {
  receptor: ReceptorFC | null;
}

export interface ComprobanteCreditoFiscal extends DTEBase {
  receptor: ReceptorCCF;
}

export interface NotaCredito extends DTEBase {
  documentoRelacionado: DocumentoRelacionado[];
  receptor: ReceptorCCF;
  ventaTercero: { nit: string; nombre: string } | null;
}

export interface NotaDebito extends DTEBase {
  documentoRelacionado: DocumentoRelacionado[];
  receptor: ReceptorCCF;
  ventaTercero: { nit: string; nombre: string } | null;
}
