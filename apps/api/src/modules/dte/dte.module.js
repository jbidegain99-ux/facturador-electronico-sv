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
exports.DteModule = void 0;
const common_1 = require("@nestjs/common");
const dte_controller_1 = require("./dte.controller");
const dte_builder_service_1 = require("./services/dte-builder.service");
const dte_validator_service_1 = require("./services/dte-validator.service");
const dte_service_1 = require("./dte.service");
const pdf_service_1 = require("./pdf.service");
const prisma_module_1 = require("../../prisma/prisma.module");
const signer_module_1 = require("../signer/signer.module");
const mh_auth_module_1 = require("../mh-auth/mh-auth.module");
let DteModule = (() => {
    let _classDecorators = [(0, common_1.Module)({
            imports: [prisma_module_1.PrismaModule, signer_module_1.SignerModule, mh_auth_module_1.MhAuthModule],
            controllers: [dte_controller_1.DteController],
            providers: [dte_builder_service_1.DteBuilderService, dte_validator_service_1.DteValidatorService, dte_service_1.DteService, pdf_service_1.PdfService],
            exports: [dte_builder_service_1.DteBuilderService, dte_validator_service_1.DteValidatorService, dte_service_1.DteService, pdf_service_1.PdfService],
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var DteModule = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            DteModule = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return DteModule = _classThis;
})();
exports.DteModule = DteModule;
