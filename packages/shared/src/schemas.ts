import { z } from 'zod';

export const direccionSchema = z.object({
  departamento: z.string().regex(/^0[1-9]|1[0-4]$/),
  municipio: z.string().regex(/^[0-9]{2}$/),
  complemento: z.string().min(1).max(200),
});

export const emisorSchema = z.object({
  nit: z.string().regex(/^([0-9]{14}|[0-9]{9})$/),
  nrc: z.string().regex(/^[0-9]{1,8}$/),
  nombre: z.string().min(3).max(200),
  codActividad: z.string().regex(/^[0-9]{2,6}$/),
  descActividad: z.string().min(1).max(150),
  nombreComercial: z.string().min(1).max(150).nullable(),
  tipoEstablecimiento: z.enum(['01', '02', '04', '07', '20']),
  direccion: direccionSchema,
  telefono: z.string().min(8).max(30),
  correo: z.string().email().max(100),
});

export const receptorCCFSchema = z.object({
  nit: z.string().regex(/^([0-9]{14}|[0-9]{9})$/),
  nrc: z.string().regex(/^[0-9]{1,8}$/),
  nombre: z.string().min(1).max(250),
  codActividad: z.string().regex(/^[0-9]{2,6}$/),
  descActividad: z.string().min(1).max(150),
  nombreComercial: z.string().min(1).max(150).nullable(),
  direccion: direccionSchema,
  telefono: z.string().min(8).max(30).nullable(),
  correo: z.string().email().max(100),
});

export const receptorFCSchema = z.object({
  tipoDocumento: z.enum(['36', '13', '02', '03', '37']).nullable(),
  numDocumento: z.string().min(1).max(20).nullable(),
  nrc: z.string().nullable(),
  nombre: z.string().max(250).nullable(),
  codActividad: z.string().nullable(),
  descActividad: z.string().nullable(),
  direccion: direccionSchema.nullable(),
  telefono: z.string().nullable(),
  correo: z.string().email().nullable(),
});

export const cuerpoDocumentoItemSchema = z.object({
  numItem: z.number().int().min(1).max(2000),
  tipoItem: z.number().int().min(1).max(4),
  cantidad: z.number().positive(),
  codigo: z.string().max(25).nullable(),
  uniMedida: z.number().int().min(1).max(99),
  descripcion: z.string().max(1000),
  precioUni: z.number(),
  montoDescu: z.number().min(0),
  ventaNoSuj: z.number().min(0),
  ventaExenta: z.number().min(0),
  ventaGravada: z.number().min(0),
  tributos: z.array(z.string().length(2)).nullable(),
});

export const resumenTributoSchema = z.object({
  codigo: z.string().length(2),
  descripcion: z.string().min(2).max(150),
  valor: z.number().min(0),
});

export const resumenSchema = z.object({
  totalNoSuj: z.number().min(0),
  totalExenta: z.number().min(0),
  totalGravada: z.number().min(0),
  subTotalVentas: z.number(),
  descuNoSuj: z.number().min(0),
  descuExenta: z.number().min(0),
  descuGravada: z.number().min(0),
  totalDescu: z.number().min(0),
  tributos: z.array(resumenTributoSchema).nullable(),
  subTotal: z.number().min(0),
  montoTotalOperacion: z.number().positive(),
  totalLetras: z.string().max(200),
  condicionOperacion: z.number().int().min(1).max(3),
});

export const identificacionSchema = z.object({
  version: z.number().int(),
  ambiente: z.enum(['00', '01']),
  tipoDte: z.enum(['01', '03', '05', '06']),
  numeroControl: z.string().length(31),
  codigoGeneracion: z.string().length(36),
  tipoModelo: z.number().int().min(1).max(2),
  tipoOperacion: z.number().int().min(1).max(2),
  tipoContingencia: z.number().int().min(1).max(5).nullable(),
  motivoContin: z.string().max(150).nullable(),
  fecEmi: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  horEmi: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/),
  tipoMoneda: z.literal('USD'),
});

export const extensionSchema = z.object({
  nombEntrega: z.string().max(100).nullable(),
  docuEntrega: z.string().max(25).nullable(),
  nombRecibe: z.string().max(100).nullable(),
  docuRecibe: z.string().max(25).nullable(),
  observaciones: z.string().max(3000).nullable(),
}).nullable();

export const apendiceSchema = z.object({
  campo: z.string().min(2).max(25),
  etiqueta: z.string().min(3).max(50),
  valor: z.string().min(1).max(150),
});
