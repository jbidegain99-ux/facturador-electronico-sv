"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apendiceSchema = exports.extensionSchema = exports.identificacionSchema = exports.resumenSchema = exports.resumenTributoSchema = exports.cuerpoDocumentoItemSchema = exports.receptorFCSchema = exports.receptorCCFSchema = exports.emisorSchema = exports.direccionSchema = void 0;
const zod_1 = require("zod");
exports.direccionSchema = zod_1.z.object({
    departamento: zod_1.z.string().regex(/^0[1-9]|1[0-4]$/),
    municipio: zod_1.z.string().regex(/^[0-9]{2}$/),
    complemento: zod_1.z.string().min(1).max(200),
});
exports.emisorSchema = zod_1.z.object({
    nit: zod_1.z.string().regex(/^([0-9]{14}|[0-9]{9})$/),
    nrc: zod_1.z.string().regex(/^[0-9]{1,8}$/),
    nombre: zod_1.z.string().min(3).max(200),
    codActividad: zod_1.z.string().regex(/^[0-9]{2,6}$/),
    descActividad: zod_1.z.string().min(1).max(150),
    nombreComercial: zod_1.z.string().min(1).max(150).nullable(),
    tipoEstablecimiento: zod_1.z.enum(['01', '02', '04', '07', '20']),
    direccion: exports.direccionSchema,
    telefono: zod_1.z.string().min(8).max(30),
    correo: zod_1.z.string().email().max(100),
});
exports.receptorCCFSchema = zod_1.z.object({
    nit: zod_1.z.string().regex(/^([0-9]{14}|[0-9]{9})$/),
    nrc: zod_1.z.string().regex(/^[0-9]{1,8}$/),
    nombre: zod_1.z.string().min(1).max(250),
    codActividad: zod_1.z.string().regex(/^[0-9]{2,6}$/),
    descActividad: zod_1.z.string().min(1).max(150),
    nombreComercial: zod_1.z.string().min(1).max(150).nullable(),
    direccion: exports.direccionSchema,
    telefono: zod_1.z.string().min(8).max(30).nullable(),
    correo: zod_1.z.string().email().max(100),
});
exports.receptorFCSchema = zod_1.z.object({
    tipoDocumento: zod_1.z.enum(['36', '13', '02', '03', '37']).nullable(),
    numDocumento: zod_1.z.string().min(1).max(20).nullable(),
    nrc: zod_1.z.string().nullable(),
    nombre: zod_1.z.string().max(250).nullable(),
    codActividad: zod_1.z.string().nullable(),
    descActividad: zod_1.z.string().nullable(),
    direccion: exports.direccionSchema.nullable(),
    telefono: zod_1.z.string().nullable(),
    correo: zod_1.z.string().email().nullable(),
});
exports.cuerpoDocumentoItemSchema = zod_1.z.object({
    numItem: zod_1.z.number().int().min(1).max(2000),
    tipoItem: zod_1.z.number().int().min(1).max(4),
    cantidad: zod_1.z.number().positive(),
    codigo: zod_1.z.string().max(25).nullable(),
    uniMedida: zod_1.z.number().int().min(1).max(99),
    descripcion: zod_1.z.string().max(1000),
    precioUni: zod_1.z.number(),
    montoDescu: zod_1.z.number().min(0),
    ventaNoSuj: zod_1.z.number().min(0),
    ventaExenta: zod_1.z.number().min(0),
    ventaGravada: zod_1.z.number().min(0),
    tributos: zod_1.z.array(zod_1.z.string().length(2)).nullable(),
});
exports.resumenTributoSchema = zod_1.z.object({
    codigo: zod_1.z.string().length(2),
    descripcion: zod_1.z.string().min(2).max(150),
    valor: zod_1.z.number().min(0),
});
exports.resumenSchema = zod_1.z.object({
    totalNoSuj: zod_1.z.number().min(0),
    totalExenta: zod_1.z.number().min(0),
    totalGravada: zod_1.z.number().min(0),
    subTotalVentas: zod_1.z.number(),
    descuNoSuj: zod_1.z.number().min(0),
    descuExenta: zod_1.z.number().min(0),
    descuGravada: zod_1.z.number().min(0),
    totalDescu: zod_1.z.number().min(0),
    tributos: zod_1.z.array(exports.resumenTributoSchema).nullable(),
    subTotal: zod_1.z.number().min(0),
    montoTotalOperacion: zod_1.z.number().positive(),
    totalLetras: zod_1.z.string().max(200),
    condicionOperacion: zod_1.z.number().int().min(1).max(3),
});
exports.identificacionSchema = zod_1.z.object({
    version: zod_1.z.number().int(),
    ambiente: zod_1.z.enum(['00', '01']),
    tipoDte: zod_1.z.enum(['01', '03', '05', '06']),
    numeroControl: zod_1.z.string().length(31),
    codigoGeneracion: zod_1.z.string().length(36),
    tipoModelo: zod_1.z.number().int().min(1).max(2),
    tipoOperacion: zod_1.z.number().int().min(1).max(2),
    tipoContingencia: zod_1.z.number().int().min(1).max(5).nullable(),
    motivoContin: zod_1.z.string().max(150).nullable(),
    fecEmi: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    horEmi: zod_1.z.string().regex(/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/),
    tipoMoneda: zod_1.z.literal('USD'),
});
exports.extensionSchema = zod_1.z.object({
    nombEntrega: zod_1.z.string().max(100).nullable(),
    docuEntrega: zod_1.z.string().max(25).nullable(),
    nombRecibe: zod_1.z.string().max(100).nullable(),
    docuRecibe: zod_1.z.string().max(25).nullable(),
    observaciones: zod_1.z.string().max(3000).nullable(),
}).nullable();
exports.apendiceSchema = zod_1.z.object({
    campo: zod_1.z.string().min(2).max(25),
    etiqueta: zod_1.z.string().min(3).max(50),
    valor: zod_1.z.string().min(1).max(150),
});
