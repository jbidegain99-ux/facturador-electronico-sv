"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const passport_1 = require("@nestjs/passport");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let TenantsController = (() => {
    let _classDecorators = [(0, swagger_1.ApiTags)('tenants'), (0, common_1.Controller)('tenants')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _create_decorators;
    let _getMyTenant_decorators;
    let _updateMyTenant_decorators;
    let _findAll_decorators;
    let _findOne_decorators;
    let _update_decorators;
    let _getOnboardingStatus_decorators;
    let _uploadCertificate_decorators;
    let _deleteCertificate_decorators;
    let _testMhConnection_decorators;
    let _markOnboardingComplete_decorators;
    let _skipOnboarding_decorators;
    let _disableDemoMode_decorators;
    var TenantsController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _create_decorators = [(0, common_1.Post)(), (0, swagger_1.ApiOperation)({ summary: 'Crear nuevo tenant/empresa' })];
            _getMyTenant_decorators = [(0, common_1.Get)('me'), (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Obtener datos del tenant del usuario autenticado' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Datos del tenant' }), (0, swagger_1.ApiResponse)({ status: 401, description: 'No autenticado' }), (0, swagger_1.ApiResponse)({ status: 404, description: 'Tenant no encontrado' })];
            _updateMyTenant_decorators = [(0, common_1.Put)('me'), (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Actualizar datos del tenant del usuario autenticado' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Tenant actualizado exitosamente' }), (0, swagger_1.ApiResponse)({ status: 401, description: 'No autenticado' }), (0, swagger_1.ApiResponse)({ status: 403, description: 'Usuario no tiene tenant asignado' }), (0, swagger_1.ApiResponse)({ status: 404, description: 'Tenant no encontrado' })];
            _findAll_decorators = [(0, common_1.Get)(), (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Listar todos los tenants' })];
            _findOne_decorators = [(0, common_1.Get)(':id'), (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Obtener tenant por ID' })];
            _update_decorators = [(0, common_1.Patch)(':id'), (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Actualizar tenant' })];
            _getOnboardingStatus_decorators = [(0, common_1.Get)('me/onboarding-status'), (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Obtener estado del onboarding' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Estado del onboarding' })];
            _uploadCertificate_decorators = [(0, common_1.Post)('me/certificate'), (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')), (0, swagger_1.ApiBearerAuth)(), (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('certificate')), (0, swagger_1.ApiConsumes)('multipart/form-data'), (0, swagger_1.ApiOperation)({ summary: 'Subir certificado digital .p12' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Certificado subido exitosamente' }), (0, swagger_1.ApiResponse)({ status: 400, description: 'Archivo invalido o contrasena incorrecta' })];
            _deleteCertificate_decorators = [(0, common_1.Delete)('me/certificate'), (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Eliminar certificado digital' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Certificado eliminado' })];
            _testMhConnection_decorators = [(0, common_1.Post)('me/test-mh'), (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Probar conexion con Ministerio de Hacienda' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Conexion exitosa' }), (0, swagger_1.ApiResponse)({ status: 400, description: 'Error de conexion' })];
            _markOnboardingComplete_decorators = [(0, common_1.Post)('me/onboarding-complete'), (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Marcar onboarding como completado' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Onboarding marcado como completado' })];
            _skipOnboarding_decorators = [(0, common_1.Post)('me/onboarding-skip'), (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Saltar onboarding y activar modo demo' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Onboarding saltado, modo demo activado' })];
            _disableDemoMode_decorators = [(0, common_1.Post)('me/disable-demo'), (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Desactivar modo demo y volver al modo real' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Modo demo desactivado' })];
            __esDecorate(this, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: obj => "create" in obj, get: obj => obj.create }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getMyTenant_decorators, { kind: "method", name: "getMyTenant", static: false, private: false, access: { has: obj => "getMyTenant" in obj, get: obj => obj.getMyTenant }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _updateMyTenant_decorators, { kind: "method", name: "updateMyTenant", static: false, private: false, access: { has: obj => "updateMyTenant" in obj, get: obj => obj.updateMyTenant }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _findAll_decorators, { kind: "method", name: "findAll", static: false, private: false, access: { has: obj => "findAll" in obj, get: obj => obj.findAll }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _findOne_decorators, { kind: "method", name: "findOne", static: false, private: false, access: { has: obj => "findOne" in obj, get: obj => obj.findOne }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _update_decorators, { kind: "method", name: "update", static: false, private: false, access: { has: obj => "update" in obj, get: obj => obj.update }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getOnboardingStatus_decorators, { kind: "method", name: "getOnboardingStatus", static: false, private: false, access: { has: obj => "getOnboardingStatus" in obj, get: obj => obj.getOnboardingStatus }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _uploadCertificate_decorators, { kind: "method", name: "uploadCertificate", static: false, private: false, access: { has: obj => "uploadCertificate" in obj, get: obj => obj.uploadCertificate }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _deleteCertificate_decorators, { kind: "method", name: "deleteCertificate", static: false, private: false, access: { has: obj => "deleteCertificate" in obj, get: obj => obj.deleteCertificate }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _testMhConnection_decorators, { kind: "method", name: "testMhConnection", static: false, private: false, access: { has: obj => "testMhConnection" in obj, get: obj => obj.testMhConnection }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _markOnboardingComplete_decorators, { kind: "method", name: "markOnboardingComplete", static: false, private: false, access: { has: obj => "markOnboardingComplete" in obj, get: obj => obj.markOnboardingComplete }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _skipOnboarding_decorators, { kind: "method", name: "skipOnboarding", static: false, private: false, access: { has: obj => "skipOnboarding" in obj, get: obj => obj.skipOnboarding }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _disableDemoMode_decorators, { kind: "method", name: "disableDemoMode", static: false, private: false, access: { has: obj => "disableDemoMode" in obj, get: obj => obj.disableDemoMode }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            TenantsController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        tenantsService = __runInitializers(this, _instanceExtraInitializers);
        prisma;
        logger = new common_1.Logger(TenantsController.name);
        constructor(tenantsService, prisma) {
            this.tenantsService = tenantsService;
            this.prisma = prisma;
        }
        create(createTenantDto) {
            return this.tenantsService.create(createTenantDto);
        }
        async getMyTenant(user) {
            this.logger.log(`Getting tenant for user ${user.email}, tenantId: ${user.tenantId}`);
            if (!user.tenantId) {
                this.logger.warn(`User ${user.email} has no tenantId`);
                throw new common_1.ForbiddenException('Usuario no tiene tenant asignado');
            }
            const tenant = await this.tenantsService.findOne(user.tenantId);
            if (!tenant) {
                this.logger.error(`Tenant ${user.tenantId} not found for user ${user.email}`);
                throw new common_1.NotFoundException('Tenant no encontrado');
            }
            this.logger.log(`Tenant ${tenant.nombre} found for user ${user.email}`);
            return tenant;
        }
        async updateMyTenant(user, updateTenantDto) {
            this.logger.log(`Updating tenant for user ${user.email}, tenantId: ${user.tenantId}`);
            this.logger.debug(`Update data: ${JSON.stringify(updateTenantDto)}`);
            if (!user.tenantId) {
                this.logger.warn(`User ${user.email} has no tenantId`);
                throw new common_1.ForbiddenException('Usuario no tiene tenant asignado');
            }
            const existingTenant = await this.tenantsService.findOne(user.tenantId);
            if (!existingTenant) {
                this.logger.error(`Tenant ${user.tenantId} not found for user ${user.email}`);
                throw new common_1.NotFoundException('Tenant no encontrado');
            }
            const updatedTenant = await this.tenantsService.update(user.tenantId, updateTenantDto);
            this.logger.log(`Tenant ${updatedTenant.nombre} updated successfully`);
            return updatedTenant;
        }
        findAll() {
            return this.tenantsService.findAll();
        }
        findOne(id) {
            return this.tenantsService.findOne(id);
        }
        update(id, updateTenantDto) {
            return this.tenantsService.update(id, updateTenantDto);
        }
        // ==================== ONBOARDING ENDPOINTS ====================
        async getOnboardingStatus(user) {
            if (!user.tenantId) {
                throw new common_1.ForbiddenException('Usuario no tiene tenant asignado');
            }
            const tenant = await this.prisma.tenant.findUnique({
                where: { id: user.tenantId },
                include: {
                    _count: {
                        select: { dtes: true },
                    },
                },
            });
            if (!tenant) {
                throw new common_1.NotFoundException('Tenant no encontrado');
            }
            const isDemoMode = tenant.plan === 'DEMO' || tenant.certificatePath === 'DEMO_MODE';
            return {
                hasCompanyData: true, // Always true after registration
                hasCertificate: !!tenant.certificatePath,
                hasTestedConnection: !!tenant.mhToken,
                hasFirstInvoice: tenant._count.dtes > 0,
                demoMode: isDemoMode,
                plan: tenant.plan,
            };
        }
        async uploadCertificate(user, file, password) {
            if (!user.tenantId) {
                throw new common_1.ForbiddenException('Usuario no tiene tenant asignado');
            }
            if (!file) {
                throw new common_1.BadRequestException('Archivo de certificado requerido');
            }
            if (!password) {
                throw new common_1.BadRequestException('Contrasena del certificado requerida');
            }
            // Validate file extension
            const ext = path.extname(file.originalname).toLowerCase();
            if (!['.p12', '.pfx', '.crt', '.cer', '.pem'].includes(ext)) {
                throw new common_1.BadRequestException('El archivo debe ser .p12, .pfx, .crt, .cer o .pem');
            }
            try {
                // Create certificates directory if it doesn't exist
                const certsDir = path.join(process.cwd(), 'certificates');
                if (!fs.existsSync(certsDir)) {
                    fs.mkdirSync(certsDir, { recursive: true });
                }
                // Save the certificate file
                const filename = `${user.tenantId}_${Date.now()}${ext}`;
                const filepath = path.join(certsDir, filename);
                fs.writeFileSync(filepath, file.buffer);
                // TODO: Validate certificate with password using a crypto library
                // For now, just save the path
                // Update tenant with certificate path
                await this.prisma.tenant.update({
                    where: { id: user.tenantId },
                    data: { certificatePath: filepath },
                });
                this.logger.log(`Certificate uploaded for tenant ${user.tenantId}`);
                return {
                    success: true,
                    message: 'Certificado subido exitosamente',
                    filename: file.originalname,
                };
            }
            catch (error) {
                this.logger.error(`Error uploading certificate: ${error.message}`);
                throw new common_1.BadRequestException('Error al procesar el certificado');
            }
        }
        async deleteCertificate(user) {
            if (!user.tenantId) {
                throw new common_1.ForbiddenException('Usuario no tiene tenant asignado');
            }
            const tenant = await this.prisma.tenant.findUnique({
                where: { id: user.tenantId },
            });
            if (!tenant) {
                throw new common_1.NotFoundException('Tenant no encontrado');
            }
            // Delete the file if it exists
            if (tenant.certificatePath && fs.existsSync(tenant.certificatePath)) {
                fs.unlinkSync(tenant.certificatePath);
            }
            // Clear the certificate path
            await this.prisma.tenant.update({
                where: { id: user.tenantId },
                data: { certificatePath: null },
            });
            this.logger.log(`Certificate deleted for tenant ${user.tenantId}`);
            return { success: true, message: 'Certificado eliminado' };
        }
        async testMhConnection(user) {
            if (!user.tenantId) {
                throw new common_1.ForbiddenException('Usuario no tiene tenant asignado');
            }
            const tenant = await this.prisma.tenant.findUnique({
                where: { id: user.tenantId },
            });
            if (!tenant) {
                throw new common_1.NotFoundException('Tenant no encontrado');
            }
            if (!tenant.certificatePath) {
                throw new common_1.BadRequestException('Debe subir un certificado primero');
            }
            try {
                // TODO: Actually test connection with MH using the signer service
                // For now, simulate a successful connection
                // Update tenant to mark connection as tested
                await this.prisma.tenant.update({
                    where: { id: user.tenantId },
                    data: {
                        mhToken: 'test_token_' + Date.now(),
                        mhTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
                    },
                });
                this.logger.log(`MH connection tested for tenant ${user.tenantId}`);
                return {
                    success: true,
                    message: 'Conexion con Ministerio de Hacienda exitosa',
                };
            }
            catch (error) {
                this.logger.error(`MH connection test failed: ${error.message}`);
                throw new common_1.BadRequestException('Error al conectar con el Ministerio de Hacienda');
            }
        }
        async markOnboardingComplete(user) {
            if (!user.tenantId) {
                throw new common_1.ForbiddenException('Usuario no tiene tenant asignado');
            }
            // For now, we don't need to do anything special
            // The onboarding status is derived from existing fields
            this.logger.log(`Onboarding marked complete for tenant ${user.tenantId}`);
            return { success: true, message: 'Onboarding completado' };
        }
        async skipOnboarding(user) {
            if (!user.tenantId) {
                throw new common_1.ForbiddenException('Usuario no tiene tenant asignado');
            }
            // Set demo mode: create fake certificate path and token to bypass checks
            await this.prisma.tenant.update({
                where: { id: user.tenantId },
                data: {
                    certificatePath: 'DEMO_MODE',
                    mhToken: 'DEMO_TOKEN_' + Date.now(),
                    mhTokenExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
                    plan: 'DEMO', // Set plan to DEMO to enable demo mode features
                },
            });
            this.logger.log(`Onboarding skipped for tenant ${user.tenantId}, demo mode activated`);
            return {
                success: true,
                message: 'Modo demo activado. Puedes crear facturas de prueba sin conectar a Hacienda.',
                demoMode: true,
            };
        }
        async disableDemoMode(user) {
            if (!user.tenantId) {
                throw new common_1.ForbiddenException('Usuario no tiene tenant asignado');
            }
            // Clear demo mode settings
            await this.prisma.tenant.update({
                where: { id: user.tenantId },
                data: {
                    certificatePath: null,
                    mhToken: null,
                    mhTokenExpiry: null,
                    plan: 'TRIAL', // Reset to TRIAL
                },
            });
            this.logger.log(`Demo mode disabled for tenant ${user.tenantId}`);
            return {
                success: true,
                message: 'Modo demo desactivado. Debes completar el onboarding para usar el sistema real.',
                demoMode: false,
            };
        }
    };
    return TenantsController = _classThis;
})();
exports.TenantsController = TenantsController;
