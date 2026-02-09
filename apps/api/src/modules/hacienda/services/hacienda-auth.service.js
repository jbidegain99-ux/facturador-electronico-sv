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
exports.HaciendaAuthService = void 0;
const common_1 = require("@nestjs/common");
const interfaces_1 = require("../interfaces");
/**
 * Service for authenticating with Ministerio de Hacienda API
 */
let HaciendaAuthService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var HaciendaAuthService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            HaciendaAuthService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        encryptionService;
        logger = new common_1.Logger(HaciendaAuthService.name);
        tokenCache = new Map();
        constructor(prisma, encryptionService) {
            this.prisma = prisma;
            this.encryptionService = encryptionService;
        }
        /**
         * Authenticate with Hacienda API and get a token
         * @param nit - The NIT for authentication
         * @param password - The API password
         * @param environment - TEST or PRODUCTION
         * @returns Token information
         */
        async authenticate(nit, password, environment = 'TEST') {
            // Check cache first
            const cacheKey = `${nit}:${environment}`;
            const cached = this.tokenCache.get(cacheKey);
            if (cached && this.isTokenValid(cached)) {
                this.logger.debug(`Using cached token for NIT: ${nit}`);
                return cached;
            }
            this.logger.log(`Authenticating with MH for NIT: ${nit}, Env: ${environment}`);
            const baseUrl = interfaces_1.HACIENDA_URLS[environment];
            const url = `${baseUrl}${interfaces_1.HACIENDA_ENDPOINTS.AUTH}`;
            this.logger.log(`Attempting auth to URL: ${url}`);
            try {
                // Hacienda expects application/x-www-form-urlencoded with 'user' and 'pwd'
                const formData = new URLSearchParams();
                formData.append('user', nit.replace(/-/g, '')); // Remove dashes from NIT
                formData.append('pwd', password);
                this.logger.debug(`Auth request body: user=${nit.replace(/-/g, '')}`);
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: formData.toString(),
                });
                const responseText = await response.text();
                this.logger.debug(`MH Response status: ${response.status}, body: ${responseText}`);
                let data;
                try {
                    data = JSON.parse(responseText);
                }
                catch {
                    this.logger.error(`Failed to parse MH response: ${responseText}`);
                    throw new common_1.BadRequestException(`Respuesta inválida de Hacienda: ${responseText.substring(0, 200)}`);
                }
                if (data.status === 'OK' && data.body) {
                    const now = new Date();
                    const validity = interfaces_1.TOKEN_VALIDITY[environment];
                    const expiresAt = new Date(now.getTime() + validity);
                    const tokenInfo = {
                        token: data.body.token,
                        roles: data.body.roles,
                        obtainedAt: now,
                        expiresAt,
                    };
                    // Cache the token
                    this.tokenCache.set(cacheKey, tokenInfo);
                    this.logger.log(`Successfully authenticated with MH for NIT: ${nit}`);
                    return tokenInfo;
                }
                const errorMessage = data.message || data.descripcion || 'Error de autenticación con Hacienda';
                this.logger.error(`MH Auth failed - status: ${data.status}, message: ${errorMessage}, full response: ${JSON.stringify(data)}`);
                throw new common_1.BadRequestException(errorMessage);
            }
            catch (error) {
                if (error instanceof common_1.BadRequestException) {
                    throw error;
                }
                const message = error instanceof Error ? error.message : 'Error desconocido';
                this.logger.error(`Failed to authenticate with MH: ${message}`);
                throw new common_1.BadRequestException(`Error de conexión con Hacienda: ${message}`);
            }
        }
        /**
         * Get or refresh token for a specific tenant and environment
         */
        async getTokenForTenant(tenantId, environment = 'TEST') {
            // Get environment config
            const envConfig = await this.prisma.haciendaEnvironmentConfig.findFirst({
                where: {
                    haciendaConfig: {
                        tenantId,
                    },
                    environment,
                },
                include: {
                    haciendaConfig: {
                        include: {
                            tenant: true,
                        },
                    },
                },
            });
            if (!envConfig) {
                throw new common_1.BadRequestException(`No se encontró configuración de Hacienda para el ambiente ${environment}`);
            }
            if (!envConfig.apiUser || !envConfig.apiPasswordEncrypted) {
                throw new common_1.BadRequestException('Faltan credenciales de API. Configure el usuario y contraseña de Hacienda.');
            }
            // Check if we have a valid cached token in DB
            if (envConfig.currentTokenEncrypted &&
                envConfig.tokenExpiresAt &&
                new Date() < envConfig.tokenExpiresAt) {
                this.logger.debug(`Using stored token for tenant: ${tenantId}`);
                return {
                    token: this.encryptionService.decrypt(envConfig.currentTokenEncrypted),
                    roles: [],
                    obtainedAt: envConfig.tokenRefreshedAt || new Date(),
                    expiresAt: envConfig.tokenExpiresAt,
                };
            }
            // Get fresh token
            const nit = envConfig.haciendaConfig.tenant.nit;
            const password = this.encryptionService.decrypt(envConfig.apiPasswordEncrypted);
            const tokenInfo = await this.authenticate(nit, password, environment);
            // Store token in database
            await this.prisma.haciendaEnvironmentConfig.update({
                where: { id: envConfig.id },
                data: {
                    currentTokenEncrypted: this.encryptionService.encrypt(tokenInfo.token),
                    tokenExpiresAt: tokenInfo.expiresAt,
                    tokenRefreshedAt: tokenInfo.obtainedAt,
                },
            });
            return tokenInfo;
        }
        /**
         * Validate API credentials by attempting authentication
         */
        async validateCredentials(nit, password, environment = 'TEST') {
            try {
                const tokenInfo = await this.authenticate(nit, password, environment);
                return {
                    valid: true,
                    message: 'Credenciales válidas',
                    expiresAt: tokenInfo.expiresAt,
                };
            }
            catch (error) {
                const message = error instanceof common_1.BadRequestException
                    ? error.message
                    : 'Error al validar credenciales';
                return {
                    valid: false,
                    message,
                };
            }
        }
        /**
         * Clear cached token for a tenant/environment
         */
        clearCache(nit, environment) {
            if (nit && environment) {
                const cacheKey = `${nit}:${environment}`;
                this.tokenCache.delete(cacheKey);
            }
            else {
                this.tokenCache.clear();
            }
        }
        /**
         * Refresh token for a tenant - forces new authentication
         */
        async refreshToken(tenantId, environment = 'TEST') {
            // Get environment config
            const envConfig = await this.prisma.haciendaEnvironmentConfig.findFirst({
                where: {
                    haciendaConfig: {
                        tenantId,
                    },
                    environment,
                },
                include: {
                    haciendaConfig: {
                        include: {
                            tenant: true,
                        },
                    },
                },
            });
            if (!envConfig) {
                throw new common_1.BadRequestException(`No se encontró configuración de Hacienda para el ambiente ${environment}`);
            }
            // Clear cache to force fresh auth
            const nit = envConfig.haciendaConfig.tenant.nit;
            this.clearCache(nit, environment);
            // Clear database token to force new authentication
            await this.prisma.haciendaEnvironmentConfig.update({
                where: { id: envConfig.id },
                data: {
                    currentTokenEncrypted: null,
                    tokenExpiresAt: null,
                    tokenRefreshedAt: null,
                },
            });
            this.logger.log(`Forcing fresh token for tenant: ${tenantId}`);
            // Get fresh token (will now authenticate since DB token is cleared)
            return this.getTokenForTenant(tenantId, environment);
        }
        /**
         * Check if a token is still valid
         */
        isTokenValid(tokenInfo) {
            // Give 5 minute buffer before expiry
            const bufferMs = 5 * 60 * 1000;
            const now = Date.now();
            return tokenInfo.expiresAt.getTime() - bufferMs > now;
        }
        /**
         * Get token validity hours based on environment
         */
        getTokenValidityHours(environment) {
            return environment === 'TEST' ? 48 : 24;
        }
    };
    return HaciendaAuthService = _classThis;
})();
exports.HaciendaAuthService = HaciendaAuthService;
