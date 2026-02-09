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
exports.EmailConfigAdminController = exports.EmailConfigController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const passport_1 = require("@nestjs/passport");
const super_admin_guard_1 = require("../super-admin/guards/super-admin.guard");
const email_types_1 = require("./types/email.types");
let EmailConfigController = (() => {
    let _classDecorators = [(0, swagger_1.ApiTags)('email-config'), (0, common_1.Controller)('email-config'), (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')), (0, swagger_1.ApiBearerAuth)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _getConfig_decorators;
    let _createOrUpdateConfig_decorators;
    let _updateConfig_decorators;
    let _deleteConfig_decorators;
    let _testConnection_decorators;
    let _sendTestEmail_decorators;
    let _setActive_decorators;
    let _getSendLogs_decorators;
    let _requestAssistance_decorators;
    let _getMyRequests_decorators;
    let _getRequest_decorators;
    let _addMessageToRequest_decorators;
    let _getHealth_decorators;
    var EmailConfigController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _getConfig_decorators = [(0, common_1.Get)(), (0, swagger_1.ApiOperation)({ summary: 'Get current tenant email configuration' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Email configuration retrieved' }), (0, swagger_1.ApiResponse)({ status: 400, description: 'Only tenant users can access email configuration' }), (0, swagger_1.ApiResponse)({ status: 404, description: 'Configuration not found' })];
            _createOrUpdateConfig_decorators = [(0, common_1.Post)(), (0, swagger_1.ApiOperation)({ summary: 'Create or update email configuration' }), (0, swagger_1.ApiResponse)({ status: 201, description: 'Configuration created/updated' }), (0, swagger_1.ApiResponse)({ status: 400, description: 'Only tenant users can configure email' })];
            _updateConfig_decorators = [(0, common_1.Patch)(), (0, swagger_1.ApiOperation)({ summary: 'Update email configuration' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Configuration updated' }), (0, swagger_1.ApiResponse)({ status: 400, description: 'Only tenant users can update email configuration' })];
            _deleteConfig_decorators = [(0, common_1.Delete)(), (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT), (0, swagger_1.ApiOperation)({ summary: 'Delete email configuration' }), (0, swagger_1.ApiResponse)({ status: 204, description: 'Configuration deleted' }), (0, swagger_1.ApiResponse)({ status: 400, description: 'Only tenant users can delete email configuration' })];
            _testConnection_decorators = [(0, common_1.Post)('test-connection'), (0, swagger_1.ApiOperation)({ summary: 'Test email configuration connection' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Connection test result' }), (0, swagger_1.ApiResponse)({ status: 400, description: 'Only tenant users can test connection' })];
            _sendTestEmail_decorators = [(0, common_1.Post)('send-test'), (0, swagger_1.ApiOperation)({ summary: 'Send a test email' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Test email result' }), (0, swagger_1.ApiResponse)({ status: 400, description: 'Only tenant users can send test emails' })];
            _setActive_decorators = [(0, common_1.Patch)('activate'), (0, swagger_1.ApiOperation)({ summary: 'Activate or deactivate email sending' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Activation status updated' }), (0, swagger_1.ApiResponse)({ status: 400, description: 'Only tenant users can activate/deactivate email' })];
            _getSendLogs_decorators = [(0, common_1.Get)('logs'), (0, swagger_1.ApiOperation)({ summary: 'Get email send logs' }), (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }), (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Email send logs' }), (0, swagger_1.ApiResponse)({ status: 400, description: 'Only tenant users can view email logs' })];
            _requestAssistance_decorators = [(0, common_1.Post)('request-assistance'), (0, swagger_1.ApiOperation)({ summary: 'Request email configuration assistance' }), (0, swagger_1.ApiResponse)({ status: 201, description: 'Assistance request created' }), (0, swagger_1.ApiResponse)({ status: 400, description: 'Only tenant users can request assistance' })];
            _getMyRequests_decorators = [(0, common_1.Get)('requests'), (0, swagger_1.ApiOperation)({ summary: 'Get tenant assistance requests' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Assistance requests list' }), (0, swagger_1.ApiResponse)({ status: 400, description: 'Only tenant users can view their requests' })];
            _getRequest_decorators = [(0, common_1.Get)('requests/:id'), (0, swagger_1.ApiOperation)({ summary: 'Get specific assistance request' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Assistance request details' }), (0, swagger_1.ApiResponse)({ status: 400, description: 'Only tenant users can view their requests' })];
            _addMessageToRequest_decorators = [(0, common_1.Post)('requests/:id/messages'), (0, swagger_1.ApiOperation)({ summary: 'Add message to assistance request' }), (0, swagger_1.ApiResponse)({ status: 201, description: 'Message added' }), (0, swagger_1.ApiResponse)({ status: 400, description: 'Only tenant users can add messages to their requests' })];
            _getHealth_decorators = [(0, common_1.Get)('health'), (0, swagger_1.ApiOperation)({ summary: 'Get email configuration health status' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Health status' }), (0, swagger_1.ApiResponse)({ status: 400, description: 'Only tenant users can view health status' })];
            __esDecorate(this, null, _getConfig_decorators, { kind: "method", name: "getConfig", static: false, private: false, access: { has: obj => "getConfig" in obj, get: obj => obj.getConfig }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _createOrUpdateConfig_decorators, { kind: "method", name: "createOrUpdateConfig", static: false, private: false, access: { has: obj => "createOrUpdateConfig" in obj, get: obj => obj.createOrUpdateConfig }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _updateConfig_decorators, { kind: "method", name: "updateConfig", static: false, private: false, access: { has: obj => "updateConfig" in obj, get: obj => obj.updateConfig }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _deleteConfig_decorators, { kind: "method", name: "deleteConfig", static: false, private: false, access: { has: obj => "deleteConfig" in obj, get: obj => obj.deleteConfig }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _testConnection_decorators, { kind: "method", name: "testConnection", static: false, private: false, access: { has: obj => "testConnection" in obj, get: obj => obj.testConnection }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _sendTestEmail_decorators, { kind: "method", name: "sendTestEmail", static: false, private: false, access: { has: obj => "sendTestEmail" in obj, get: obj => obj.sendTestEmail }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _setActive_decorators, { kind: "method", name: "setActive", static: false, private: false, access: { has: obj => "setActive" in obj, get: obj => obj.setActive }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getSendLogs_decorators, { kind: "method", name: "getSendLogs", static: false, private: false, access: { has: obj => "getSendLogs" in obj, get: obj => obj.getSendLogs }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _requestAssistance_decorators, { kind: "method", name: "requestAssistance", static: false, private: false, access: { has: obj => "requestAssistance" in obj, get: obj => obj.requestAssistance }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getMyRequests_decorators, { kind: "method", name: "getMyRequests", static: false, private: false, access: { has: obj => "getMyRequests" in obj, get: obj => obj.getMyRequests }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getRequest_decorators, { kind: "method", name: "getRequest", static: false, private: false, access: { has: obj => "getRequest" in obj, get: obj => obj.getRequest }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _addMessageToRequest_decorators, { kind: "method", name: "addMessageToRequest", static: false, private: false, access: { has: obj => "addMessageToRequest" in obj, get: obj => obj.addMessageToRequest }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getHealth_decorators, { kind: "method", name: "getHealth", static: false, private: false, access: { has: obj => "getHealth" in obj, get: obj => obj.getHealth }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            EmailConfigController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        emailConfigService = __runInitializers(this, _instanceExtraInitializers);
        emailHealthService;
        emailAssistanceService;
        constructor(emailConfigService, emailHealthService, emailAssistanceService) {
            this.emailConfigService = emailConfigService;
            this.emailHealthService = emailHealthService;
            this.emailAssistanceService = emailAssistanceService;
        }
        // =========================================================================
        // TENANT EMAIL CONFIGURATION ENDPOINTS
        // =========================================================================
        async getConfig(user) {
            if (!user.tenantId) {
                throw new common_1.BadRequestException('Solo usuarios de una empresa pueden acceder a la configuración de email');
            }
            const config = await this.emailConfigService.getConfig(user.tenantId);
            if (!config) {
                return {
                    configured: false,
                    message: 'No email configuration found. Please configure your email settings.',
                };
            }
            // Don't expose sensitive fields
            return {
                configured: true,
                id: config.id,
                provider: config.provider,
                authMethod: config.authMethod,
                isActive: config.isActive,
                isVerified: config.isVerified,
                fromEmail: config.fromEmail,
                fromName: config.fromName,
                replyToEmail: config.replyToEmail,
                rateLimitPerHour: config.rateLimitPerHour,
                configuredBy: config.configuredBy,
                lastTestAt: config.lastTestAt,
                verifiedAt: config.verifiedAt,
                createdAt: config.createdAt,
                updatedAt: config.updatedAt,
            };
        }
        async createOrUpdateConfig(user, dto) {
            if (!user.tenantId) {
                throw new common_1.BadRequestException('Solo usuarios de una empresa pueden configurar el email');
            }
            const config = await this.emailConfigService.upsertConfig(user.tenantId, dto, email_types_1.ConfiguredBy.SELF, user.id);
            return {
                message: 'Email configuration saved successfully',
                id: config.id,
                provider: config.provider,
                isActive: config.isActive,
                isVerified: config.isVerified,
            };
        }
        async updateConfig(user, dto) {
            if (!user.tenantId) {
                throw new common_1.BadRequestException('Solo usuarios de una empresa pueden actualizar la configuración de email');
            }
            const config = await this.emailConfigService.updateConfig(user.tenantId, dto);
            return {
                message: 'Email configuration updated successfully',
                id: config.id,
                provider: config.provider,
                isActive: config.isActive,
                isVerified: config.isVerified,
            };
        }
        async deleteConfig(user) {
            if (!user.tenantId) {
                throw new common_1.BadRequestException('Solo usuarios de una empresa pueden eliminar la configuración de email');
            }
            await this.emailConfigService.deleteConfig(user.tenantId);
        }
        async testConnection(user) {
            if (!user.tenantId) {
                throw new common_1.BadRequestException('Solo usuarios de una empresa pueden probar la conexión');
            }
            const result = await this.emailConfigService.testConnection(user.tenantId);
            return {
                success: result.success,
                responseTimeMs: result.responseTimeMs,
                message: result.success
                    ? 'Connection successful! Your email configuration is working.'
                    : `Connection failed: ${result.errorMessage}`,
                errorCode: result.errorCode,
            };
        }
        async sendTestEmail(user, dto) {
            if (!user.tenantId) {
                throw new common_1.BadRequestException('Solo usuarios de una empresa pueden enviar emails de prueba');
            }
            const result = await this.emailConfigService.sendTestEmail(user.tenantId, dto);
            return {
                success: result.success,
                messageId: result.messageId,
                message: result.success
                    ? `Test email sent successfully to ${dto.recipientEmail}. Please check your inbox.`
                    : `Failed to send test email: ${result.errorMessage}`,
            };
        }
        async setActive(user, body) {
            if (!user.tenantId) {
                throw new common_1.BadRequestException('Solo usuarios de una empresa pueden activar/desactivar el email');
            }
            const config = await this.emailConfigService.setActive(user.tenantId, body.isActive);
            return {
                message: body.isActive
                    ? 'Email sending activated'
                    : 'Email sending deactivated',
                isActive: config.isActive,
            };
        }
        async getSendLogs(user, page, limit) {
            if (!user.tenantId) {
                throw new common_1.BadRequestException('Solo usuarios de una empresa pueden ver los logs de email');
            }
            return this.emailConfigService.getSendLogs(user.tenantId, page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 20);
        }
        // =========================================================================
        // ASSISTANCE REQUEST ENDPOINTS
        // =========================================================================
        async requestAssistance(user, dto) {
            if (!user.tenantId) {
                throw new common_1.BadRequestException('Solo usuarios de una empresa pueden solicitar asistencia de email');
            }
            const request = await this.emailAssistanceService.createRequest(user.tenantId, dto);
            return {
                message: 'Su solicitud ha sido recibida. Un miembro del equipo de Republicode se pondrá en contacto pronto.',
                requestId: request.id,
                status: request.status,
            };
        }
        async getMyRequests(user) {
            if (!user.tenantId) {
                throw new common_1.BadRequestException('Solo usuarios de una empresa pueden ver sus solicitudes');
            }
            return this.emailAssistanceService.getTenantRequests(user.tenantId);
        }
        async getRequest(user, id) {
            if (!user.tenantId) {
                throw new common_1.BadRequestException('Solo usuarios de una empresa pueden ver sus solicitudes');
            }
            return this.emailAssistanceService.getRequest(id, user.tenantId);
        }
        async addMessageToRequest(user, id, dto) {
            if (!user.tenantId) {
                throw new common_1.BadRequestException('Solo usuarios de una empresa pueden agregar mensajes');
            }
            // Verify this request belongs to the tenant
            await this.emailAssistanceService.getRequest(id, user.tenantId);
            return this.emailAssistanceService.addMessage(id, email_types_1.MessageSender.TENANT, user.id, dto);
        }
        // =========================================================================
        // HEALTH ENDPOINTS
        // =========================================================================
        async getHealth(user) {
            if (!user.tenantId) {
                throw new common_1.BadRequestException('Solo usuarios de una empresa pueden ver el estado de salud del email');
            }
            const config = await this.emailConfigService.getConfig(user.tenantId);
            if (!config) {
                return {
                    status: 'NOT_CONFIGURED',
                    message: 'Email configuration not found',
                };
            }
            return this.emailHealthService.forceHealthCheck(user.tenantId);
        }
    };
    return EmailConfigController = _classThis;
})();
exports.EmailConfigController = EmailConfigController;
// =========================================================================
// ADMIN CONTROLLER
// =========================================================================
let EmailConfigAdminController = (() => {
    let _classDecorators = [(0, swagger_1.ApiTags)('admin-email-config'), (0, common_1.Controller)('admin/email-configs'), (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), super_admin_guard_1.SuperAdminGuard), (0, swagger_1.ApiBearerAuth)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _getAllConfigs_decorators;
    let _getHealthDashboard_decorators;
    let _forceHealthCheck_decorators;
    let _getAllRequests_decorators;
    let _getRequestStats_decorators;
    let _getAdminRequest_decorators;
    let _updateRequest_decorators;
    let _addAdminMessage_decorators;
    let _configureForTenant_decorators;
    let _getTenantConfig_decorators;
    let _deleteTenantConfig_decorators;
    let _testTenantConnection_decorators;
    let _sendTestForTenant_decorators;
    var EmailConfigAdminController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _getAllConfigs_decorators = [(0, common_1.Get)(), (0, swagger_1.ApiOperation)({ summary: 'Get all tenant email configurations (admin)' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'All email configurations' })];
            _getHealthDashboard_decorators = [(0, common_1.Get)('health'), (0, swagger_1.ApiOperation)({ summary: 'Get email health dashboard stats (admin)' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Health dashboard statistics' })];
            _forceHealthCheck_decorators = [(0, common_1.Post)(':tenantId/check'), (0, swagger_1.ApiOperation)({ summary: 'Force health check for a tenant (admin)' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Health check result' })];
            _getAllRequests_decorators = [(0, common_1.Get)('requests'), (0, swagger_1.ApiOperation)({ summary: 'Get all assistance requests (admin)' }), (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: email_types_1.RequestStatus }), (0, swagger_1.ApiResponse)({ status: 200, description: 'All assistance requests' })];
            _getRequestStats_decorators = [(0, common_1.Get)('requests/stats'), (0, swagger_1.ApiOperation)({ summary: 'Get assistance request statistics (admin)' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Request statistics' })];
            _getAdminRequest_decorators = [(0, common_1.Get)('requests/:id'), (0, swagger_1.ApiOperation)({ summary: 'Get specific assistance request (admin)' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Assistance request details' })];
            _updateRequest_decorators = [(0, common_1.Patch)('requests/:id'), (0, swagger_1.ApiOperation)({ summary: 'Update assistance request (admin)' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Request updated' })];
            _addAdminMessage_decorators = [(0, common_1.Post)('requests/:id/messages'), (0, swagger_1.ApiOperation)({ summary: 'Add message to assistance request (admin)' }), (0, swagger_1.ApiResponse)({ status: 201, description: 'Message added' })];
            _configureForTenant_decorators = [(0, common_1.Post)(':tenantId/configure'), (0, swagger_1.ApiOperation)({ summary: 'Configure email for a tenant (admin assisted setup)' }), (0, swagger_1.ApiResponse)({ status: 201, description: 'Configuration created' })];
            _getTenantConfig_decorators = [(0, common_1.Get)(':tenantId'), (0, swagger_1.ApiOperation)({ summary: 'Get email configuration for a specific tenant (admin)' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Tenant email configuration' })];
            _deleteTenantConfig_decorators = [(0, common_1.Delete)(':tenantId'), (0, swagger_1.ApiOperation)({ summary: 'Delete email configuration for a tenant (admin)' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Configuration deleted' })];
            _testTenantConnection_decorators = [(0, common_1.Post)(':tenantId/test-connection'), (0, swagger_1.ApiOperation)({ summary: 'Test email connection for a tenant (admin)' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Connection test result' })];
            _sendTestForTenant_decorators = [(0, common_1.Post)(':tenantId/send-test'), (0, swagger_1.ApiOperation)({ summary: 'Send test email for a tenant (admin)' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Test email result' })];
            __esDecorate(this, null, _getAllConfigs_decorators, { kind: "method", name: "getAllConfigs", static: false, private: false, access: { has: obj => "getAllConfigs" in obj, get: obj => obj.getAllConfigs }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getHealthDashboard_decorators, { kind: "method", name: "getHealthDashboard", static: false, private: false, access: { has: obj => "getHealthDashboard" in obj, get: obj => obj.getHealthDashboard }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _forceHealthCheck_decorators, { kind: "method", name: "forceHealthCheck", static: false, private: false, access: { has: obj => "forceHealthCheck" in obj, get: obj => obj.forceHealthCheck }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getAllRequests_decorators, { kind: "method", name: "getAllRequests", static: false, private: false, access: { has: obj => "getAllRequests" in obj, get: obj => obj.getAllRequests }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getRequestStats_decorators, { kind: "method", name: "getRequestStats", static: false, private: false, access: { has: obj => "getRequestStats" in obj, get: obj => obj.getRequestStats }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getAdminRequest_decorators, { kind: "method", name: "getAdminRequest", static: false, private: false, access: { has: obj => "getAdminRequest" in obj, get: obj => obj.getAdminRequest }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _updateRequest_decorators, { kind: "method", name: "updateRequest", static: false, private: false, access: { has: obj => "updateRequest" in obj, get: obj => obj.updateRequest }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _addAdminMessage_decorators, { kind: "method", name: "addAdminMessage", static: false, private: false, access: { has: obj => "addAdminMessage" in obj, get: obj => obj.addAdminMessage }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _configureForTenant_decorators, { kind: "method", name: "configureForTenant", static: false, private: false, access: { has: obj => "configureForTenant" in obj, get: obj => obj.configureForTenant }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getTenantConfig_decorators, { kind: "method", name: "getTenantConfig", static: false, private: false, access: { has: obj => "getTenantConfig" in obj, get: obj => obj.getTenantConfig }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _deleteTenantConfig_decorators, { kind: "method", name: "deleteTenantConfig", static: false, private: false, access: { has: obj => "deleteTenantConfig" in obj, get: obj => obj.deleteTenantConfig }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _testTenantConnection_decorators, { kind: "method", name: "testTenantConnection", static: false, private: false, access: { has: obj => "testTenantConnection" in obj, get: obj => obj.testTenantConnection }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _sendTestForTenant_decorators, { kind: "method", name: "sendTestForTenant", static: false, private: false, access: { has: obj => "sendTestForTenant" in obj, get: obj => obj.sendTestForTenant }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            EmailConfigAdminController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        emailConfigService = __runInitializers(this, _instanceExtraInitializers);
        emailHealthService;
        emailAssistanceService;
        constructor(emailConfigService, emailHealthService, emailAssistanceService) {
            this.emailConfigService = emailConfigService;
            this.emailHealthService = emailHealthService;
            this.emailAssistanceService = emailAssistanceService;
        }
        async getAllConfigs() {
            return this.emailHealthService.getAllTenantHealth();
        }
        async getHealthDashboard() {
            const [stats, issues] = await Promise.all([
                this.emailHealthService.getDashboardStats(),
                this.emailHealthService.getTenantsWithIssues(),
            ]);
            return {
                stats,
                tenantsWithIssues: issues,
            };
        }
        async forceHealthCheck(tenantId) {
            return this.emailHealthService.forceHealthCheck(tenantId);
        }
        // =========================================================================
        // ADMIN ASSISTANCE REQUESTS
        // =========================================================================
        async getAllRequests(status) {
            return this.emailAssistanceService.getAllRequests(status);
        }
        async getRequestStats() {
            return this.emailAssistanceService.getRequestStats();
        }
        async getAdminRequest(id) {
            return this.emailAssistanceService.getRequest(id);
        }
        async updateRequest(id, dto) {
            return this.emailAssistanceService.updateRequest(id, dto);
        }
        async addAdminMessage(user, id, dto) {
            return this.emailAssistanceService.addMessage(id, email_types_1.MessageSender.REPUBLICODE, user.id, dto);
        }
        // =========================================================================
        // ADMIN CONFIG MANAGEMENT
        // =========================================================================
        async configureForTenant(user, tenantId, dto) {
            const config = await this.emailConfigService.upsertConfig(tenantId, dto, email_types_1.ConfiguredBy.REPUBLICODE, user.id);
            return {
                message: 'Email configuration created for tenant',
                id: config.id,
                tenantId: config.tenantId,
                provider: config.provider,
            };
        }
        async getTenantConfig(tenantId) {
            const config = await this.emailConfigService.getConfig(tenantId);
            if (!config) {
                return { configured: false, config: null };
            }
            return { configured: true, config };
        }
        async deleteTenantConfig(tenantId) {
            await this.emailConfigService.deleteConfig(tenantId);
            return { message: 'Email configuration deleted' };
        }
        async testTenantConnection(tenantId) {
            return this.emailConfigService.testConnection(tenantId);
        }
        async sendTestForTenant(tenantId, dto) {
            return this.emailConfigService.sendTestEmail(tenantId, dto);
        }
    };
    return EmailConfigAdminController = _classThis;
})();
exports.EmailConfigAdminController = EmailConfigAdminController;
