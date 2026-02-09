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
exports.HaciendaController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const passport_1 = require("@nestjs/passport");
const swagger_1 = require("@nestjs/swagger");
const dto_1 = require("./dto");
let HaciendaController = (() => {
    let _classDecorators = [(0, common_1.Controller)('hacienda'), (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiTags)('Hacienda Configuration')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _getConfig_decorators;
    let _quickSetup_decorators;
    let _validateConnection_decorators;
    let _testConnection_decorators;
    let _renewToken_decorators;
    let _switchEnvironment_decorators;
    let _configureEnvironment_decorators;
    let _getTestProgress_decorators;
    let _executeTest_decorators;
    let _getTestHistory_decorators;
    let _generateTestData_decorators;
    let _getSuccessfulEmissions_decorators;
    var HaciendaController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _getConfig_decorators = [(0, common_1.Get)('config'), (0, swagger_1.ApiOperation)({ summary: 'Obtener configuración actual de Hacienda' }), (0, swagger_1.ApiResponse)({
                    status: 200,
                    description: 'Configuración de Hacienda',
                    type: dto_1.HaciendaConfigResponseDto,
                })];
            _quickSetup_decorators = [(0, common_1.Post)('quick-setup'), (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('certificate')), (0, swagger_1.ApiOperation)({
                    summary: 'Configuración rápida para empresas con credenciales existentes',
                    description: 'Configura ambiente con certificado y credenciales en un solo paso, validando todo automáticamente',
                }), (0, swagger_1.ApiConsumes)('multipart/form-data'), (0, swagger_1.ApiBody)({
                    schema: {
                        type: 'object',
                        required: ['certificate', 'environment', 'apiUser', 'apiPassword', 'certificatePassword'],
                        properties: {
                            certificate: {
                                type: 'string',
                                format: 'binary',
                                description: 'Archivo de certificado .p12 o .pfx',
                            },
                            environment: {
                                type: 'string',
                                enum: ['TEST', 'PRODUCTION'],
                                description: 'Ambiente a configurar',
                            },
                            apiUser: {
                                type: 'string',
                                description: 'Usuario de API de Hacienda (NIT sin guiones)',
                            },
                            apiPassword: {
                                type: 'string',
                                description: 'Contraseña de API de Hacienda',
                            },
                            certificatePassword: {
                                type: 'string',
                                description: 'Contraseña del certificado',
                            },
                        },
                    },
                }), (0, swagger_1.ApiResponse)({
                    status: 200,
                    description: 'Configuración completada exitosamente',
                    type: dto_1.QuickSetupResponseDto,
                }), (0, swagger_1.ApiResponse)({
                    status: 400,
                    description: 'Error de validación',
                    type: dto_1.QuickSetupResponseDto,
                })];
            _validateConnection_decorators = [(0, common_1.Post)('validate-connection'), (0, swagger_1.ApiOperation)({
                    summary: 'Validar conexión con Hacienda sin guardar',
                    description: 'Prueba las credenciales de API sin guardar la configuración',
                }), (0, swagger_1.ApiResponse)({
                    status: 200,
                    description: 'Resultado de la validación',
                    type: dto_1.ValidateConnectionResponseDto,
                })];
            _testConnection_decorators = [(0, common_1.Post)('config/test-connection'), (0, swagger_1.ApiOperation)({ summary: 'Probar conexión con Hacienda' }), (0, swagger_1.ApiResponse)({
                    status: 200,
                    description: 'Conexión exitosa',
                }), (0, swagger_1.ApiResponse)({
                    status: 400,
                    description: 'Error de conexión',
                })];
            _renewToken_decorators = [(0, common_1.Post)('config/renew-token'), (0, swagger_1.ApiOperation)({ summary: 'Renovar token de autenticación' }), (0, swagger_1.ApiResponse)({
                    status: 200,
                    description: 'Token renovado exitosamente',
                })];
            _switchEnvironment_decorators = [(0, common_1.Post)('config/switch-environment'), (0, swagger_1.ApiOperation)({ summary: 'Cambiar ambiente activo' }), (0, swagger_1.ApiResponse)({
                    status: 200,
                    description: 'Ambiente cambiado exitosamente',
                }), (0, swagger_1.ApiResponse)({
                    status: 400,
                    description: 'No se puede cambiar al ambiente especificado',
                })];
            _configureEnvironment_decorators = [(0, common_1.Post)('config/:environment'), (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('certificate')), (0, swagger_1.ApiOperation)({ summary: 'Configurar ambiente (TEST o PRODUCTION)' }), (0, swagger_1.ApiConsumes)('multipart/form-data'), (0, swagger_1.ApiBody)({
                    schema: {
                        type: 'object',
                        required: ['certificate', 'apiUser', 'apiPassword', 'certificatePassword'],
                        properties: {
                            certificate: {
                                type: 'string',
                                format: 'binary',
                                description: 'Archivo de certificado .p12 o .pfx',
                            },
                            apiUser: {
                                type: 'string',
                                description: 'Usuario de API de Hacienda',
                            },
                            apiPassword: {
                                type: 'string',
                                description: 'Contraseña de API de Hacienda',
                            },
                            certificatePassword: {
                                type: 'string',
                                description: 'Contraseña del certificado',
                            },
                        },
                    },
                }), (0, swagger_1.ApiResponse)({
                    status: 200,
                    description: 'Ambiente configurado exitosamente',
                }), (0, swagger_1.ApiResponse)({
                    status: 400,
                    description: 'Error en la configuración',
                })];
            _getTestProgress_decorators = [(0, common_1.Get)('tests/progress'), (0, swagger_1.ApiOperation)({ summary: 'Obtener progreso de pruebas' }), (0, swagger_1.ApiResponse)({
                    status: 200,
                    description: 'Progreso de pruebas',
                    type: dto_1.TestProgressResponseDto,
                })];
            _executeTest_decorators = [(0, common_1.Post)('tests/execute'), (0, swagger_1.ApiOperation)({ summary: 'Ejecutar una prueba' }), (0, swagger_1.ApiResponse)({
                    status: 200,
                    description: 'Resultado de la prueba',
                }), (0, swagger_1.ApiResponse)({
                    status: 400,
                    description: 'Error al ejecutar la prueba',
                })];
            _getTestHistory_decorators = [(0, common_1.Get)('tests/history'), (0, swagger_1.ApiOperation)({ summary: 'Obtener historial de pruebas' }), (0, swagger_1.ApiResponse)({
                    status: 200,
                    description: 'Historial de pruebas',
                })];
            _generateTestData_decorators = [(0, common_1.Post)('tests/generate-data'), (0, swagger_1.ApiOperation)({ summary: 'Generar datos de prueba aleatorios' }), (0, swagger_1.ApiResponse)({
                    status: 200,
                    description: 'Datos de prueba generados',
                })];
            _getSuccessfulEmissions_decorators = [(0, common_1.Get)('tests/successful-emissions'), (0, swagger_1.ApiOperation)({
                    summary: 'Obtener emisiones exitosas para anulación',
                    description: 'Lista de DTEs emitidos exitosamente que pueden ser anulados',
                }), (0, swagger_1.ApiResponse)({
                    status: 200,
                    description: 'Lista de emisiones exitosas',
                })];
            __esDecorate(this, null, _getConfig_decorators, { kind: "method", name: "getConfig", static: false, private: false, access: { has: obj => "getConfig" in obj, get: obj => obj.getConfig }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _quickSetup_decorators, { kind: "method", name: "quickSetup", static: false, private: false, access: { has: obj => "quickSetup" in obj, get: obj => obj.quickSetup }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _validateConnection_decorators, { kind: "method", name: "validateConnection", static: false, private: false, access: { has: obj => "validateConnection" in obj, get: obj => obj.validateConnection }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _testConnection_decorators, { kind: "method", name: "testConnection", static: false, private: false, access: { has: obj => "testConnection" in obj, get: obj => obj.testConnection }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _renewToken_decorators, { kind: "method", name: "renewToken", static: false, private: false, access: { has: obj => "renewToken" in obj, get: obj => obj.renewToken }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _switchEnvironment_decorators, { kind: "method", name: "switchEnvironment", static: false, private: false, access: { has: obj => "switchEnvironment" in obj, get: obj => obj.switchEnvironment }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _configureEnvironment_decorators, { kind: "method", name: "configureEnvironment", static: false, private: false, access: { has: obj => "configureEnvironment" in obj, get: obj => obj.configureEnvironment }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getTestProgress_decorators, { kind: "method", name: "getTestProgress", static: false, private: false, access: { has: obj => "getTestProgress" in obj, get: obj => obj.getTestProgress }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _executeTest_decorators, { kind: "method", name: "executeTest", static: false, private: false, access: { has: obj => "executeTest" in obj, get: obj => obj.executeTest }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getTestHistory_decorators, { kind: "method", name: "getTestHistory", static: false, private: false, access: { has: obj => "getTestHistory" in obj, get: obj => obj.getTestHistory }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _generateTestData_decorators, { kind: "method", name: "generateTestData", static: false, private: false, access: { has: obj => "generateTestData" in obj, get: obj => obj.generateTestData }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getSuccessfulEmissions_decorators, { kind: "method", name: "getSuccessfulEmissions", static: false, private: false, access: { has: obj => "getSuccessfulEmissions" in obj, get: obj => obj.getSuccessfulEmissions }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            HaciendaController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        haciendaService = __runInitializers(this, _instanceExtraInitializers);
        constructor(haciendaService) {
            this.haciendaService = haciendaService;
        }
        // ===== CONFIGURATION =====
        async getConfig(user) {
            if (!user.tenantId) {
                throw new common_1.BadRequestException('Usuario no tiene tenant asignado');
            }
            return this.haciendaService.getOrCreateConfig(user.tenantId);
        }
        // ===== QUICK SETUP =====
        async quickSetup(user, certificate, dto) {
            if (!user.tenantId) {
                throw new common_1.BadRequestException('Usuario no tiene tenant asignado');
            }
            if (!certificate) {
                throw new common_1.BadRequestException('Se requiere el archivo de certificado');
            }
            // Validate file extension
            const allowedExtensions = ['.p12', '.pfx', '.crt', '.cer', '.pem'];
            const fileExt = certificate.originalname
                .toLowerCase()
                .slice(certificate.originalname.lastIndexOf('.'));
            if (!allowedExtensions.includes(fileExt)) {
                throw new common_1.BadRequestException('El archivo debe ser un certificado .p12, .pfx, .crt, .cer o .pem');
            }
            // Validate file size (max 5MB)
            const maxSizeBytes = 5 * 1024 * 1024;
            if (certificate.size > maxSizeBytes) {
                throw new common_1.BadRequestException('El archivo de certificado no puede exceder 5MB');
            }
            return this.haciendaService.quickSetup(user.tenantId, dto, certificate.buffer, certificate.originalname);
        }
        async validateConnection(user, dto) {
            if (!user.tenantId) {
                throw new common_1.BadRequestException('Usuario no tiene tenant asignado');
            }
            return this.haciendaService.validateConnection(dto);
        }
        // Static routes MUST come before dynamic route config/:environment
        async testConnection(user, dto) {
            if (!user.tenantId) {
                throw new common_1.BadRequestException('Usuario no tiene tenant asignado');
            }
            return this.haciendaService.testConnection(user.tenantId, dto.environment);
        }
        async renewToken(user, dto) {
            if (!user.tenantId) {
                throw new common_1.BadRequestException('Usuario no tiene tenant asignado');
            }
            return this.haciendaService.renewToken(user.tenantId, dto.environment);
        }
        async switchEnvironment(user, dto) {
            if (!user.tenantId) {
                throw new common_1.BadRequestException('Usuario no tiene tenant asignado');
            }
            return this.haciendaService.switchEnvironment(user.tenantId, dto.environment);
        }
        // Dynamic route MUST come after static routes to avoid matching test-connection, renew-token, etc.
        async configureEnvironment(user, environment, certificate, dto) {
            if (!user.tenantId) {
                throw new common_1.BadRequestException('Usuario no tiene tenant asignado');
            }
            if (!['TEST', 'PRODUCTION'].includes(environment)) {
                throw new common_1.BadRequestException('Ambiente debe ser TEST o PRODUCTION');
            }
            if (!certificate) {
                throw new common_1.BadRequestException('Se requiere el archivo de certificado');
            }
            // Validate file extension
            const allowedExtensions = ['.p12', '.pfx', '.crt', '.cer', '.pem'];
            const fileExt = certificate.originalname
                .toLowerCase()
                .slice(certificate.originalname.lastIndexOf('.'));
            if (!allowedExtensions.includes(fileExt)) {
                throw new common_1.BadRequestException('El archivo debe ser un certificado .p12, .pfx, .crt, .cer o .pem');
            }
            return this.haciendaService.configureEnvironment(user.tenantId, environment, dto, certificate.buffer, certificate.originalname);
        }
        // ===== TEST CENTER =====
        async getTestProgress(user) {
            if (!user.tenantId) {
                throw new common_1.BadRequestException('Usuario no tiene tenant asignado');
            }
            return this.haciendaService.getTestProgress(user.tenantId);
        }
        async executeTest(user, dto) {
            if (!user.tenantId) {
                throw new common_1.BadRequestException('Usuario no tiene tenant asignado');
            }
            return this.haciendaService.executeTest(user.tenantId, dto);
        }
        async getTestHistory(user, query) {
            if (!user.tenantId) {
                throw new common_1.BadRequestException('Usuario no tiene tenant asignado');
            }
            return this.haciendaService.getTestHistory(user.tenantId, {
                dteType: query.dteType,
                status: query.status,
                limit: query.limit ? Number(query.limit) : undefined,
                offset: query.offset ? Number(query.offset) : undefined,
            });
        }
        async generateTestData(user, dto) {
            if (!user.tenantId) {
                throw new common_1.BadRequestException('Usuario no tiene tenant asignado');
            }
            return this.haciendaService.generateTestDataPreview(user.tenantId, dto.dteType);
        }
        // ===== SUCCESSFUL TESTS FOR CANCELLATION =====
        async getSuccessfulEmissions(user, dteType) {
            if (!user.tenantId) {
                throw new common_1.BadRequestException('Usuario no tiene tenant asignado');
            }
            // Get emissions that haven't been cancelled yet
            const history = await this.haciendaService.getTestHistory(user.tenantId, {
                status: 'SUCCESS',
            });
            // Filter to only emissions
            let emissions = history.filter((r) => r.testType === 'EMISSION');
            if (dteType) {
                emissions = emissions.filter((r) => r.dteType === dteType);
            }
            // Get all cancelled records
            const cancellations = history.filter((r) => r.testType === 'CANCELLATION');
            const cancelledCodes = new Set(cancellations
                .map((c) => {
                // The cancellation record references the original DTE
                // We need to check what was cancelled
                return c.codigoGeneracion;
            })
                .filter(Boolean));
            // Filter out already cancelled emissions
            // Note: In a real implementation, we'd track this relationship better
            return emissions.filter((e) => !cancelledCodes.has(e.codigoGeneracion));
        }
    };
    return HaciendaController = _classThis;
})();
exports.HaciendaController = HaciendaController;
