import { z } from 'zod';

// =========================================================================
// Primitive validators (reusable across DTE types)
// =========================================================================

/** NIT El Salvador: 14 digits without hyphens */
export const nitSchema = z
  .string()
  .regex(/^\d{14}$/, 'NIT must be exactly 14 digits');

/** DUI El Salvador: 9 digits (often written with hyphen 00000000-0 but stored without) */
export const duiSchema = z
  .string()
  .regex(/^\d{9}$/, 'DUI must be exactly 9 digits');

/** NIT or DUI: NIT (14) or DUI (9) — used for emisores FSEE */
export const nitOrDuiSchema = z.union([nitSchema, duiSchema]);

/** NRC: 1-8 digits */
export const nrcSchema = z.string().regex(/^\d{1,8}$/, 'NRC must be 1-8 digits');

/** codigoGeneracion: UUID v4 uppercase */
export const codigoGeneracionSchema = z
  .string()
  .regex(
    /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/,
    'codigoGeneracion must be UUID uppercase',
  );

/** numeroControl: DTE-XX-XXXXXXXX-XXXXXXXXXXXXXXX (35 chars) */
export const numeroControlSchema = z
  .string()
  .regex(
    /^DTE-(01|03|04|05|06|07|08|09|11|14|15)-[A-Z0-9]{8}-\d{15}$/,
    'numeroControl must match DTE-XX-XXXXXXXX-XXXXXXXXXXXXXXX',
  );

/** ISO date YYYY-MM-DD */
export const fecEmiSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'fecEmi must be YYYY-MM-DD');

/** HH:MM:SS */
export const horEmiSchema = z
  .string()
  .regex(/^\d{2}:\d{2}:\d{2}$/, 'horEmi must be HH:MM:SS');

/** DTE tipo code */
export const tipoDteSchema = z.enum([
  '01', '03', '04', '05', '06', '07', '08', '09', '11', '14', '15',
]);

/** Ambiente */
export const ambienteSchema = z.enum(['00', '01']);

/** Tipo moneda — El Salvador uses USD */
export const tipoMonedaSchema = z.literal('USD');

/** Decimal string — used for monetary amounts in JSON (MH sends as numbers, we coerce) */
export const decimalSchema = z
  .union([z.number(), z.string()])
  .transform((v) => String(v))
  .refine((s) => /^-?\d+(\.\d+)?$/.test(s), { message: 'Not a valid decimal' });

// =========================================================================
// Composite sections (reusable)
// =========================================================================

/** Direccion (emisor + receptor) */
export const direccionSchema = z.object({
  departamento: z.string(),
  municipio: z.string(),
  complemento: z.string(),
});

/** Identificacion block — present in all DTE types with slight variations */
export const baseIdentificacionSchema = z.object({
  version: z.number().int().min(1),
  ambiente: ambienteSchema,
  tipoDte: tipoDteSchema,
  numeroControl: numeroControlSchema,
  codigoGeneracion: codigoGeneracionSchema,
  tipoModelo: z.number().int(),
  tipoOperacion: z.number().int(),
  tipoContingencia: z.number().int().nullable().optional(),
  motivoContin: z.string().nullable().optional(),
  fecEmi: fecEmiSchema,
  horEmi: horEmiSchema,
  tipoMoneda: tipoMonedaSchema,
});

/** Emisor block — most common shape (used by FE, CCFE, NC, ND, NRE) */
export const baseEmisorSchema = z.object({
  nit: nitSchema,
  nrc: nrcSchema.nullable().optional(),
  nombre: z.string(),
  codActividad: z.string().nullable().optional(),
  descActividad: z.string().nullable().optional(),
  nombreComercial: z.string().nullable().optional(),
  tipoEstablecimiento: z.string().nullable().optional(),
  direccion: direccionSchema.nullable().optional(),
  telefono: z.string().nullable().optional(),
  correo: z.string().email().nullable().optional(),
  codEstableMH: z.string().nullable().optional(),
  codEstable: z.string().nullable().optional(),
  codPuntoVentaMH: z.string().nullable().optional(),
  codPuntoVenta: z.string().nullable().optional(),
});

/** Emisor Sujeto Excluido (FSEE 14) — may use DUI/pasaporte instead of NIT */
export const emisorSujetoExcluidoSchema = z.object({
  tipoDocumento: z.enum(['13', '36', '37', '38']),
  numDocumento: z.string(),
  nombre: z.string(),
  codActividad: z.string().nullable().optional(),
  descActividad: z.string().nullable().optional(),
  direccion: direccionSchema.nullable().optional(),
  telefono: z.string().nullable().optional(),
  correo: z.string().email().nullable().optional(),
});

/** Receptor — optional in FE/FSEE anonymous, required otherwise */
export const baseReceptorSchema = z.object({
  nit: nitSchema.nullable().optional(),
  nrc: nrcSchema.nullable().optional(),
  nombre: z.string(),
  codActividad: z.string().nullable().optional(),
  descActividad: z.string().nullable().optional(),
  nombreComercial: z.string().nullable().optional(),
  direccion: direccionSchema.nullable().optional(),
  telefono: z.string().nullable().optional(),
  correo: z.string().email().nullable().optional(),
  tipoDocumento: z.string().nullable().optional(),
  numDocumento: z.string().nullable().optional(),
});
