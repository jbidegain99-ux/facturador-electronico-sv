import { z } from 'zod';
import {
  baseIdentificacionSchema,
  baseEmisorSchema,
  baseReceptorSchema,
  decimalSchema,
} from './base.zod';

const nreLineSchema = z
  .object({
    numItem: z.number().int().positive(),
    tipoItem: z.number().int(),
    cantidad: decimalSchema,
    codigo: z.string().nullable().optional(),
    uniMedida: z.number().int(),
    descripcion: z.string(),
    precioUni: decimalSchema,
    ventaGravada: decimalSchema.optional(),
  })
  .passthrough();

export const nre04Schema = z.object({
  identificacion: baseIdentificacionSchema.extend({ tipoDte: z.literal('04') }),
  emisor: baseEmisorSchema,
  receptor: baseReceptorSchema,
  cuerpoDocumento: z.array(nreLineSchema).min(1),
  resumen: z
    .object({
      totalGravada: decimalSchema.optional(),
      subTotal: decimalSchema,
      totalLetras: z.string(),
    })
    .passthrough(),
  extension: z.unknown().nullable().optional(),
  apendice: z.unknown().nullable().optional(),
});

export type NRE04 = z.infer<typeof nre04Schema>;
