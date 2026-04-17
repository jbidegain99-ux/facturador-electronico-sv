import { z } from 'zod';
import {
  baseIdentificacionSchema,
  baseEmisorSchema,
  baseReceptorSchema,
  decimalSchema,
} from './base.zod';

const feLineSchema = z.object({
  numItem: z.number().int().positive(),
  tipoItem: z.number().int(),
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
  psv: decimalSchema.optional(),
  noGravado: decimalSchema.optional(),
});

const feResumenSchema = z.object({
  totalNoSuj: decimalSchema.optional(),
  totalExenta: decimalSchema.optional(),
  totalGravada: decimalSchema,
  subTotalVentas: decimalSchema,
  descuNoSuj: decimalSchema.optional(),
  descuExenta: decimalSchema.optional(),
  descuGravada: decimalSchema.optional(),
  totalDescu: decimalSchema.optional(),
  subTotal: decimalSchema,
  ivaRete1: decimalSchema.optional(),
  reteRenta: decimalSchema.optional(),
  montoTotalOperacion: decimalSchema,
  totalNoGravado: decimalSchema.optional(),
  totalPagar: decimalSchema,
  totalLetras: z.string(),
  saldoFavor: decimalSchema.optional(),
  condicionOperacion: z.number().int(),
  pagos: z.array(z.object({
    codigo: z.string(),
    montoPago: decimalSchema,
    referencia: z.string().nullable().optional(),
    plazo: z.string().nullable().optional(),
    periodo: z.number().int().nullable().optional(),
  })).nullable().optional(),
});

export const fe01Schema = z.object({
  identificacion: baseIdentificacionSchema.extend({ tipoDte: z.literal('01') }),
  emisor: baseEmisorSchema,
  receptor: baseReceptorSchema.nullable(),
  cuerpoDocumento: z.array(feLineSchema).min(1),
  resumen: feResumenSchema,
  extension: z.unknown().nullable().optional(),
  apendice: z.unknown().nullable().optional(),
});

export type FE01 = z.infer<typeof fe01Schema>;
