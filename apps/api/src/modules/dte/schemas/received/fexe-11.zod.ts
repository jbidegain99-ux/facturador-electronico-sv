import { z } from 'zod';
import {
  baseIdentificacionSchema,
  baseEmisorSchema,
  decimalSchema,
} from './base.zod';

// FEXE receptor may be a foreign entity — more permissive than baseReceptorSchema
const fexeReceptorSchema = z
  .object({
    nombre: z.string(),
  })
  .passthrough();

const fexeLineSchema = z
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

export const fexe11Schema = z.object({
  identificacion: baseIdentificacionSchema.extend({ tipoDte: z.literal('11') }),
  emisor: baseEmisorSchema,
  receptor: fexeReceptorSchema,
  otrosDocumentos: z.array(z.unknown()).optional(),
  cuerpoDocumento: z.array(fexeLineSchema).min(1),
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

export type FEXE11 = z.infer<typeof fexe11Schema>;
