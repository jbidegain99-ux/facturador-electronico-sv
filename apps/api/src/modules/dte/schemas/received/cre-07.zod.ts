import { z } from 'zod';
import { baseIdentificacionSchema, baseEmisorSchema, baseReceptorSchema, decimalSchema } from './base.zod';

const creResumenSchema = z
  .object({
    totalSujetoRetencion: decimalSchema.optional(),
    totalIVAretenido: decimalSchema.optional(),
    totalIVAretenidoLetras: z.string().optional(),
  })
  .passthrough();

export const cre07Schema = z.object({
  identificacion: baseIdentificacionSchema.extend({ tipoDte: z.literal('07') }),
  emisor: baseEmisorSchema,
  receptor: baseReceptorSchema,
  cuerpoDocumento: z.array(z.unknown()).optional(),
  resumen: creResumenSchema,
  extension: z.unknown().nullable().optional(),
  apendice: z.unknown().nullable().optional(),
});

export type CRE07 = z.infer<typeof cre07Schema>;
