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
exports.RecurringInvoiceProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
let RecurringInvoiceProcessor = (() => {
    let _classDecorators = [(0, bullmq_1.Processor)('recurring-invoices')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = bullmq_1.WorkerHost;
    var RecurringInvoiceProcessor = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            RecurringInvoiceProcessor = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        dteService;
        recurringService;
        logger = new common_1.Logger(RecurringInvoiceProcessor.name);
        constructor(prisma, dteService, recurringService) {
            super();
            this.prisma = prisma;
            this.dteService = dteService;
            this.recurringService = recurringService;
        }
        async process(job) {
            const { templateId } = job.data;
            this.logger.log(`Processing recurring invoice template: ${templateId}`);
            try {
                const template = await this.prisma.recurringInvoiceTemplate.findUnique({
                    where: { id: templateId },
                    include: {
                        cliente: true,
                        tenant: true,
                    },
                });
                if (!template) {
                    this.logger.warn(`Template ${templateId} not found, skipping`);
                    return;
                }
                if (template.status !== 'ACTIVE') {
                    this.logger.warn(`Template ${templateId} is ${template.status}, skipping`);
                    return;
                }
                // Parse items from JSON
                const items = JSON.parse(template.items);
                // Build DTE body data matching the structure DteService.createDte expects
                const dteData = this.buildDteData(template, items);
                // Create the DTE
                const dte = await this.dteService.createDte(template.tenantId, template.tipoDte, dteData);
                // If mode is AUTO_SEND and autoTransmit, sign and transmit
                if (template.mode === 'AUTO_SEND' && template.autoTransmit) {
                    try {
                        await this.dteService.signDte(dte.id);
                        // Transmit needs nit and password from tenant config - skip if not available
                        this.logger.log(`DTE ${dte.id} created and signed for template ${templateId}`);
                    }
                    catch (signError) {
                        this.logger.warn(`DTE ${dte.id} created but signing failed: ${signError}`);
                    }
                }
                await this.recurringService.recordSuccess(templateId, dte.id);
                this.logger.log(`Successfully processed template ${templateId}, DTE ${dte.id}`);
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logger.error(`Failed to process template ${templateId}: ${errorMessage}`);
                await this.recurringService.recordFailure(templateId, errorMessage);
                throw error; // Let BullMQ handle retries
            }
        }
        buildDteData(template, items) {
            const now = new Date();
            const fecha = now.toISOString().split('T')[0];
            const hora = now.toTimeString().split(' ')[0];
            // Calculate totals
            let totalGravada = 0;
            const cuerpoDocumento = items.map((item, index) => {
                const ventaGravada = item.cantidad * item.precioUnitario - item.descuento;
                totalGravada += ventaGravada;
                return {
                    numItem: index + 1,
                    tipoItem: 1,
                    cantidad: item.cantidad,
                    codigo: null,
                    descripcion: item.descripcion,
                    precioUni: item.precioUnitario,
                    montoDescu: item.descuento,
                    ventaGravada,
                    noGravado: 0,
                };
            });
            const ivaRate = 0.13;
            const totalIva = Math.round(totalGravada * ivaRate * 100) / 100;
            const totalPagar = Math.round((totalGravada + totalIva) * 100) / 100;
            // Parse stored address or use empty
            let direccion = {};
            try {
                direccion = template.cliente.direccion ? JSON.parse(template.cliente.direccion) : {};
            }
            catch {
                direccion = {};
            }
            return {
                identificacion: {
                    version: template.tipoDte === '01' ? 1 : 3,
                    ambiente: '00',
                    tipoDte: template.tipoDte,
                    tipoModelo: 1,
                    tipoOperacion: 1,
                    tipoContingencia: null,
                    motivoContin: null,
                    fecEmi: fecha,
                    horEmi: hora,
                },
                emisor: {
                    nit: template.tenant.nit?.replace(/-/g, '') || '',
                    nrc: template.tenant.nrc?.replace(/-/g, '') || '',
                    nombre: template.tenant.nombre,
                    codActividad: template.tenant.actividadEcon || '',
                    descActividad: '',
                    telefono: template.tenant.telefono?.replace(/-/g, '') || '',
                    correo: template.tenant.correo || '',
                    codEstableMH: '0000',
                    codEstable: '0000',
                    codPuntoVentaMH: '0000',
                    codPuntoVenta: '0000',
                    direccion: (() => { try {
                        return JSON.parse(template.tenant.direccion);
                    }
                    catch {
                        return {};
                    } })(),
                },
                receptor: {
                    tipoDocumento: template.cliente.tipoDocumento,
                    numDocumento: template.cliente.numDocumento?.replace(/-/g, '') || '',
                    nombre: template.cliente.nombre,
                    nrc: template.cliente.nrc?.replace(/-/g, '') || null,
                    correo: template.cliente.correo || '',
                    telefono: template.cliente.telefono?.replace(/-/g, '') || '',
                    direccion,
                },
                cuerpoDocumento,
                resumen: {
                    totalGravada,
                    totalIva,
                    subTotalVentas: totalGravada,
                    totalPagar,
                    totalLetras: '',
                    condicionOperacion: 1,
                },
                ...(template.notas ? { extension: { observaciones: template.notas } } : {}),
            };
        }
    };
    return RecurringInvoiceProcessor = _classThis;
})();
exports.RecurringInvoiceProcessor = RecurringInvoiceProcessor;
