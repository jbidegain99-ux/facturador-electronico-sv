export type TipoDte = '01' | '03' | '05' | '06' | '07' | '14';
export type Ambiente = '00' | '01';
export type TipoModelo = 1 | 2;
export type TipoOperacion = 1 | 2;
export type TipoContingencia = 1 | 2 | 3 | 4 | 5 | null;
export type CondicionOperacion = 1 | 2 | 3;
export type TipoItem = 1 | 2 | 3 | 4;
export interface Direccion {
    departamento: string;
    municipio: string;
    complemento: string;
}
export interface Identificacion {
    version: number;
    ambiente: Ambiente;
    tipoDte: TipoDte;
    numeroControl: string;
    codigoGeneracion: string;
    tipoModelo: TipoModelo;
    tipoOperacion: TipoOperacion;
    tipoContingencia: TipoContingencia;
    motivoContin: string | null;
    fecEmi: string;
    horEmi: string;
    tipoMoneda: 'USD';
}
export interface DocumentoRelacionado {
    tipoDocumento: string;
    tipoGeneracion: 1 | 2;
    numeroDocumento: string;
    fechaEmision: string;
}
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
export interface VentaTercero {
    nit: string;
    nombre: string;
}
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
export interface TributoResumen {
    codigo: string;
    descripcion: string;
    valor: number;
}
export interface Pago {
    codigo: string;
    montoPago: number;
    referencia: string | null;
    plazo: string | null;
    periodo: number | null;
}
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
export interface Extension {
    nombEntrega: string | null;
    docuEntrega: string | null;
    nombRecibe: string | null;
    docuRecibe: string | null;
    observaciones: string | null;
    placaVehiculo?: string | null;
}
export interface Apendice {
    campo: string;
    etiqueta: string;
    valor: string;
}
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
export interface NotaDebito {
    identificacion: Identificacion;
    documentoRelacionado: DocumentoRelacionado[];
    emisor: Omit<Emisor, 'codEstableMH' | 'codEstable' | 'codPuntoVentaMH' | 'codPuntoVenta'>;
    receptor: ReceptorCCF;
    ventaTercero: VentaTercero | null;
    cuerpoDocumento: CuerpoDocumentoNotaCredito[];
    resumen: ResumenNotaCredito & {
        numPagoElectronico: string | null;
    };
    extension: Omit<Extension, 'placaVehiculo'> | null;
    apendice: Apendice[] | null;
}
export type DTE = FacturaElectronica | ComprobanteCreditoFiscal | NotaCredito | NotaDebito;
export declare const DTE_VERSIONS: Record<TipoDte, number>;
//# sourceMappingURL=dte.types.d.ts.map