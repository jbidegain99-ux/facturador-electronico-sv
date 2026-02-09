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
const mh_client_1 = require("@facturador/mh-client");
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
        logger = new common_1.Logger(MhAuthService.name);
        tokenCache = new Map();
        async getToken(nit, password, env = 'test') {
            const cacheKey = `${nit}:${env}`;
            const cached = this.tokenCache.get(cacheKey);
            if (cached && this.isTokenValid(cached)) {
                this.logger.debug(`Using cached token for NIT: ${nit}`);
                return cached;
            }
            this.logger.log(`Authenticating with MH for NIT: ${nit}`);
            try {
                const response = await (0, mh_client_1.authenticate)(nit, password, { env });
                if (response.status === 'OK') {
                    const body = response.body;
                    const tokenInfo = {
                        token: body.token,
                        roles: body.roles,
                        obtainedAt: new Date(),
                    };
                    this.tokenCache.set(cacheKey, tokenInfo);
                    this.logger.log(`Successfully authenticated with MH for NIT: ${nit}`);
                    return tokenInfo;
                }
                throw new mh_client_1.MHAuthError('Authentication failed with status ERROR');
            }
            catch (error) {
                this.logger.error(`Failed to authenticate with MH: ${error instanceof Error ? error.message : 'Unknown error'}`);
                throw error;
            }
        }
        async saveTokenToTenant(tenantId, tokenInfo) {
            // TODO: Implement database persistence
            this.logger.log(`Saving token for tenant: ${tenantId}`);
        }
        clearCache(nit, env) {
            if (nit && env) {
                const cacheKey = `${nit}:${env}`;
                this.tokenCache.delete(cacheKey);
            }
            else {
                this.tokenCache.clear();
            }
        }
        isTokenValid(tokenInfo) {
            const TOKEN_TTL_MS = 23 * 60 * 60 * 1000; // 23 hours
            const elapsed = Date.now() - tokenInfo.obtainedAt.getTime();
            return elapsed < TOKEN_TTL_MS;
        }
    };
    return MhAuthService = _classThis;
})();
exports.MhAuthService = MhAuthService;
