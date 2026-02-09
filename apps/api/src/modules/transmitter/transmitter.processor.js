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
exports.TransmitterProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
let TransmitterProcessor = (() => {
    let _classDecorators = [(0, bullmq_1.Processor)('dte-transmission')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = bullmq_1.WorkerHost;
    let _instanceExtraInitializers = [];
    let _onCompleted_decorators;
    let _onFailed_decorators;
    let _onProgress_decorators;
    var TransmitterProcessor = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _onCompleted_decorators = [(0, bullmq_1.OnWorkerEvent)('completed')];
            _onFailed_decorators = [(0, bullmq_1.OnWorkerEvent)('failed')];
            _onProgress_decorators = [(0, bullmq_1.OnWorkerEvent)('progress')];
            __esDecorate(this, null, _onCompleted_decorators, { kind: "method", name: "onCompleted", static: false, private: false, access: { has: obj => "onCompleted" in obj, get: obj => obj.onCompleted }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _onFailed_decorators, { kind: "method", name: "onFailed", static: false, private: false, access: { has: obj => "onFailed" in obj, get: obj => obj.onFailed }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _onProgress_decorators, { kind: "method", name: "onProgress", static: false, private: false, access: { has: obj => "onProgress" in obj, get: obj => obj.onProgress }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            TransmitterProcessor = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        transmitterService = __runInitializers(this, _instanceExtraInitializers);
        logger = new common_1.Logger(TransmitterProcessor.name);
        constructor(transmitterService) {
            super();
            this.transmitterService = transmitterService;
        }
        async process(job) {
            const { dteId, nit, password, env } = job.data;
            this.logger.log(`Processing job ${job.id} for DTE: ${dteId} (Attempt ${job.attemptsMade + 1})`);
            try {
                const result = await this.transmitterService.transmitSync(dteId, nit, password, env);
                if (!result.success) {
                    // Si falla, lanzar error para que BullMQ haga retry
                    throw new Error(result.error || 'Transmission failed');
                }
                this.logger.log(`Job ${job.id} completed successfully for DTE: ${dteId}`);
                return {
                    success: true,
                    result,
                };
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                this.logger.error(`Job ${job.id} failed for DTE: ${dteId} - ${errorMessage}`);
                // Si es el último intento, marcar como rechazado
                if (job.attemptsMade >= (job.opts.attempts || 3) - 1) {
                    this.transmitterService.updateDTE(dteId, { status: 'RECHAZADO' });
                    this.transmitterService.addLog({
                        dteId,
                        action: 'ERROR',
                        status: 'FAILURE',
                        message: `Transmisión fallida después de ${job.attemptsMade + 1} intentos: ${errorMessage}`,
                    });
                }
                else {
                    this.transmitterService.addLog({
                        dteId,
                        action: 'RETRY',
                        status: 'FAILURE',
                        message: `Reintento ${job.attemptsMade + 1} fallido: ${errorMessage}`,
                    });
                }
                throw error;
            }
        }
        onCompleted(job) {
            this.logger.log(`Job ${job.id} completed for DTE: ${job.data.dteId}`);
        }
        onFailed(job, error) {
            this.logger.error(`Job ${job.id} failed for DTE: ${job.data.dteId} - ${error.message}`);
        }
        onProgress(job, progress) {
            this.logger.debug(`Job ${job.id} progress: ${progress}%`);
        }
    };
    return TransmitterProcessor = _classThis;
})();
exports.TransmitterProcessor = TransmitterProcessor;
