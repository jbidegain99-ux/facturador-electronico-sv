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
exports.EmailHealthService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const email_types_1 = require("../types/email.types");
let EmailHealthService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _runScheduledHealthChecks_decorators;
    var EmailHealthService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _runScheduledHealthChecks_decorators = [(0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_10_MINUTES)];
            __esDecorate(this, null, _runScheduledHealthChecks_decorators, { kind: "method", name: "runScheduledHealthChecks", static: false, private: false, access: { has: obj => "runScheduledHealthChecks" in obj, get: obj => obj.runScheduledHealthChecks }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            EmailHealthService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma = __runInitializers(this, _instanceExtraInitializers);
        adapterFactory;
        logger = new common_1.Logger(EmailHealthService.name);
        constructor(prisma, adapterFactory) {
            this.prisma = prisma;
            this.adapterFactory = adapterFactory;
        }
        /**
         * Run health checks on all active email configurations
         * Runs every 15 minutes
         */
        async runScheduledHealthChecks() {
            this.logger.log('Starting scheduled email health checks...');
            const activeConfigs = await this.prisma.tenantEmailConfig.findMany({
                where: { isActive: true },
                include: { tenant: true },
            });
            let healthy = 0;
            let unhealthy = 0;
            for (const config of activeConfigs) {
                try {
                    const result = await this.checkHealth(config);
                    if (result.status === email_types_1.HealthStatus.HEALTHY) {
                        healthy++;
                    }
                    else {
                        unhealthy++;
                    }
                }
                catch (error) {
                    unhealthy++;
                    this.logger.error(`Health check failed for tenant ${config.tenantId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
            this.logger.log(`Health checks completed. Healthy: ${healthy}, Unhealthy: ${unhealthy}`);
        }
        /**
         * Check health of a single configuration
         */
        async checkHealth(config) {
            const adapter = this.adapterFactory.createAdapter(config);
            const startTime = Date.now();
            try {
                const result = await adapter.testConnection();
                const status = result.success
                    ? email_types_1.HealthStatus.HEALTHY
                    : email_types_1.HealthStatus.UNHEALTHY;
                // Record health check
                await this.prisma.emailHealthCheck.create({
                    data: {
                        configId: config.id,
                        checkType: 'CONNECTION_TEST',
                        status,
                        responseTimeMs: result.responseTimeMs,
                        errorMessage: result.errorMessage,
                        errorCode: result.errorCode,
                    },
                });
                // Check if OAuth token needs refresh
                if (config.oauth2RefreshToken &&
                    config.oauth2TokenExpiry &&
                    new Date(config.oauth2TokenExpiry) <
                        new Date(Date.now() + 24 * 60 * 60 * 1000)) {
                    await this.refreshOAuthToken(config);
                }
                if (adapter.dispose) {
                    await adapter.dispose();
                }
                return { status, responseTimeMs: result.responseTimeMs };
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                await this.prisma.emailHealthCheck.create({
                    data: {
                        configId: config.id,
                        checkType: 'CONNECTION_TEST',
                        status: email_types_1.HealthStatus.UNHEALTHY,
                        responseTimeMs: Date.now() - startTime,
                        errorMessage,
                    },
                });
                if (adapter.dispose) {
                    await adapter.dispose();
                }
                return { status: email_types_1.HealthStatus.UNHEALTHY, error: errorMessage };
            }
        }
        /**
         * Refresh OAuth token for configurations that need it
         */
        async refreshOAuthToken(config) {
            this.logger.log(`Refreshing OAuth token for tenant ${config.tenantId}`);
            const adapter = this.adapterFactory.createAdapter(config);
            if (!adapter.refreshOAuthToken) {
                return;
            }
            try {
                const result = await adapter.refreshOAuthToken();
                if (result.success) {
                    // The adapter updates its internal config, but we need to persist
                    // Note: In a real implementation, we'd need to encrypt and save the new tokens
                    await this.prisma.emailHealthCheck.create({
                        data: {
                            configId: config.id,
                            checkType: 'OAUTH_REFRESH',
                            status: email_types_1.HealthStatus.HEALTHY,
                        },
                    });
                    this.logger.log(`OAuth token refreshed successfully for tenant ${config.tenantId}`);
                }
                else {
                    await this.prisma.emailHealthCheck.create({
                        data: {
                            configId: config.id,
                            checkType: 'OAUTH_REFRESH',
                            status: email_types_1.HealthStatus.UNHEALTHY,
                            errorMessage: result.errorMessage,
                        },
                    });
                    this.logger.warn(`OAuth token refresh failed for tenant ${config.tenantId}: ${result.errorMessage}`);
                }
            }
            catch (error) {
                this.logger.error(`OAuth token refresh error for tenant ${config.tenantId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
            if (adapter.dispose) {
                await adapter.dispose();
            }
        }
        /**
         * Get health dashboard statistics (for admin)
         */
        async getDashboardStats() {
            const configs = await this.prisma.tenantEmailConfig.findMany({
                include: {
                    healthChecks: {
                        orderBy: { checkedAt: 'desc' },
                        take: 1,
                    },
                },
            });
            let healthy = 0;
            let degraded = 0;
            let unhealthy = 0;
            let pending = 0;
            for (const config of configs) {
                if (!config.isActive && !config.isVerified) {
                    pending++;
                    continue;
                }
                const lastCheck = config.healthChecks[0];
                if (!lastCheck) {
                    pending++;
                    continue;
                }
                switch (lastCheck.status) {
                    case email_types_1.HealthStatus.HEALTHY:
                        healthy++;
                        break;
                    case email_types_1.HealthStatus.DEGRADED:
                        degraded++;
                        break;
                    case email_types_1.HealthStatus.UNHEALTHY:
                        unhealthy++;
                        break;
                    default:
                        pending++;
                }
            }
            const total = configs.length;
            const healthPercentage = total > 0 ? Math.round((healthy / total) * 100) : 0;
            return {
                total,
                healthy,
                degraded,
                unhealthy,
                pending,
                healthPercentage,
            };
        }
        /**
         * Get all tenant health statuses (for admin dashboard)
         */
        async getAllTenantHealth() {
            const configs = await this.prisma.tenantEmailConfig.findMany({
                include: {
                    tenant: true,
                    healthChecks: {
                        orderBy: { checkedAt: 'desc' },
                        take: 1,
                    },
                },
            });
            return configs.map((config) => {
                const lastCheck = config.healthChecks[0];
                return {
                    tenantId: config.tenantId,
                    tenantName: config.tenant.nombre,
                    provider: config.provider,
                    status: lastCheck?.status || email_types_1.HealthStatus.UNKNOWN,
                    lastCheck: lastCheck?.checkedAt,
                    lastError: lastCheck?.errorMessage || undefined,
                    isActive: config.isActive,
                    isVerified: config.isVerified,
                };
            });
        }
        /**
         * Get tenants with issues (unhealthy or degraded)
         */
        async getTenantsWithIssues() {
            const allHealth = await this.getAllTenantHealth();
            return allHealth.filter((t) => t.status === email_types_1.HealthStatus.UNHEALTHY ||
                t.status === email_types_1.HealthStatus.DEGRADED);
        }
        /**
         * Force a health check for a specific tenant
         */
        async forceHealthCheck(tenantId) {
            const config = await this.prisma.tenantEmailConfig.findUnique({
                where: { tenantId },
            });
            if (!config) {
                throw new Error('Email configuration not found');
            }
            return this.checkHealth(config);
        }
    };
    return EmailHealthService = _classThis;
})();
exports.EmailHealthService = EmailHealthService;
