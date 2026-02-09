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
exports.TransmitterService = void 0;
const common_1 = require("@nestjs/common");
const mh_client_1 = require("@facturador/mh-client");
const shared_1 = require("@facturador/shared");
let TransmitterService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var TransmitterService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            TransmitterService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        transmissionQueue;
        mhAuthService;
        signerService;
        logger = new common_1.Logger(TransmitterService.name);
        // In-memory storage (replace with database in production)
        dteRecords = new Map();
        dteLogs = new Map();
        constructor(transmissionQueue, mhAuthService, signerService) {
            this.transmissionQueue = transmissionQueue;
            this.mhAuthService = mhAuthService;
            this.signerService = signerService;
        }
        /**
         * Guarda un DTE en memoria (reemplazar con DB en producción)
         */
        saveDTE(record) {
            this.dteRecords.set(record.id, record);
            this.logger.log(`DTE saved: ${record.id} - ${record.codigoGeneracion}`);
        }
        /**
         * Obtiene un DTE por ID
         */
        getDTE(dteId) {
            return this.dteRecords.get(dteId);
        }
        /**
         * Obtiene un DTE por código de generación
         */
        getDTEByCodigoGeneracion(codigoGeneracion) {
            for (const record of this.dteRecords.values()) {
                if (record.codigoGeneracion === codigoGeneracion) {
                    return record;
                }
            }
            return undefined;
        }
        /**
         * Actualiza un DTE
         */
        updateDTE(dteId, updates) {
            const record = this.dteRecords.get(dteId);
            if (record) {
                const updated = { ...record, ...updates, updatedAt: new Date() };
                this.dteRecords.set(dteId, updated);
                return updated;
            }
            return undefined;
        }
        /**
         * Agrega un log para un DTE
         */
        addLog(log) {
            const logEntry = {
                ...log,
                id: crypto.randomUUID(),
                createdAt: new Date(),
            };
            const logs = this.dteLogs.get(log.dteId) || [];
            logs.push(logEntry);
            this.dteLogs.set(log.dteId, logs);
            this.logger.debug(`Log added for DTE ${log.dteId}: ${log.action} - ${log.status}`);
        }
        /**
         * Obtiene logs de un DTE
         */
        getLogs(dteId) {
            return this.dteLogs.get(dteId) || [];
        }
        /**
         * Transmite un DTE de forma síncrona (sin cola)
         */
        async transmitSync(dteId, nit, password, env = 'test') {
            const record = this.getDTE(dteId);
            if (!record) {
                throw new Error(`DTE not found: ${dteId}`);
            }
            this.updateDTE(dteId, { status: 'PROCESANDO' });
            this.addLog({
                dteId,
                action: 'TRANSMIT',
                status: 'SUCCESS',
                message: 'Iniciando transmisión',
            });
            try {
                // 1. Obtener token de autenticación
                this.logger.log(`Getting auth token for NIT: ${nit}`);
                const tokenInfo = await this.mhAuthService.getToken(nit, password, env);
                this.addLog({
                    dteId,
                    action: 'TRANSMIT',
                    status: 'SUCCESS',
                    message: 'Token obtenido',
                });
                // 2. Firmar el DTE si no está firmado
                let jwsFirmado = record.jwsFirmado;
                if (!jwsFirmado) {
                    if (!this.signerService.isCertificateLoaded()) {
                        throw new Error('No certificate loaded for signing');
                    }
                    this.logger.log(`Signing DTE: ${dteId}`);
                    jwsFirmado = await this.signerService.signDTE(record.jsonDte);
                    this.updateDTE(dteId, { jwsFirmado });
                    this.addLog({
                        dteId,
                        action: 'SIGN',
                        status: 'SUCCESS',
                        message: 'DTE firmado',
                    });
                }
                // 3. Preparar request para MH
                const request = {
                    ambiente: record.ambiente,
                    idEnvio: Date.now(),
                    version: shared_1.DTE_VERSIONS[record.tipoDte],
                    tipoDte: record.tipoDte,
                    documento: jwsFirmado,
                    codigoGeneracion: record.codigoGeneracion,
                };
                // 4. Enviar al MH
                this.logger.log(`Sending DTE to MH: ${record.codigoGeneracion}`);
                const response = await (0, mh_client_1.sendDTE)(tokenInfo.token, request, { env });
                // 5. Procesar respuesta exitosa
                this.updateDTE(dteId, {
                    status: 'PROCESADO',
                    selloRecibido: response.selloRecibido || undefined,
                    fhProcesamiento: response.fhProcesamiento,
                    observaciones: response.observaciones,
                });
                this.addLog({
                    dteId,
                    action: 'RESPONSE',
                    status: 'SUCCESS',
                    message: `DTE procesado: ${response.selloRecibido}`,
                    data: response,
                });
                this.logger.log(`DTE transmitted successfully: ${record.codigoGeneracion} - Sello: ${response.selloRecibido}`);
                return {
                    success: true,
                    dteId,
                    codigoGeneracion: record.codigoGeneracion,
                    status: 'PROCESADO',
                    selloRecibido: response.selloRecibido || undefined,
                    fhProcesamiento: response.fhProcesamiento,
                    observaciones: response.observaciones,
                };
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                const observaciones = error instanceof mh_client_1.MHReceptionError ? error.observaciones : undefined;
                this.updateDTE(dteId, {
                    status: 'RECHAZADO',
                    observaciones,
                    intentos: (record.intentos || 0) + 1,
                });
                this.addLog({
                    dteId,
                    action: 'ERROR',
                    status: 'FAILURE',
                    message: errorMessage,
                    data: { observaciones },
                });
                this.logger.error(`DTE transmission failed: ${record.codigoGeneracion} - ${errorMessage}`);
                return {
                    success: false,
                    dteId,
                    codigoGeneracion: record.codigoGeneracion,
                    status: 'RECHAZADO',
                    observaciones,
                    error: errorMessage,
                };
            }
        }
        /**
         * Encola un DTE para transmisión con reintentos
         */
        async transmitAsync(dteId, tenantId, nit, password, env = 'test') {
            if (!this.transmissionQueue) {
                this.logger.warn('Redis not configured, executing synchronously');
                const result = await this.transmitSync(dteId, nit, password, env);
                return {
                    jobId: 'sync',
                    message: result.success
                        ? `DTE transmitido síncronamente: ${result.selloRecibido}`
                        : `Error: ${result.error}`,
                };
            }
            const record = this.getDTE(dteId);
            if (!record) {
                throw new Error(`DTE not found: ${dteId}`);
            }
            if (record.status === 'PROCESADO') {
                throw new Error(`DTE already processed: ${dteId}`);
            }
            const jobData = {
                dteId,
                tenantId,
                nit,
                password,
                env,
            };
            const job = await this.transmissionQueue.add('transmit', jobData, {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 1000, // 1s, 2s, 4s
                },
                removeOnComplete: 100,
                removeOnFail: 100,
            });
            this.updateDTE(dteId, { status: 'PROCESANDO' });
            this.addLog({
                dteId,
                action: 'TRANSMIT',
                status: 'SUCCESS',
                message: `Job encolado: ${job.id}`,
            });
            this.logger.log(`DTE queued for transmission: ${dteId} - Job: ${job.id}`);
            return {
                jobId: job.id || '',
                message: `DTE encolado para transmisión. Job ID: ${job.id}`,
            };
        }
        /**
         * Consulta el estado de un DTE en el MH
         */
        async consultarEstado(codigoGeneracion, nit, password, env = 'test') {
            const tokenInfo = await this.mhAuthService.getToken(nit, password, env);
            return (0, mh_client_1.consultarDTE)(tokenInfo.token, codigoGeneracion, { env });
        }
        /**
         * Anula un DTE
         */
        async anular(dteId, motivo, nit, password, env = 'test') {
            const record = this.getDTE(dteId);
            if (!record) {
                throw new Error(`DTE not found: ${dteId}`);
            }
            if (record.status !== 'PROCESADO') {
                throw new Error(`Cannot cancel DTE with status: ${record.status}`);
            }
            try {
                const tokenInfo = await this.mhAuthService.getToken(nit, password, env);
                // Crear documento de anulación
                const anulacionDoc = {
                    identificacion: {
                        version: 2,
                        ambiente: record.ambiente,
                        codigoGeneracion: crypto.randomUUID().toUpperCase(),
                        fecAnula: new Date().toISOString().split('T')[0],
                        horAnula: new Date().toTimeString().split(' ')[0],
                    },
                    emisor: {
                        nit: nit.replace(/-/g, ''),
                        nombre: record.jsonDte.emisor.nombre,
                        tipoEstablecimiento: '01',
                        nomEstablecimiento: null,
                        codEstableMH: null,
                        codEstable: null,
                        codPuntoVentaMH: null,
                        codPuntoVenta: null,
                        telefono: record.jsonDte.emisor.telefono,
                        correo: record.jsonDte.emisor.correo,
                    },
                    documento: {
                        tipoDte: record.tipoDte,
                        codigoGeneracion: record.codigoGeneracion,
                        selloRecibido: record.selloRecibido,
                        numeroControl: record.numeroControl,
                        fecEmi: record.jsonDte.identificacion.fecEmi,
                        montoIva: 0,
                        codigoGeneracionR: null,
                        tipoDocumento: null,
                        numDocumento: null,
                        nombre: null,
                        telefono: null,
                        correo: null,
                    },
                    motivo: {
                        tipoAnulacion: 1,
                        motivoAnulacion: motivo,
                        nombreResponsable: 'Responsable',
                        tipDocResponsable: '36',
                        numDocResponsable: nit.replace(/-/g, ''),
                        nombreSolicita: 'Solicitante',
                        tipDocSolicita: '36',
                        numDocSolicita: nit.replace(/-/g, ''),
                    },
                };
                // Firmar documento de anulación
                const jwsAnulacion = await this.signerService.signDTE(anulacionDoc);
                // Enviar anulación
                const response = await (0, mh_client_1.anularDTE)(tokenInfo.token, {
                    ambiente: record.ambiente,
                    idEnvio: Date.now(),
                    version: 2,
                    documento: jwsAnulacion,
                }, { env });
                this.updateDTE(dteId, { status: 'ANULADO' });
                this.addLog({
                    dteId,
                    action: 'ANULAR',
                    status: 'SUCCESS',
                    message: `DTE anulado: ${response.selloRecibido}`,
                    data: { motivo },
                });
                return {
                    success: true,
                    dteId,
                    codigoGeneracion: record.codigoGeneracion,
                    status: 'ANULADO',
                    selloRecibido: response.selloRecibido || undefined,
                    fhProcesamiento: response.fhProcesamiento,
                };
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                this.addLog({
                    dteId,
                    action: 'ANULAR',
                    status: 'FAILURE',
                    message: errorMessage,
                });
                return {
                    success: false,
                    dteId,
                    codigoGeneracion: record.codigoGeneracion,
                    status: record.status,
                    error: errorMessage,
                };
            }
        }
        /**
         * Obtiene el estado de un job de transmisión
         */
        async getJobStatus(jobId) {
            if (!this.transmissionQueue) {
                return null;
            }
            const job = await this.transmissionQueue.getJob(jobId);
            if (!job) {
                return null;
            }
            const state = await job.getState();
            return {
                id: job.id || '',
                state,
                progress: job.progress,
                attemptsMade: job.attemptsMade,
                failedReason: job.failedReason,
            };
        }
    };
    return TransmitterService = _classThis;
})();
exports.TransmitterService = TransmitterService;
