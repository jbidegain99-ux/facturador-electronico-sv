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
exports.TransmitterModule = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const transmitter_service_1 = require("./transmitter.service");
const transmitter_controller_1 = require("./transmitter.controller");
const transmitter_processor_1 = require("./transmitter.processor");
const mh_auth_module_1 = require("../mh-auth/mh-auth.module");
const signer_module_1 = require("../signer/signer.module");
const dte_module_1 = require("../dte/dte.module");
const bullImports = process.env.REDIS_URL
    ? [
        bullmq_1.BullModule.registerQueue({
            name: 'dte-transmission',
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 1000,
                },
                removeOnComplete: 100,
                removeOnFail: 100,
            },
        }),
    ]
    : [];
const bullProviders = process.env.REDIS_URL ? [transmitter_processor_1.TransmitterProcessor] : [];
let TransmitterModule = (() => {
    let _classDecorators = [(0, common_1.Module)({
            imports: [...bullImports, mh_auth_module_1.MhAuthModule, signer_module_1.SignerModule, dte_module_1.DteModule],
            controllers: [transmitter_controller_1.TransmitterController],
            providers: [transmitter_service_1.TransmitterService, ...bullProviders],
            exports: [transmitter_service_1.TransmitterService],
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var TransmitterModule = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            TransmitterModule = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return TransmitterModule = _classThis;
})();
exports.TransmitterModule = TransmitterModule;
