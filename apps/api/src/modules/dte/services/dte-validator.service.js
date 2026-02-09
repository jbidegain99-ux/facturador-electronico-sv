"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DteValidatorService = void 0;
const common_1 = require("@nestjs/common");
const zod_1 = require("zod");
// Esquemas Zod basados en JSON Schemas oficiales del MH
const DireccionSchema = zod_1.z.object({
    departamento: zod_1.z.string().regex(/^0[1-9]|1[0-4]$/),
    municipio: zod_1.z.string().regex(/^[0-9]{2}$/),
    complemento: zod_1.z.string().min(1).max(200),
});
const IdentificacionBaseSchema = zod_1.z.object({
    version: zod_1.z.number().int(),
    ambiente: zod_1.z.enum(['00', '01']),
    tipoDte: zod_1.z.string(),
    numeroControl: zod_1.z.string().length(31),
    codigoGeneracion: zod_1.z.string().length(36).regex(/^[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}$/),
    tipoModelo: zod_1.z.union([zod_1.z.literal(1), zod_1.z.literal(2)]),
    tipoOperacion: zod_1.z.union([zod_1.z.literal(1), zod_1.z.literal(2)]),
    tipoContingencia: zod_1.z.union([zod_1.z.literal(1), zod_1.z.literal(2), zod_1.z.literal(3), zod_1.z.literal(4), zod_1.z.literal(5), zod_1.z.null()]),
    motivoContin: zod_1.z.string().max(150).nullable(),
    fecEmi: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    horEmi: zod_1.z.string().regex(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/),
    tipoMoneda: zod_1.z.literal('USD'),
});
const EmisorSchema = zod_1.z.object({
    nit: zod_1.z.string().regex(/^([0-9]{14}|[0-9]{9})$/),
    nrc: zod_1.z.string().regex(/^[0-9]{1,8}$/),
    nombre: zod_1.z.string().min(1).max(250),
    codActividad: zod_1.z.string().regex(/^[0-9]{2,6}$/),
    descActividad: zod_1.z.string().min(1).max(150),
    nombreComercial: zod_1.z.string().min(1).max(150).nullable(),
    tipoEstablecimiento: zod_1.z.enum(['01', '02', '04', '07', '20']),
    direccion: DireccionSchema,
    telefono: zod_1.z.string().min(8).max(30),
    correo: zod_1.z.string().email().max(100),
    codEstableMH: zod_1.z.string().length(4).nullable(),
    codEstable: zod_1.z.string().min(1).max(10).nullable(),
    codPuntoVentaMH: zod_1.z.string().length(4).nullable(),
    codPuntoVenta: zod_1.z.string().min(1).max(15).nullable(),
});
const ReceptorFacturaSchema = zod_1.z.object({
    tipoDocumento: zod_1.z.enum(['36', '13', '02', '03', '37']).nullable(),
    numDocumento: zod_1.z.string().min(3).max(20).nullable(),
    nrc: zod_1.z.string().regex(/^[0-9]{1,8}$/).nullable(),
    nombre: zod_1.z.string().min(1).max(250).nullable(),
    codActividad: zod_1.z.string().regex(/^[0-9]{2,6}$/).nullable(),
    descActividad: zod_1.z.string().min(5).max(150).nullable(),
    direccion: DireccionSchema.nullable(),
    telefono: zod_1.z.string().min(8).max(30).nullable(),
    correo: zod_1.z.string().email().max(100).nullable(),
}).nullable();
const ReceptorCCFSchema = zod_1.z.object({
    nit: zod_1.z.string().regex(/^([0-9]{14}|[0-9]{9})$/),
    nrc: zod_1.z.string().regex(/^[0-9]{1,8}$/),
    nombre: zod_1.z.string().min(1).max(250),
    codActividad: zod_1.z.string().regex(/^[0-9]{2,6}$/),
    descActividad: zod_1.z.string().min(1).max(150),
    nombreComercial: zod_1.z.string().min(1).max(150).nullable(),
    direccion: DireccionSchema,
    telefono: zod_1.z.string().min(8).max(30).nullable(),
    correo: zod_1.z.string().email().max(100),
});
const CuerpoDocumentoFacturaSchema = zod_1.z.object({
    numItem: zod_1.z.number().int().min(1).max(2000),
    tipoItem: zod_1.z.union([zod_1.z.literal(1), zod_1.z.literal(2), zod_1.z.literal(3), zod_1.z.literal(4)]),
    numeroDocumento: zod_1.z.string().min(1).max(36).nullable(),
    cantidad: zod_1.z.number().positive().lt(100000000000),
    codigo: zod_1.z.string().min(1).max(25).nullable(),
    codTributo: zod_1.z.enum(['A8', '57', '90', 'D4', 'D5', '25', 'A6']).nullable(),
    uniMedida: zod_1.z.number().int().min(1).max(99),
    descripcion: zod_1.z.string().max(1000),
    precioUni: zod_1.z.number().lt(100000000000),
    montoDescu: zod_1.z.number().min(0).lt(100000000000),
    ventaNoSuj: zod_1.z.number().min(0).lt(100000000000),
    ventaExenta: zod_1.z.number().min(0).lt(100000000000),
    ventaGravada: zod_1.z.number().min(0).lt(100000000000),
    tributos: zod_1.z.array(zod_1.z.string().length(2)).nullable(),
    psv: zod_1.z.number().min(0).lt(100000000000),
    noGravado: zod_1.z.number().lt(100000000000).gt(-100000000000),
    ivaItem: zod_1.z.number().min(0).lt(100000000000),
});
const TributoResumenSchema = zod_1.z.object({
    codigo: zod_1.z.string().length(2),
    descripcion: zod_1.z.string().min(2).max(150),
    valor: zod_1.z.number().min(0).lt(100000000000),
});
const PagoSchema = zod_1.z.object({
    codigo: zod_1.z.string().regex(/^(0[1-9]|1[0-4]|99)$/),
    montoPago: zod_1.z.number().min(0).lt(100000000000),
    referencia: zod_1.z.string().max(50).nullable(),
    plazo: zod_1.z.string().regex(/^0[1-3]$/).nullable(),
    periodo: zod_1.z.number().nullable(),
});
const ResumenFacturaSchema = zod_1.z.object({
    totalNoSuj: zod_1.z.number().min(0).lt(100000000000),
    totalExenta: zod_1.z.number().min(0).lt(100000000000),
    totalGravada: zod_1.z.number().min(0).lt(100000000000),
    subTotalVentas: zod_1.z.number().min(0).lt(100000000000),
    descuNoSuj: zod_1.z.number().min(0).lt(100000000000),
    descuExenta: zod_1.z.number().min(0).lt(100000000000),
    descuGravada: zod_1.z.number().min(0).lt(100000000000),
    porcentajeDescuento: zod_1.z.number().min(0).max(100),
    totalDescu: zod_1.z.number().min(0).lt(100000000000),
    tributos: zod_1.z.array(TributoResumenSchema).nullable(),
    subTotal: zod_1.z.number().min(0).lt(100000000000),
    ivaRete1: zod_1.z.number().min(0).lt(100000000000),
    reteRenta: zod_1.z.number().min(0).lt(100000000000),
    montoTotalOperacion: zod_1.z.number().min(0).lt(100000000000),
    totalNoGravado: zod_1.z.number().lt(100000000000).gt(-100000000000),
    totalPagar: zod_1.z.number().min(0).lt(100000000000),
    totalLetras: zod_1.z.string().max(200),
    totalIva: zod_1.z.number().min(0).lt(100000000000),
    saldoFavor: zod_1.z.number().max(0),
    condicionOperacion: zod_1.z.union([zod_1.z.literal(1), zod_1.z.literal(2), zod_1.z.literal(3)]),
    pagos: zod_1.z.array(PagoSchema).nullable(),
    numPagoElectronico: zod_1.z.string().max(100).nullable(),
});
const ExtensionSchema = zod_1.z.object({
    nombEntrega: zod_1.z.string().min(5).max(100).nullable(),
    docuEntrega: zod_1.z.string().min(5).max(25).nullable(),
    nombRecibe: zod_1.z.string().min(5).max(100).nullable(),
    docuRecibe: zod_1.z.string().min(5).max(25).nullable(),
    observaciones: zod_1.z.string().max(3000).nullable(),
    placaVehiculo: zod_1.z.string().max(10).nullable().optional(),
}).nullable();
const ApendiceSchema = zod_1.z.object({
    campo: zod_1.z.string().max(25),
    etiqueta: zod_1.z.string().max(50),
    valor: zod_1.z.string().max(150),
});
const DocumentoRelacionadoSchema = zod_1.z.object({
    tipoDocumento: zod_1.z.string(),
    tipoGeneracion: zod_1.z.union([zod_1.z.literal(1), zod_1.z.literal(2)]),
    numeroDocumento: zod_1.z.string().min(1).max(36),
    fechaEmision: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
const VentaTerceroSchema = zod_1.z.object({
    nit: zod_1.z.string().regex(/^([0-9]{14}|[0-9]{9})$/),
    nombre: zod_1.z.string().min(1).max(250),
}).nullable();
// Schema completo para Factura (01)
const FacturaSchema = zod_1.z.object({
    identificacion: IdentificacionBaseSchema.extend({
        version: zod_1.z.literal(1),
        tipoDte: zod_1.z.literal('01'),
        numeroControl: zod_1.z.string().regex(/^DTE-01-[A-Z0-9]{8}-[0-9]{15}$/),
    }),
    documentoRelacionado: zod_1.z.array(DocumentoRelacionadoSchema).nullable(),
    emisor: EmisorSchema,
    receptor: ReceptorFacturaSchema,
    otrosDocumentos: zod_1.z.array(zod_1.z.any()).nullable(),
    ventaTercero: VentaTerceroSchema,
    cuerpoDocumento: zod_1.z.array(CuerpoDocumentoFacturaSchema).min(1).max(2000),
    resumen: ResumenFacturaSchema,
    extension: ExtensionSchema,
    apendice: zod_1.z.array(ApendiceSchema).min(1).max(10).nullable(),
});
// Schema completo para CCF (03)
const CCFSchema = zod_1.z.object({
    identificacion: IdentificacionBaseSchema.extend({
        version: zod_1.z.literal(3),
        tipoDte: zod_1.z.literal('03'),
        numeroControl: zod_1.z.string().regex(/^DTE-03-[A-Z0-9]{8}-[0-9]{15}$/),
    }),
    documentoRelacionado: zod_1.z.array(DocumentoRelacionadoSchema).nullable(),
    emisor: EmisorSchema,
    receptor: ReceptorCCFSchema,
    otrosDocumentos: zod_1.z.array(zod_1.z.any()).nullable(),
    ventaTercero: VentaTerceroSchema,
    cuerpoDocumento: zod_1.z.array(zod_1.z.any()).min(1).max(2000),
    resumen: zod_1.z.any(),
    extension: ExtensionSchema,
    apendice: zod_1.z.array(ApendiceSchema).min(1).max(10).nullable(),
});
let DteValidatorService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var DteValidatorService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            DteValidatorService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        schemas = {
            '01': FacturaSchema,
            '03': CCFSchema,
        };
        validate(dte) {
            const tipoDte = dte.identificacion.tipoDte;
            const schema = this.schemas[tipoDte];
            if (!schema) {
                return {
                    valid: false,
                    errors: [{ path: 'identificacion.tipoDte', message: `Schema not implemented for type ${tipoDte}` }],
                };
            }
            const result = schema.safeParse(dte);
            if (result.success) {
                return { valid: true, errors: [] };
            }
            return {
                valid: false,
                errors: result.error.errors.map((err) => ({
                    path: err.path.join('.'),
                    message: err.message,
                })),
            };
        }
        validateNumeroControl(numeroControl, tipoDte) {
            const pattern = new RegExp(`^DTE-${tipoDte}-[A-Z0-9]{8}-[0-9]{15}$`);
            return pattern.test(numeroControl) && numeroControl.length === 31;
        }
        validateCodigoGeneracion(codigo) {
            const pattern = /^[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}$/;
            return pattern.test(codigo) && codigo.length === 36;
        }
        validateNIT(nit) {
            return /^([0-9]{14}|[0-9]{9})$/.test(nit);
        }
        validateNRC(nrc) {
            return /^[0-9]{1,8}$/.test(nrc);
        }
    };
    return DteValidatorService = _classThis;
})();
exports.DteValidatorService = DteValidatorService;
