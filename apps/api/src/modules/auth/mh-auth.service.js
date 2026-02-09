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
exports.MhAuthService = void 0;
const common_1 = require("@nestjs/common");
let MhAuthService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var MhAuthService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MhAuthService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        configService;
        prisma;
        logger = new common_1.Logger(MhAuthService.name);
        constructor(configService, prisma) {
            this.configService = configService;
            this.prisma = prisma;
        }
        async getToken(tenantId) {
            const tenant = await this.prisma.tenant.findUnique({
                where: { id: tenantId },
            });
            if (!tenant) {
                throw new Error('Tenant no encontrado');
            }
            // Check if we have a valid token
            if (tenant.mhToken && tenant.mhTokenExpiry && tenant.mhTokenExpiry > new Date()) {
                return tenant.mhToken;
            }
            // Get a new token
            const newToken = await this.authenticateWithMh(tenant.nit, tenant.nrc);
            // Save token with 23 hour expiry (MH tokens last 24h)
            const expiry = new Date();
            expiry.setHours(expiry.getHours() + 23);
            await this.prisma.tenant.update({
                where: { id: tenantId },
                data: {
                    mhToken: newToken,
                    mhTokenExpiry: expiry,
                },
            });
            return newToken;
        }
        async authenticateWithMh(nit, _nrc) {
            const baseUrl = this.configService.get('MH_API_BASE_URL');
            const passwordPrivado = this.configService.get('MH_PASSWORD_PRIVADO');
            const url = `${baseUrl}/seguridad/auth`;
            this.logger.log(`Autenticando con MH para NIT: ${nit}`);
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    user: nit,
                    pwd: passwordPrivado || '',
                }),
            });
            if (!response.ok) {
                const error = await response.text();
                this.logger.error(`Error autenticando con MH: ${error}`);
                throw new Error(`Error de autenticacion con MH: ${response.status}`);
            }
            const data = await response.json();
            if (data.status !== 'OK') {
                throw new Error('Autenticacion con MH fallida');
            }
            this.logger.log('Autenticacion con MH exitosa');
            return data.body.token;
        }
    };
    return MhAuthService = _classThis;
})();
exports.MhAuthService = MhAuthService;
