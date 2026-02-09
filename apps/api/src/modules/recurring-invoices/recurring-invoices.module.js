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
exports.RecurringInvoicesModule = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const prisma_module_1 = require("../../prisma/prisma.module");
const dte_module_1 = require("../dte/dte.module");
const recurring_invoices_controller_1 = require("./recurring-invoices.controller");
const recurring_invoices_service_1 = require("./recurring-invoices.service");
const recurring_invoice_processor_1 = require("./processors/recurring-invoice.processor");
const recurring_invoice_scheduler_1 = require("./schedulers/recurring-invoice.scheduler");
// Only register queue-dependent providers when Redis is available
const queueProviders = process.env.REDIS_URL
    ? [recurring_invoice_processor_1.RecurringInvoiceProcessor, recurring_invoice_scheduler_1.RecurringInvoiceScheduler]
    : [];
const queueImports = process.env.REDIS_URL
    ? [bullmq_1.BullModule.registerQueue({ name: 'recurring-invoices' })]
    : [];
let RecurringInvoicesModule = (() => {
    let _classDecorators = [(0, common_1.Module)({
            imports: [prisma_module_1.PrismaModule, dte_module_1.DteModule, ...queueImports],
            controllers: [recurring_invoices_controller_1.RecurringInvoicesController],
            providers: [recurring_invoices_service_1.RecurringInvoicesService, ...queueProviders],
            exports: [recurring_invoices_service_1.RecurringInvoicesService],
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RecurringInvoicesModule = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            RecurringInvoicesModule = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return RecurringInvoicesModule = _classThis;
})();
exports.RecurringInvoicesModule = RecurringInvoicesModule;
