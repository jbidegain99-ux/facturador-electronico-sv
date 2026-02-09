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
exports.MhAuthController = exports.GetTokenDto = void 0;
const common_1 = require("@nestjs/common");
const mh_client_1 = require("@facturador/mh-client");
class GetTokenDto {
    nit;
    password;
    env;
}
exports.GetTokenDto = GetTokenDto;
let MhAuthController = (() => {
    let _classDecorators = [(0, common_1.Controller)('mh-auth')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _getToken_decorators;
    var MhAuthController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _getToken_decorators = [(0, common_1.Post)('token')];
            __esDecorate(this, null, _getToken_decorators, { kind: "method", name: "getToken", static: false, private: false, access: { has: obj => "getToken" in obj, get: obj => obj.getToken }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MhAuthController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        mhAuthService = __runInitializers(this, _instanceExtraInitializers);
        constructor(mhAuthService) {
            this.mhAuthService = mhAuthService;
        }
        async getToken(dto) {
            try {
                const tokenInfo = await this.mhAuthService.getToken(dto.nit, dto.password, dto.env || 'test');
                return {
                    success: true,
                    data: {
                        token: tokenInfo.token,
                        roles: tokenInfo.roles,
                        obtainedAt: tokenInfo.obtainedAt.toISOString(),
                    },
                };
            }
            catch (error) {
                if (error instanceof mh_client_1.MHAuthError) {
                    throw new common_1.HttpException({
                        success: false,
                        error: error.message,
                        statusCode: error.statusCode,
                    }, common_1.HttpStatus.UNAUTHORIZED);
                }
                throw new common_1.HttpException({
                    success: false,
                    error: 'Internal server error',
                }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    };
    return MhAuthController = _classThis;
})();
exports.MhAuthController = MhAuthController;
