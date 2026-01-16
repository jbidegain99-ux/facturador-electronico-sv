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
