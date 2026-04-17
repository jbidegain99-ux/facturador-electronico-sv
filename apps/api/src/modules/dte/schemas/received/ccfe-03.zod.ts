import { z } from 'zod';
import {
  baseIdentificacionSchema,
  baseEmisorSchema,
  baseReceptorSchema,
  decimalSchema,
} from './base.zod';

/** CCFE body line — has mandatory ivaItem for lines with ventaGravada > 0 */
const ccfeLineSchema = z
  .object({
    numItem: z.number().int().positive(),
    tipoItem: z.number().int(),
    cantidad: decimalSchema,
    codigo: z.string().nullable().optional(),
    codTributo: z.string().nullable().optional(),
    uniMedida: z.number().int(),
    descripcion: z.string(),
    precioUni: decimalSchema,
    montoDescu: decimalSchema.optional(),
    ventaNoSuj: decimalSchema.optional(),
    ventaExenta: decimalSchema.optional(),
    ventaGravada: decimalSchema,
    tributos: z.array(z.string()).nullable().optional(),
    psv: decimalSchema.optional(),
    noGravado: decimalSchema.optional(),
    ivaItem: decimalSchema.nullable().optional(),
  })
  .refine(
    (line) => {
      const gravada = parseFloat(String(line.ventaGravada));
      const iva = line.ivaItem == null ? null : parseFloat(String(line.ivaItem));
      if (gravada > 0) return iva != null && iva > 0;
      return true;
    },
    { message: 'CCFE line with ventaGravada > 0 must have ivaItem > 0' },
  );

const ccfeResumenSchema = z.object({
  totalNoSuj: decimalSchema.optional(),
  totalExenta: decimalSchema.optional(),
  totalGravada: decimalSchema,
  subTotalVentas: decimalSchema,
  descuNoSuj: decimalSchema.optional(),
  descuExenta: decimalSchema.optional(),
  descuGravada: decimalSchema.optional(),
  porcentajeDescuento: decimalSchema.optional(),
  totalDescu: decimalSchema.optional(),
  tributos: z
    .array(
      z.object({
        codigo: z.string(),
        descripcion: z.string(),
        valor: decimalSchema,
      }),
    )
    .nullable()
    .optional(),
  subTotal: decimalSchema,
  ivaPerci1: decimalSchema.optional(),
  ivaRete1: decimalSchema.optional(),
  reteRenta: decimalSchema.optional(),
  montoTotalOperacion: decimalSchema,
  totalNoGravado: decimalSchema.optional(),
  totalPagar: decimalSchema,
  totalLetras: z.string(),
  totalIva: decimalSchema,
  saldoFavor: decimalSchema.optional(),
  condicionOperacion: z.number().int(),
  pagos: z
    .array(
      z.object({
        codigo: z.string(),
        montoPago: decimalSchema,
        referencia: z.string().nullable().optional(),
        plazo: z.string().nullable().optional(),
        periodo: z.number().int().nullable().optional(),
      }),
    )
    .nullable()
    .optional(),
  numPagoElectronico: z.string().nullable().optional(),
});

/** CCFE (tipoDte 03) schema with cross-field refinements */
export const ccfe03Schema = z
  .object({
    identificacion: baseIdentificacionSchema.extend({
      tipoDte: z.literal('03'),
    }),
    emisor: baseEmisorSchema,
    receptor: baseReceptorSchema,
    cuerpoDocumento: z.array(ccfeLineSchema).min(1, 'cuerpoDocumento must have at least 1 line'),
    resumen: ccfeResumenSchema,
    extension: z.unknown().nullable().optional(),
    apendice: z.unknown().nullable().optional(),
  })
  .refine(
    (doc) => {
      const sumIva = doc.cuerpoDocumento.reduce(
        (acc, line) => acc + (line.ivaItem ? parseFloat(String(line.ivaItem)) : 0),
        0,
      );
      const totalIva = parseFloat(String(doc.resumen.totalIva));
      return Math.abs(sumIva - totalIva) < 0.01;
    },
    { message: 'sum(cuerpoDocumento.ivaItem) must equal resumen.totalIva within $0.01' },
  );

export type CCFE03 = z.infer<typeof ccfe03Schema>;
