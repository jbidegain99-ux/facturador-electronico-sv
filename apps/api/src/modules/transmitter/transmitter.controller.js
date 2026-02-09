"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransmitterController = exports.ConsultarDto = exports.AnularDto = exports.CreateAndTransmitDto = exports.TransmitDto = void 0;
const common_1 = require("@nestjs/common");
class TransmitDto {
    nit;
    password;
    env;
    async;
}
exports.TransmitDto = TransmitDto;
class CreateAndTransmitDto {
    nit;
    password;
    env;
    tenantId;
    tipoDte;
    ambiente;
    emisor;
    receptor;
    items;
    codEstablecimiento;
    correlativo;
    condicionOperacion;
}
exports.CreateAndTransmitDto = CreateAndTransmitDto;
class AnularDto {
    nit;
    password;
    env;
    motivo;
}
exports.AnularDto = AnularDto;
class ConsultarDto {
    nit;
    password;
    env;
}
exports.ConsultarDto = ConsultarDto;
let TransmitterController = (() => {
    let _classDecorators = [(0, common_1.Controller)('transmitter')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _sendDTE_decorators;
    let _createAndSend_decorators;
    let _getStatus_decorators;
    let _getDTE_decorators;
    let _getDTEJson_decorators;
    let _getDTELogs_decorators;
    let _anularDTE_decorators;
    let _getJobStatus_decorators;
    var TransmitterController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _sendDTE_decorators = [(0, common_1.Post)('send/:dteId')];
            _createAndSend_decorators = [(0, common_1.Post)('create-and-send')];
            _getStatus_decorators = [(0, common_1.Get)('status/:codigoGeneracion')];
            _getDTE_decorators = [(0, common_1.Get)('dte/:dteId')];
            _getDTEJson_decorators = [(0, common_1.Get)('dte/:dteId/json')];
            _getDTELogs_decorators = [(0, common_1.Get)('dte/:dteId/logs')];
            _anularDTE_decorators = [(0, common_1.Post)('anular/:dteId')];
            _getJobStatus_decorators = [(0, common_1.Get)('job/:jobId')];
            __esDecorate(this, null, _sendDTE_decorators, { kind: "method", name: "sendDTE", static: false, private: false, access: { has: obj => "sendDTE" in obj, get: obj => obj.sendDTE }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _createAndSend_decorators, { kind: "method", name: "createAndSend", static: false, private: false, access: { has: obj => "createAndSend" in obj, get: obj => obj.createAndSend }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getStatus_decorators, { kind: "method", name: "getStatus", static: false, private: false, access: { has: obj => "getStatus" in obj, get: obj => obj.getStatus }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getDTE_decorators, { kind: "method", name: "getDTE", static: false, private: false, access: { has: obj => "getDTE" in obj, get: obj => obj.getDTE }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getDTEJson_decorators, { kind: "method", name: "getDTEJson", static: false, private: false, access: { has: obj => "getDTEJson" in obj, get: obj => obj.getDTEJson }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getDTELogs_decorators, { kind: "method", name: "getDTELogs", static: false, private: false, access: { has: obj => "getDTELogs" in obj, get: obj => obj.getDTELogs }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _anularDTE_decorators, { kind: "method", name: "anularDTE", static: false, private: false, access: { has: obj => "anularDTE" in obj, get: obj => obj.anularDTE }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getJobStatus_decorators, { kind: "method", name: "getJobStatus", static: false, private: false, access: { has: obj => "getJobStatus" in obj, get: obj => obj.getJobStatus }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            TransmitterController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        transmitterService = __runInitializers(this, _instanceExtraInitializers);
        dteBuilder;
        constructor(transmitterService, dteBuilder) {
            this.transmitterService = transmitterService;
            this.dteBuilder = dteBuilder;
        }
        async sendDTE(dteId, dto) {
            const record = this.transmitterService.getDTE(dteId);
            if (!record) {
                throw new common_1.HttpException(`DTE not found: ${dteId}`, common_1.HttpStatus.NOT_FOUND);
            }
            try {
                if (dto.async) {
                    const result = await this.transmitterService.transmitAsync(dteId, record.tenantId, dto.nit, dto.password, dto.env || 'test');
                    return {
                        success: true,
                        message: result.message,
                        jobId: result.jobId,
                        dteId,
                    };
                }
                else {
                    const result = await this.transmitterService.transmitSync(dteId, dto.nit, dto.password, dto.env || 'test');
                    return result;
                }
            }
            catch (error) {
                throw new common_1.HttpException({
                    success: false,
                    error: error instanceof Error ? error.message : 'Transmission failed',
                }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async createAndSend(dto) {
            try {
                // 1. Build the DTE
                let dte;
                const buildInput = {
                    emisor: dto.emisor,
                    receptor: dto.receptor,
                    items: dto.items,
                    codEstablecimiento: dto.codEstablecimiento,
                    correlativo: dto.correlativo,
                    ambiente: dto.ambiente,
                    condicionOperacion: dto.condicionOperacion,
                };
                if (dto.tipoDte === '01') {
                    dte = this.dteBuilder.buildFactura(buildInput);
                }
                else if (dto.tipoDte === '03') {
                    if (!dto.receptor) {
                        throw new Error('Receptor is required for CCF');
                    }
                    dte = this.dteBuilder.buildCCF(buildInput);
                }
                else {
                    throw new Error(`DTE type ${dto.tipoDte} not implemented yet`);
                }
                // 2. Create DTE record
                const dteId = crypto.randomUUID();
                const record = {
                    id: dteId,
                    tenantId: dto.tenantId,
                    codigoGeneracion: dte.identificacion.codigoGeneracion,
                    numeroControl: dte.identificacion.numeroControl,
                    tipoDte: dto.tipoDte,
                    ambiente: dto.ambiente || '00',
                    status: 'PENDIENTE',
                    jsonDte: dte,
                    intentos: 0,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                this.transmitterService.saveDTE(record);
                // 3. Transmit
                const result = await this.transmitterService.transmitSync(dteId, dto.nit, dto.password, dto.env || 'test');
                return {
                    ...result,
                    dte,
                };
            }
            catch (error) {
                throw new common_1.HttpException({
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to create and send DTE',
                }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async getStatus(codigoGeneracion, query) {
            // First check local record
            const record = this.transmitterService.getDTEByCodigoGeneracion(codigoGeneracion);
            if (record) {
                return {
                    source: 'local',
                    dteId: record.id,
                    codigoGeneracion: record.codigoGeneracion,
                    status: record.status,
                    selloRecibido: record.selloRecibido,
                    fhProcesamiento: record.fhProcesamiento,
                    observaciones: record.observaciones,
                    intentos: record.intentos,
                };
            }
            // If not found locally and credentials provided, check MH
            if (query.nit && query.password) {
                try {
                    const mhStatus = await this.transmitterService.consultarEstado(codigoGeneracion, query.nit, query.password, query.env || 'test');
                    return {
                        source: 'mh',
                        ...mhStatus,
                    };
                }
                catch (error) {
                    throw new common_1.HttpException({
                        success: false,
                        error: error instanceof Error ? error.message : 'Failed to query MH',
                    }, common_1.HttpStatus.BAD_GATEWAY);
                }
            }
            throw new common_1.HttpException(`DTE not found: ${codigoGeneracion}`, common_1.HttpStatus.NOT_FOUND);
        }
        getDTE(dteId) {
            const record = this.transmitterService.getDTE(dteId);
            if (!record) {
                throw new common_1.HttpException(`DTE not found: ${dteId}`, common_1.HttpStatus.NOT_FOUND);
            }
            return {
                id: record.id,
                tenantId: record.tenantId,
                codigoGeneracion: record.codigoGeneracion,
                numeroControl: record.numeroControl,
                tipoDte: record.tipoDte,
                ambiente: record.ambiente,
                status: record.status,
                selloRecibido: record.selloRecibido,
                fhProcesamiento: record.fhProcesamiento,
                observaciones: record.observaciones,
                intentos: record.intentos,
                createdAt: record.createdAt,
                updatedAt: record.updatedAt,
            };
        }
        getDTEJson(dteId) {
            const record = this.transmitterService.getDTE(dteId);
            if (!record) {
                throw new common_1.HttpException(`DTE not found: ${dteId}`, common_1.HttpStatus.NOT_FOUND);
            }
            return record.jsonDte;
        }
        getDTELogs(dteId) {
            const record = this.transmitterService.getDTE(dteId);
            if (!record) {
                throw new common_1.HttpException(`DTE not found: ${dteId}`, common_1.HttpStatus.NOT_FOUND);
            }
            return this.transmitterService.getLogs(dteId);
        }
        async anularDTE(dteId, dto) {
            const record = this.transmitterService.getDTE(dteId);
            if (!record) {
                throw new common_1.HttpException(`DTE not found: ${dteId}`, common_1.HttpStatus.NOT_FOUND);
            }
            try {
                const result = await this.transmitterService.anular(dteId, dto.motivo, dto.nit, dto.password, dto.env || 'test');
                return result;
            }
            catch (error) {
                throw new common_1.HttpException({
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to cancel DTE',
                }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async getJobStatus(jobId) {
            const status = await this.transmitterService.getJobStatus(jobId);
            if (!status) {
                throw new common_1.HttpException(`Job not found: ${jobId}`, common_1.HttpStatus.NOT_FOUND);
            }
            return status;
        }
    };
    return TransmitterController = _classThis;
})();
exports.TransmitterController = TransmitterController;
