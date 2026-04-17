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

const nceLineSchema = z.object({
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

const nceResumenSchema = z.object({
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

export const nce05Schema = z.object({
  identificacion: baseIdentificacionSchema.extend({ tipoDte: z.literal('05') }),
  docsAsociados: z
    .array(docAsociadoSchema)
    .min(1, 'NCE requires at least one docAsociado'),
  emisor: baseEmisorSchema,
  receptor: baseReceptorSchema,
  cuerpoDocumento: z.array(nceLineSchema).min(1),
  resumen: nceResumenSchema,
  extension: z.unknown().nullable().optional(),
  apendice: z.unknown().nullable().optional(),
});

export type NCE05 = z.infer<typeof nce05Schema>;
