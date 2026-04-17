import { z } from 'zod';
import {
  baseIdentificacionSchema,
  baseEmisorSchema,
  baseReceptorSchema,
  decimalSchema,
} from './base.zod';

// CDE lines: no IVA — uses valorUni instead of (or alongside) precioUni
const cdeLineSchema = z
  .object({
    numItem: z.number().int().positive(),
    tipoItem: z.number().int(),
    cantidad: decimalSchema,
    codigo: z.string().nullable().optional(),
    uniMedida: z.number().int(),
    descripcion: z.string(),
    valorUni: decimalSchema.optional(),
    precioUni: decimalSchema.optional(),
    ventaNoSuj: decimalSchema.optional(),
    ventaExenta: decimalSchema.optional(),
  })
  .passthrough();

export const cde15Schema = z.object({
  identificacion: baseIdentificacionSchema.extend({ tipoDte: z.literal('15') }),
  emisor: baseEmisorSchema,
  receptor: baseReceptorSchema,
  cuerpoDocumento: z.array(cdeLineSchema).min(1),
  resumen: z
    .object({
      totalNoSuj: decimalSchema.optional(),
      totalExenta: decimalSchema.optional(),
      subTotal: decimalSchema,
      totalLetras: z.string(),
    })
    .passthrough(),
  extension: z.unknown().nullable().optional(),
  apendice: z.unknown().nullable().optional(),
});

export type CDE15 = z.infer<typeof cde15Schema>;
