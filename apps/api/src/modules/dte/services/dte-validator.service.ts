import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { TipoDte, DTE } from '@facturador/shared';

// Esquemas Zod basados en JSON Schemas oficiales del MH

const DireccionSchema = z.object({
  departamento: z.string().regex(/^0[1-9]|1[0-4]$/),
  municipio: z.string().regex(/^[0-9]{2}$/),
  complemento: z.string().min(1).max(200),
});

const IdentificacionBaseSchema = z.object({
  version: z.number().int(),
  ambiente: z.enum(['00', '01']),
  tipoDte: z.string(),
  numeroControl: z.string().length(31),
  codigoGeneracion: z.string().length(36).regex(/^[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}$/),
  tipoModelo: z.union([z.literal(1), z.literal(2)]),
  tipoOperacion: z.union([z.literal(1), z.literal(2)]),
  tipoContingencia: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.null()]),
  motivoContin: z.string().max(150).nullable(),
  fecEmi: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  horEmi: z.string().regex(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/),
  tipoMoneda: z.literal('USD'),
});

const EmisorSchema = z.object({
  nit: z.string().regex(/^([0-9]{14}|[0-9]{9})$/),
  nrc: z.string().regex(/^[0-9]{1,8}$/),
  nombre: z.string().min(1).max(250),
  codActividad: z.string().regex(/^[0-9]{2,6}$/),
  descActividad: z.string().min(1).max(150),
  nombreComercial: z.string().min(1).max(150).nullable(),
  tipoEstablecimiento: z.enum(['01', '02', '04', '07', '20']),
  direccion: DireccionSchema,
  telefono: z.string().min(8).max(30),
  correo: z.string().email().max(100),
  codEstableMH: z.string().length(4).nullable(),
  codEstable: z.string().min(1).max(10).nullable(),
  codPuntoVentaMH: z.string().length(4).nullable(),
  codPuntoVenta: z.string().min(1).max(15).nullable(),
});

const ReceptorFacturaSchema = z.object({
  tipoDocumento: z.enum(['36', '13', '02', '03', '37']).nullable(),
  numDocumento: z.string().min(3).max(20).nullable(),
  nrc: z.string().regex(/^[0-9]{1,8}$/).nullable(),
  nombre: z.string().min(1).max(250).nullable(),
  codActividad: z.string().regex(/^[0-9]{2,6}$/).nullable(),
  descActividad: z.string().min(5).max(150).nullable(),
  direccion: DireccionSchema.nullable(),
  telefono: z.string().min(8).max(30).nullable(),
  correo: z.string().email().max(100).nullable(),
}).nullable();

const ReceptorCCFSchema = z.object({
  nit: z.string().regex(/^([0-9]{14}|[0-9]{9})$/),
  nrc: z.string().regex(/^[0-9]{1,8}$/),
  nombre: z.string().min(1).max(250),
  codActividad: z.string().regex(/^[0-9]{2,6}$/),
  descActividad: z.string().min(1).max(150),
  nombreComercial: z.string().min(1).max(150).nullable(),
  direccion: DireccionSchema,
  telefono: z.string().min(8).max(30).nullable(),
  correo: z.string().email().max(100),
});

const CuerpoDocumentoFacturaSchema = z.object({
  numItem: z.number().int().min(1).max(2000),
  tipoItem: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  numeroDocumento: z.string().min(1).max(36).nullable(),
  cantidad: z.number().positive().lt(100000000000),
  codigo: z.string().min(1).max(25).nullable(),
  codTributo: z.enum(['A8', '57', '90', 'D4', 'D5', '25', 'A6']).nullable(),
  uniMedida: z.number().int().min(1).max(99),
  descripcion: z.string().max(1000),
  precioUni: z.number().lt(100000000000),
  montoDescu: z.number().min(0).lt(100000000000),
  ventaNoSuj: z.number().min(0).lt(100000000000),
  ventaExenta: z.number().min(0).lt(100000000000),
  ventaGravada: z.number().min(0).lt(100000000000),
  tributos: z.array(z.string().length(2)).nullable(),
  psv: z.number().min(0).lt(100000000000),
  noGravado: z.number().lt(100000000000).gt(-100000000000),
  ivaItem: z.number().min(0).lt(100000000000),
});

const TributoResumenSchema = z.object({
  codigo: z.string().length(2),
  descripcion: z.string().min(2).max(150),
  valor: z.number().min(0).lt(100000000000),
});

const PagoSchema = z.object({
  codigo: z.string().regex(/^(0[1-9]|1[0-4]|99)$/),
  montoPago: z.number().min(0).lt(100000000000),
  referencia: z.string().max(50).nullable(),
  plazo: z.string().regex(/^0[1-3]$/).nullable(),
  periodo: z.number().nullable(),
});

const ResumenFacturaSchema = z.object({
  totalNoSuj: z.number().min(0).lt(100000000000),
  totalExenta: z.number().min(0).lt(100000000000),
  totalGravada: z.number().min(0).lt(100000000000),
  subTotalVentas: z.number().min(0).lt(100000000000),
  descuNoSuj: z.number().min(0).lt(100000000000),
  descuExenta: z.number().min(0).lt(100000000000),
  descuGravada: z.number().min(0).lt(100000000000),
  porcentajeDescuento: z.number().min(0).max(100),
  totalDescu: z.number().min(0).lt(100000000000),
  tributos: z.array(TributoResumenSchema).nullable(),
  subTotal: z.number().min(0).lt(100000000000),
  ivaRete1: z.number().min(0).lt(100000000000),
  reteRenta: z.number().min(0).lt(100000000000),
  montoTotalOperacion: z.number().min(0).lt(100000000000),
  totalNoGravado: z.number().lt(100000000000).gt(-100000000000),
  totalPagar: z.number().min(0).lt(100000000000),
  totalLetras: z.string().max(200),
  totalIva: z.number().min(0).lt(100000000000),
  saldoFavor: z.number().max(0),
  condicionOperacion: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  pagos: z.array(PagoSchema).nullable(),
  numPagoElectronico: z.string().max(100).nullable(),
});

const ExtensionSchema = z.object({
  nombEntrega: z.string().min(5).max(100).nullable(),
  docuEntrega: z.string().min(5).max(25).nullable(),
  nombRecibe: z.string().min(5).max(100).nullable(),
  docuRecibe: z.string().min(5).max(25).nullable(),
  observaciones: z.string().max(3000).nullable(),
  placaVehiculo: z.string().max(10).nullable().optional(),
}).nullable();

const ApendiceSchema = z.object({
  campo: z.string().max(25),
  etiqueta: z.string().max(50),
  valor: z.string().max(150),
});

const DocumentoRelacionadoSchema = z.object({
  tipoDocumento: z.string(),
  tipoGeneracion: z.union([z.literal(1), z.literal(2)]),
  numeroDocumento: z.string().min(1).max(36),
  fechaEmision: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const VentaTerceroSchema = z.object({
  nit: z.string().regex(/^([0-9]{14}|[0-9]{9})$/),
  nombre: z.string().min(1).max(250),
}).nullable();

// Schema completo para Factura (01)
const FacturaSchema = z.object({
  identificacion: IdentificacionBaseSchema.extend({
    version: z.literal(1),
    tipoDte: z.literal('01'),
    numeroControl: z.string().regex(/^DTE-01-[A-Z0-9]{8}-[0-9]{15}$/),
  }),
  documentoRelacionado: z.array(DocumentoRelacionadoSchema).nullable(),
  emisor: EmisorSchema,
  receptor: ReceptorFacturaSchema,
  otrosDocumentos: z.array(z.any()).nullable(),
  ventaTercero: VentaTerceroSchema,
  cuerpoDocumento: z.array(CuerpoDocumentoFacturaSchema).min(1).max(2000),
  resumen: ResumenFacturaSchema,
  extension: ExtensionSchema,
  apendice: z.array(ApendiceSchema).min(1).max(10).nullable(),
});

// Schema completo para CCF (03)
const CCFSchema = z.object({
  identificacion: IdentificacionBaseSchema.extend({
    version: z.literal(3),
    tipoDte: z.literal('03'),
    numeroControl: z.string().regex(/^DTE-03-[A-Z0-9]{8}-[0-9]{15}$/),
  }),
  documentoRelacionado: z.array(DocumentoRelacionadoSchema).nullable(),
  emisor: EmisorSchema,
  receptor: ReceptorCCFSchema,
  otrosDocumentos: z.array(z.any()).nullable(),
  ventaTercero: VentaTerceroSchema,
  cuerpoDocumento: z.array(z.any()).min(1).max(2000),
  resumen: z.any(),
  extension: ExtensionSchema,
  apendice: z.array(ApendiceSchema).min(1).max(10).nullable(),
});

// Emisor sin campos de establecimiento (para NC, ND, Retención)
const EmisorSinEstablecimientoSchema = EmisorSchema.omit({
  codEstableMH: true,
  codEstable: true,
  codPuntoVentaMH: true,
  codPuntoVenta: true,
});

// Cuerpo documento para NC/ND
const CuerpoDocumentoNotaCreditoSchema = z.object({
  numItem: z.number().int().min(1).max(2000),
  tipoItem: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  numeroDocumento: z.string().min(1).max(36),
  cantidad: z.number().positive().lt(100000000000),
  codigo: z.string().min(1).max(25).nullable(),
  codTributo: z.enum(['A8', '57', '90', 'D4', 'D5', '25', 'A6']).nullable(),
  uniMedida: z.number().int().min(1).max(99),
  descripcion: z.string().max(1000).nullable(),
  precioUni: z.number().lt(100000000000),
  montoDescu: z.number().min(0).lt(100000000000),
  ventaNoSuj: z.number().min(0).lt(100000000000),
  ventaExenta: z.number().min(0).lt(100000000000),
  ventaGravada: z.number().min(0).lt(100000000000),
  tributos: z.array(z.string().length(2)).nullable(),
});

// Resumen para NC/ND
const ResumenNotaCreditoSchema = z.object({
  totalNoSuj: z.number().min(0).lt(100000000000),
  totalExenta: z.number().min(0).lt(100000000000),
  totalGravada: z.number().min(0).lt(100000000000),
  subTotalVentas: z.number().min(0).lt(100000000000),
  descuNoSuj: z.number().min(0).lt(100000000000),
  descuExenta: z.number().min(0).lt(100000000000),
  descuGravada: z.number().min(0).lt(100000000000),
  totalDescu: z.number().min(0).lt(100000000000),
  tributos: z.array(TributoResumenSchema).nullable(),
  subTotal: z.number().min(0).lt(100000000000),
  ivaPerci1: z.number().min(0).lt(100000000000),
  ivaRete1: z.number().min(0).lt(100000000000),
  reteRenta: z.number().min(0).lt(100000000000),
  montoTotalOperacion: z.number().min(0).lt(100000000000),
  totalLetras: z.string().max(200),
  condicionOperacion: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});

// Extension sin placaVehiculo (para NC, ND, Retención)
const ExtensionSinPlacaSchema = z.object({
  nombEntrega: z.string().min(5).max(100).nullable(),
  docuEntrega: z.string().min(5).max(25).nullable(),
  nombRecibe: z.string().min(5).max(100).nullable(),
  docuRecibe: z.string().min(5).max(25).nullable(),
  observaciones: z.string().max(3000).nullable(),
}).nullable();

// Schema completo para Nota de Crédito (05)
const NotaCreditoSchema = z.object({
  identificacion: IdentificacionBaseSchema.extend({
    version: z.literal(3),
    tipoDte: z.literal('05'),
    numeroControl: z.string().regex(/^DTE-05-[A-Z0-9]{8}-[0-9]{15}$/),
  }),
  documentoRelacionado: z.array(DocumentoRelacionadoSchema).min(1),
  emisor: EmisorSinEstablecimientoSchema,
  receptor: ReceptorCCFSchema,
  ventaTercero: VentaTerceroSchema,
  cuerpoDocumento: z.array(CuerpoDocumentoNotaCreditoSchema).min(1).max(2000),
  resumen: ResumenNotaCreditoSchema,
  extension: ExtensionSinPlacaSchema,
  apendice: z.array(ApendiceSchema).min(1).max(10).nullable(),
});

// Schema completo para Nota de Débito (06)
const NotaDebitoSchema = z.object({
  identificacion: IdentificacionBaseSchema.extend({
    version: z.literal(3),
    tipoDte: z.literal('06'),
    numeroControl: z.string().regex(/^DTE-06-[A-Z0-9]{8}-[0-9]{15}$/),
  }),
  documentoRelacionado: z.array(DocumentoRelacionadoSchema).min(1),
  emisor: EmisorSinEstablecimientoSchema,
  receptor: ReceptorCCFSchema,
  ventaTercero: VentaTerceroSchema,
  cuerpoDocumento: z.array(CuerpoDocumentoNotaCreditoSchema).min(1).max(2000),
  resumen: ResumenNotaCreditoSchema.extend({
    numPagoElectronico: z.string().max(100).nullable(),
  }),
  extension: ExtensionSinPlacaSchema,
  apendice: z.array(ApendiceSchema).min(1).max(10).nullable(),
});

// Cuerpo documento para Comprobante de Retención (07)
const CuerpoDocumentoRetencionSchema = z.object({
  numItem: z.number().int().min(1).max(500),
  tipoDte: z.string().min(2).max(2),
  tipoDoc: z.union([z.literal(1), z.literal(2)]),
  numDocumento: z.string().min(1).max(36),
  fechaEmision: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  montoSujetoGrav: z.number().min(0).lt(100000000000),
  codigoRetencionMH: z.string().min(2).max(3),
  ivaRetenido: z.number().min(0).lt(100000000000),
  descripcion: z.string().max(1000),
});

// Resumen para Comprobante de Retención (07)
const ResumenRetencionSchema = z.object({
  totalSujetoRetencion: z.number().min(0).lt(100000000000),
  totalIVAretenido: z.number().min(0).lt(100000000000),
  totalIVAretenidoLetras: z.string().max(200),
});

// Schema completo para Comprobante de Retención (07)
const ComprobanteRetencionSchema = z.object({
  identificacion: IdentificacionBaseSchema.extend({
    version: z.literal(3),
    tipoDte: z.literal('07'),
    numeroControl: z.string().regex(/^DTE-07-[A-Z0-9]{8}-[0-9]{15}$/),
  }),
  emisor: EmisorSinEstablecimientoSchema,
  receptor: ReceptorCCFSchema,
  cuerpoDocumento: z.array(CuerpoDocumentoRetencionSchema).min(1).max(500),
  resumen: ResumenRetencionSchema,
  extension: ExtensionSinPlacaSchema,
  apendice: z.array(ApendiceSchema).min(1).max(10).nullable(),
});

// Receptor para Sujeto Excluido (14)
const ReceptorSujetoExcluidoSchema = z.object({
  tipoDocumento: z.enum(['36', '13', '02', '03', '37']).nullable(),
  numDocumento: z.string().min(3).max(20).nullable(),
  nombre: z.string().min(1).max(250),
  codActividad: z.string().regex(/^[0-9]{2,6}$/).nullable(),
  descActividad: z.string().min(5).max(150).nullable(),
  direccion: DireccionSchema,
  telefono: z.string().min(8).max(30).nullable(),
  correo: z.string().email().max(100),
});

// Cuerpo documento para Sujeto Excluido (14)
const CuerpoDocumentoSujetoExcluidoSchema = z.object({
  numItem: z.number().int().min(1).max(2000),
  tipoItem: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  cantidad: z.number().positive().lt(100000000000),
  codigo: z.string().min(1).max(25).nullable(),
  uniMedida: z.number().int().min(1).max(99),
  descripcion: z.string().max(1000),
  precioUni: z.number().lt(100000000000),
  montoDescu: z.number().min(0).lt(100000000000),
  compra: z.number().min(0).lt(100000000000),
});

// Resumen para Sujeto Excluido (14)
const ResumenSujetoExcluidoSchema = z.object({
  totalCompra: z.number().min(0).lt(100000000000),
  descu: z.number().min(0).lt(100000000000),
  totalDescu: z.number().min(0).lt(100000000000),
  subTotal: z.number().min(0).lt(100000000000),
  ivaRete1: z.number().min(0).lt(100000000000),
  reteRenta: z.number().min(0).lt(100000000000),
  totalPagar: z.number().min(0).lt(100000000000),
  totalLetras: z.string().max(200),
  condicionOperacion: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  pagos: z.array(PagoSchema).nullable(),
  observaciones: z.string().max(3000).nullable(),
});

// Schema completo para Factura de Sujeto Excluido (14)
const SujetoExcluidoSchema = z.object({
  identificacion: IdentificacionBaseSchema.extend({
    version: z.literal(1),
    tipoDte: z.literal('14'),
    numeroControl: z.string().regex(/^DTE-14-[A-Z0-9]{8}-[0-9]{15}$/),
  }),
  emisor: EmisorSchema,
  sujetoExcluido: ReceptorSujetoExcluidoSchema,
  cuerpoDocumento: z.array(CuerpoDocumentoSujetoExcluidoSchema).min(1).max(2000),
  resumen: ResumenSujetoExcluidoSchema,
  apendice: z.array(ApendiceSchema).min(1).max(10).nullable(),
});

// === Tipo 04: Nota de Remisión ===

const ReceptorNotaRemisionSchema = z.object({
  tipoDocumento: z.enum(['36', '13', '02', '03', '37']),
  numDocumento: z.string().min(3).max(20),
  nrc: z.string().regex(/^[0-9]{1,8}$/).nullable(),
  nombre: z.string().min(1).max(250),
  codActividad: z.string().regex(/^[0-9]{2,6}$/).nullable(),
  descActividad: z.string().min(1).max(150).nullable(),
  nombreComercial: z.string().min(1).max(150).nullable(),
  direccion: DireccionSchema,
  telefono: z.string().min(8).max(30).nullable(),
  correo: z.string().email().max(100),
  bienTitulo: z.string().max(2),
});

const ResumenNotaRemisionSchema = z.object({
  totalNoSuj: z.number().min(0).lt(100000000000),
  totalExenta: z.number().min(0).lt(100000000000),
  totalGravada: z.number().min(0).lt(100000000000),
  subTotalVentas: z.number().min(0).lt(100000000000),
  descuNoSuj: z.number().min(0).lt(100000000000),
  descuExenta: z.number().min(0).lt(100000000000),
  descuGravada: z.number().min(0).lt(100000000000),
  porcentajeDescuento: z.number().min(0).max(100).nullable(),
  totalDescu: z.number().min(0).lt(100000000000),
  tributos: z.array(TributoResumenSchema).nullable(),
  subTotal: z.number().min(0).lt(100000000000),
  montoTotalOperacion: z.number().min(0).lt(100000000000),
  totalLetras: z.string().max(200),
});

const NotaRemisionSchema = z.object({
  identificacion: IdentificacionBaseSchema.extend({
    version: z.literal(3),
    tipoDte: z.literal('04'),
    numeroControl: z.string().regex(/^DTE-04-[A-Z0-9]{8}-[0-9]{15}$/),
  }),
  documentoRelacionado: z.array(DocumentoRelacionadoSchema).min(1).max(50).nullable(),
  emisor: EmisorSchema,
  receptor: ReceptorNotaRemisionSchema,
  ventaTercero: VentaTerceroSchema,
  cuerpoDocumento: z.array(CuerpoDocumentoNotaCreditoSchema).min(1).max(2000),
  resumen: ResumenNotaRemisionSchema,
  extension: ExtensionSchema,
  apendice: z.array(ApendiceSchema).min(1).max(10).nullable(),
});

// === Tipo 09: Documento Contable de Liquidación ===

const EmisorLiquidacionSchema = z.object({
  nit: z.string().regex(/^([0-9]{14}|[0-9]{9})$/),
  nrc: z.string().regex(/^[0-9]{1,8}$/),
  nombre: z.string().min(3).max(200),
  codActividad: z.string().regex(/^[0-9]{2,6}$/),
  descActividad: z.string().min(5).max(150),
  nombreComercial: z.string().min(5).max(150).nullable(),
  tipoEstablecimiento: z.enum(['01', '02', '04', '07', '20']),
  direccion: DireccionSchema,
  telefono: z.string().min(8).max(8),
  correo: z.string().email().max(100),
  codigoMH: z.string().length(4).nullable(),
  codigo: z.string().length(4).nullable(),
  puntoVentaMH: z.string().length(4).nullable(),
  puntoVentaContri: z.string().min(1).max(15).nullable(),
});

const ReceptorLiquidacionSchema = z.object({
  nit: z.string().regex(/^([0-9]{14}|[0-9]{9})$/),
  nrc: z.string().regex(/^[0-9]{1,8}$/),
  nombre: z.string().min(1).max(250),
  codActividad: z.string().regex(/^[0-9]{2,6}$/),
  descActividad: z.string().min(5).max(150),
  nombreComercial: z.string().min(5).max(150).nullable(),
  tipoEstablecimiento: z.enum(['01', '02', '04', '07', '20']),
  direccion: DireccionSchema,
  telefono: z.string().min(8).max(8).nullable(),
  correo: z.string().email().max(100),
  codigoMH: z.string().length(4).nullable(),
  puntoVentaMH: z.string().length(4).nullable(),
});

const CuerpoDocumentoLiquidacionSchema = z.object({
  periodoLiquidacionFechaInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodoLiquidacionFechaFin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  codLiquidacion: z.string().min(1).max(30).nullable(),
  cantidadDoc: z.number().positive().nullable(),
  valorOperaciones: z.number().positive().lt(100000000000),
  montoSinPercepcion: z.number().min(0).lt(100000000000),
  descripSinPercepcion: z.string().min(1).max(100).nullable(),
  subTotal: z.number().positive().lt(100000000000),
  iva: z.number().positive().lt(100000000000),
  montoSujetoPercepcion: z.number().positive().lt(100000000000),
  ivaPercibido: z.number().positive().lt(100000000000),
  comision: z.number().min(0).lt(100000000000),
  porcentComision: z.string().min(1).max(100).nullable(),
  ivaComision: z.number().min(0).lt(100000000000),
  liquidoApagar: z.number().positive().lt(100000000000),
  totalLetras: z.string().min(8).max(200),
  observaciones: z.string().max(200).nullable(),
});

const ExtensionLiquidacionSchema = z.object({
  nombEntrega: z.string().min(5).max(100),
  docuEntrega: z.string().min(5).max(25),
  codEmpleado: z.string().min(1).max(15).nullable(),
});

const IdentificacionDCLSchema = z.object({
  version: z.literal(1),
  ambiente: z.enum(['00', '01']),
  tipoDte: z.literal('09'),
  numeroControl: z.string().regex(/^DTE-09-[A-Z0-9]{8}-[0-9]{15}$/).length(31),
  codigoGeneracion: z.string().length(36).regex(/^[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}$/),
  tipoModelo: z.literal(1),
  tipoOperacion: z.literal(1),
  fecEmi: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  horEmi: z.string().regex(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/),
  tipoMoneda: z.literal('USD'),
});

const DocumentoContableLiquidacionSchema = z.object({
  identificacion: IdentificacionDCLSchema,
  emisor: EmisorLiquidacionSchema,
  receptor: ReceptorLiquidacionSchema,
  cuerpoDocumento: CuerpoDocumentoLiquidacionSchema,
  extension: ExtensionLiquidacionSchema,
  apendice: z.array(ApendiceSchema).min(1).max(10).nullable(),
});

// === Tipo 11: Factura de Exportación ===

const EmisorExportacionSchema = EmisorSchema.extend({
  tipoItemExpor: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  recintoFiscal: z.string().length(2).nullable(),
  regimen: z.string().nullable(),
});

const ReceptorExportacionSchema = z.object({
  nombre: z.string().min(1).max(250),
  tipoDocumento: z.enum(['36', '13', '02', '03', '37']),
  numDocumento: z.string().min(3).max(20),
  nombreComercial: z.string().min(1).max(150).nullable(),
  codPais: z.string().length(4),
  nombrePais: z.string().min(3).max(50),
  complemento: z.string().min(5).max(300),
  tipoPersona: z.union([z.literal(1), z.literal(2)]),
  descActividad: z.string().min(5).max(150),
  telefono: z.string().min(8).max(50).nullable(),
  correo: z.string().email().max(100).nullable(),
}).nullable();

const OtroDocumentoExportacionSchema = z.object({
  codDocAsociado: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  descDocumento: z.string().max(100).nullable(),
  detalleDocumento: z.string().max(300).nullable(),
  placaTrans: z.string().min(5).max(70).nullable(),
  modoTransp: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6), z.literal(7), z.null()]),
  numConductor: z.string().min(5).max(100).nullable(),
  nombreConductor: z.string().min(5).max(200).nullable(),
});

const CuerpoDocumentoExportacionSchema = z.object({
  numItem: z.number().int().min(1).max(2000),
  cantidad: z.number().positive().lt(100000000000),
  codigo: z.string().min(1).max(200).nullable(),
  uniMedida: z.number().int().min(1).max(99),
  descripcion: z.string().max(1000),
  precioUni: z.number().lt(100000000000),
  montoDescu: z.number().min(0).lt(100000000000),
  ventaGravada: z.number().min(0).lt(100000000000),
  tributos: z.array(z.string().length(2)).nullable(),
  noGravado: z.number().lt(100000000000).gt(-100000000000),
});

const ResumenExportacionSchema = z.object({
  totalGravada: z.number().min(0).lt(100000000000),
  descuento: z.number().min(0).lt(100000000000),
  porcentajeDescuento: z.number().min(0).max(100),
  totalDescu: z.number().min(0).lt(100000000000),
  seguro: z.number().min(0).lt(100000000000).nullable(),
  flete: z.number().min(0).lt(100000000000).nullable(),
  montoTotalOperacion: z.number().positive().lt(100000000000),
  totalNoGravado: z.number().lt(100000000000).gt(-100000000000),
  totalPagar: z.number().min(0).lt(100000000000),
  totalLetras: z.string().max(200),
  condicionOperacion: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  pagos: z.array(PagoSchema).nullable(),
  codIncoterms: z.string().nullable(),
  descIncoterms: z.string().min(3).max(150).nullable(),
  numPagoElectronico: z.string().max(100).nullable(),
  observaciones: z.string().max(500).nullable(),
});

const FacturaExportacionSchema = z.object({
  identificacion: IdentificacionBaseSchema.extend({
    version: z.literal(1),
    tipoDte: z.literal('11'),
    numeroControl: z.string().regex(/^DTE-11-[A-Z0-9]{8}-[0-9]{15}$/),
  }),
  emisor: EmisorExportacionSchema,
  receptor: ReceptorExportacionSchema,
  otrosDocumentos: z.array(OtroDocumentoExportacionSchema).nullable(),
  ventaTercero: VentaTerceroSchema,
  cuerpoDocumento: z.array(CuerpoDocumentoExportacionSchema).min(1).max(2000),
  resumen: ResumenExportacionSchema,
  apendice: z.array(ApendiceSchema).min(1).max(10).nullable(),
});

// === Tipo 34: Comprobante de Retención Simplificado (CRS) ===

const RetencionCRSItemSchema = z.object({
  numItem: z.number().int().min(1).max(500),
  tipoImpuesto: z.enum(['ISR', 'IVA', 'ISSS', 'AFP', 'OTRO']),
  descripcion: z.string().max(1000),
  tasa: z.number().min(0).lte(1),
  montoSujetoRetencion: z.number().min(0).lt(100000000000),
  montoRetencion: z.number().min(0).lt(100000000000),
});

const ResumenCRSSchema = z.object({
  totalSujetoRetencion: z.number().min(0).lt(100000000000),
  totalRetenido: z.number().min(0).lt(100000000000),
  totalRetenidoLetras: z.string().max(200),
});

const CRSSchema = z.object({
  identificacion: IdentificacionBaseSchema.extend({
    version: z.literal(1),
    tipoDte: z.literal('34'),
    numeroControl: z.string().regex(/^DTE-34-[A-Z0-9]{8}-[0-9]{15}$/),
  }),
  emisor: EmisorSinEstablecimientoSchema,
  receptor: ReceptorCCFSchema,
  documentoRelacionado: z.array(DocumentoRelacionadoSchema).nullable(),
  cuerpoDocumento: z.array(RetencionCRSItemSchema).min(1).max(500),
  resumen: ResumenCRSSchema,
  extension: ExtensionSinPlacaSchema,
  apendice: z.array(ApendiceSchema).min(1).max(10).nullable(),
});

export interface ValidationResult {
  valid: boolean;
  errors: Array<{
    path: string;
    message: string;
  }>;
}

@Injectable()
export class DteValidatorService {
  private schemas: Record<string, z.ZodSchema> = {
    '01': FacturaSchema,
    '03': CCFSchema,
    '04': NotaRemisionSchema,
    '05': NotaCreditoSchema,
    '06': NotaDebitoSchema,
    '07': ComprobanteRetencionSchema,
    '09': DocumentoContableLiquidacionSchema,
    '11': FacturaExportacionSchema,
    '14': SujetoExcluidoSchema,
    '34': CRSSchema,
  };

  validate(dte: DTE): ValidationResult {
    const tipoDte = dte.identificacion.tipoDte as TipoDte;
    const schema = this.schemas[tipoDte];

    if (!schema) {
      return {
        valid: false,
        errors: [{ path: 'identificacion.tipoDte', message: `Schema not implemented for type ${tipoDte}` }],
      };
    }

    const result = schema.safeParse(dte);

    if (result.success) {
      return { valid: true, errors: [] };
    }

    return {
      valid: false,
      errors: result.error.errors.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
      })),
    };
  }

  validateNumeroControl(numeroControl: string, tipoDte: TipoDte): boolean {
    const pattern = new RegExp(`^DTE-${tipoDte}-[A-Z0-9]{8}-[0-9]{15}$`);
    return pattern.test(numeroControl) && numeroControl.length === 31;
  }

  validateCodigoGeneracion(codigo: string): boolean {
    const pattern = /^[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}$/;
    return pattern.test(codigo) && codigo.length === 36;
  }

  validateNIT(nit: string): boolean {
    return /^([0-9]{14}|[0-9]{9})$/.test(nit);
  }

  validateNRC(nrc: string): boolean {
    return /^[0-9]{1,8}$/.test(nrc);
  }
}
