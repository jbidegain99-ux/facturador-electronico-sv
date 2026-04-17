import { z } from 'zod';
import { baseIdentificacionSchema, decimalSchema } from './base.zod';

export const dcle09Schema = z.object({
  identificacion: baseIdentificacionSchema.extend({ tipoDte: z.literal('09') }),
  emisor: z.object({ nit: z.string(), nombre: z.string() }).passthrough(),
  receptor: z.object({ nombre: z.string() }).passthrough(),
  cuerpoDocumento: z.array(z.unknown()).min(1),
  resumen: z
    .object({
      totalPagar: decimalSchema.optional(),
      totalLetras: z.string().optional(),
    })
    .passthrough(),
  extension: z.unknown().nullable().optional(),
  apendice: z.unknown().nullable().optional(),
});

export type DCLE09 = z.infer<typeof dcle09Schema>;
