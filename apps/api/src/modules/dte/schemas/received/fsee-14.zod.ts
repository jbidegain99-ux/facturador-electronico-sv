import { z } from 'zod';
import {
  baseIdentificacionSchema,
  emisorSujetoExcluidoSchema,
  baseReceptorSchema,
  decimalSchema,
} from './base.zod';

const fseeLineSchema = z.object({
  numItem: z.number().int().positive(),
  tipoItem: z.number().int(),
  cantidad: decimalSchema,
  codigo: z.string().nullable().optional(),
  uniMedida: z.number().int(),
  descripcion: z.string(),
  precioUni: decimalSchema,
  montoDescu: decimalSchema.optional(),
  compra: decimalSchema,
});

const fseeResumenSchema = z.object({
  totalCompra: decimalSchema,
  descu: decimalSchema.optional(),
  totalDescu: decimalSchema.optional(),
  subTotal: decimalSchema,
  ivaRete1: decimalSchema.optional(),
  reteRenta: decimalSchema.optional(),
  totalPagar: decimalSchema,
  totalLetras: z.string(),
  condicionOperacion: z.number().int(),
  pagos: z.array(z.object({
    codigo: z.string(),
    montoPago: decimalSchema,
    referencia: z.string().nullable().optional(),
    plazo: z.string().nullable().optional(),
    periodo: z.number().int().nullable().optional(),
  })).nullable().optional(),
});

export const fsee14Schema = z.object({
  identificacion: baseIdentificacionSchema.extend({ tipoDte: z.literal('14') }),
  sujetoExcluido: emisorSujetoExcluidoSchema,
  receptor: baseReceptorSchema,
  cuerpoDocumento: z.array(fseeLineSchema).min(1),
  resumen: fseeResumenSchema,
  apendice: z.unknown().nullable().optional(),
});

export type FSEE14 = z.infer<typeof fsee14Schema>;
