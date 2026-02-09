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
exports.RecurringInvoiceScheduler = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
let RecurringInvoiceScheduler = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _handleDueTemplates_decorators;
    var RecurringInvoiceScheduler = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _handleDueTemplates_decorators = [(0, schedule_1.Cron)('0 1 * * *')];
            __esDecorate(this, null, _handleDueTemplates_decorators, { kind: "method", name: "handleDueTemplates", static: false, private: false, access: { has: obj => "handleDueTemplates" in obj, get: obj => obj.handleDueTemplates }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            RecurringInvoiceScheduler = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        recurringService = __runInitializers(this, _instanceExtraInitializers);
        recurringQueue;
        logger = new common_1.Logger(RecurringInvoiceScheduler.name);
        constructor(recurringService, recurringQueue) {
            this.recurringService = recurringService;
            this.recurringQueue = recurringQueue;
        }
        /**
         * Runs daily at 01:00 AM UTC.
         * Finds all ACTIVE templates with nextRunDate <= now and enqueues them.
         */
        async handleDueTemplates() {
            // Only run if Redis is configured
            if (!process.env.REDIS_URL) {
                this.logger.debug('Redis not configured, skipping recurring invoice scheduler');
                return;
            }
            this.logger.log('Checking for due recurring invoice templates...');
            try {
                const dueTemplates = await this.recurringService.getDueTemplates();
                this.logger.log(`Found ${dueTemplates.length} due templates`);
                for (const template of dueTemplates) {
                    await this.recurringQueue.add('process-recurring', { templateId: template.id }, {
                        attempts: 3,
                        backoff: {
                            type: 'exponential',
                            delay: 60000, // 60s base delay
                        },
                        removeOnComplete: 100, // Keep last 100 completed jobs
                        removeOnFail: 200, // Keep last 200 failed jobs
                    });
                    this.logger.log(`Enqueued template ${template.id} (${template.nombre})`);
                }
            }
            catch (error) {
                this.logger.error('Error in recurring invoice scheduler', error);
            }
        }
    };
    return RecurringInvoiceScheduler = _classThis;
})();
exports.RecurringInvoiceScheduler = RecurringInvoiceScheduler;
