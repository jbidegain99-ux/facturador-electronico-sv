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
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bullmq_1 = require("@nestjs/bullmq");
const schedule_1 = require("@nestjs/schedule");
const auth_module_1 = require("./modules/auth/auth.module");
const tenants_module_1 = require("./modules/tenants/tenants.module");
const clientes_module_1 = require("./modules/clientes/clientes.module");
const dte_module_1 = require("./modules/dte/dte.module");
const signer_module_1 = require("./modules/signer/signer.module");
const transmitter_module_1 = require("./modules/transmitter/transmitter.module");
const catalog_module_1 = require("./modules/catalog/catalog.module");
const super_admin_module_1 = require("./modules/super-admin/super-admin.module");
const email_config_module_1 = require("./modules/email-config/email-config.module");
const onboarding_module_1 = require("./modules/onboarding/onboarding.module");
const support_module_1 = require("./modules/support/support.module");
const catalogos_admin_module_1 = require("./modules/catalogos-admin/catalogos-admin.module");
const plans_module_1 = require("./modules/plans/plans.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const audit_logs_module_1 = require("./modules/audit-logs/audit-logs.module");
const backups_module_1 = require("./modules/backups/backups.module");
const hacienda_module_1 = require("./modules/hacienda/hacienda.module");
const migration_module_1 = require("./modules/migration/migration.module");
const recurring_invoices_module_1 = require("./modules/recurring-invoices/recurring-invoices.module");
const prisma_module_1 = require("./prisma/prisma.module");
const health_module_1 = require("./health/health.module");
const imports = [
    config_1.ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: ['.env.local', '.env'],
    }),
    schedule_1.ScheduleModule.forRoot(),
    prisma_module_1.PrismaModule,
    health_module_1.HealthModule,
    auth_module_1.AuthModule,
    tenants_module_1.TenantsModule,
    clientes_module_1.ClientesModule,
    dte_module_1.DteModule,
    signer_module_1.SignerModule,
    transmitter_module_1.TransmitterModule,
    catalog_module_1.CatalogModule,
    super_admin_module_1.SuperAdminModule,
    email_config_module_1.EmailConfigModule,
    onboarding_module_1.OnboardingModule,
    support_module_1.SupportModule,
    catalogos_admin_module_1.CatalogosAdminModule,
    plans_module_1.PlansModule,
    notifications_module_1.NotificationsModule,
    audit_logs_module_1.AuditLogsModule,
    backups_module_1.BackupsModule,
    hacienda_module_1.HaciendaModule,
    migration_module_1.MigrationModule,
    recurring_invoices_module_1.RecurringInvoicesModule,
];
if (process.env.REDIS_URL) {
    imports.push(bullmq_1.BullModule.forRoot({
        connection: { url: process.env.REDIS_URL },
    }));
}
let AppModule = (() => {
    let _classDecorators = [(0, common_1.Module)({ imports })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var AppModule = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AppModule = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return AppModule = _classThis;
})();
exports.AppModule = AppModule;
