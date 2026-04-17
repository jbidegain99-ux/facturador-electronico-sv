import { z } from 'zod';
import {
  baseIdentificacionSchema,
  baseEmisorSchema,
  baseReceptorSchema,
  decimalSchema,
} from './base.zod';

const docAsociadoSchema = z.object({
  tipoGeneracion: z.number().int(),
  tipoDoc: z.string(),
  numeroDocumento: z.string(),
  fechaEmision: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

const ndeLineSchema = z.object({
  numItem: z.number().int().positive(),
  tipoItem: z.number().int(),
  numeroDocumento: z.string().optional(),
  cantidad: decimalSchema,
  codigo: z.string().nullable().optional(),
  uniMedida: z.number().int(),
  descripcion: z.string(),
  precioUni: decimalSchema,
  montoDescu: decimalSchema.optional(),
  ventaNoSuj: decimalSchema.optional(),
  ventaExenta: decimalSchema.optional(),
  ventaGravada: decimalSchema,
  tributos: z.array(z.string()).nullable().optional(),
  ivaItem: decimalSchema.nullable().optional(),
});

const ndeResumenSchema = z.object({
  totalNoSuj: decimalSchema.optional(),
  totalExenta: decimalSchema.optional(),
  totalGravada: decimalSchema,
  subTotalVentas: decimalSchema,
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
  ivaRete1: decimalSchema.optional(),
  reteRenta: decimalSchema.optional(),
  montoTotalOperacion: decimalSchema,
  totalLetras: z.string(),
  totalIva: decimalSchema,
  condicionOperacion: z.number().int(),
});

export const nde06Schema = z.object({
  identificacion: baseIdentificacionSchema.extend({ tipoDte: z.literal('06') }),
  docsAsociados: z
    .array(docAsociadoSchema)
    .min(1, 'NDE requires at least one docAsociado'),
  emisor: baseEmisorSchema,
  receptor: baseReceptorSchema,
  cuerpoDocumento: z.array(ndeLineSchema).min(1),
  resumen: ndeResumenSchema,
  extension: z.unknown().nullable().optional(),
  apendice: z.unknown().nullable().optional(),
});

export type NDE06 = z.infer<typeof nde06Schema>;
