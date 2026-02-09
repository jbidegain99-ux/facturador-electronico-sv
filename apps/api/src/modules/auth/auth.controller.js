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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const passport_1 = require("@nestjs/passport");
let AuthController = (() => {
    let _classDecorators = [(0, swagger_1.ApiTags)('auth'), (0, common_1.Controller)('auth')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _login_decorators;
    let _register_decorators;
    let _getProfile_decorators;
    var AuthController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _login_decorators = [(0, common_1.Post)('login'), (0, swagger_1.ApiOperation)({ summary: 'Iniciar sesion' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Login exitoso' }), (0, swagger_1.ApiResponse)({ status: 401, description: 'Credenciales invalidas' })];
            _register_decorators = [(0, common_1.Post)('register'), (0, swagger_1.ApiOperation)({ summary: 'Registrar nueva empresa y usuario administrador' }), (0, swagger_1.ApiResponse)({ status: 201, description: 'Empresa registrada exitosamente' }), (0, swagger_1.ApiResponse)({ status: 409, description: 'NIT o correo ya existe' })];
            _getProfile_decorators = [(0, common_1.Get)('profile'), (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Obtener perfil del usuario autenticado' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Perfil del usuario' }), (0, swagger_1.ApiResponse)({ status: 401, description: 'No autenticado' })];
            __esDecorate(this, null, _login_decorators, { kind: "method", name: "login", static: false, private: false, access: { has: obj => "login" in obj, get: obj => obj.login }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _register_decorators, { kind: "method", name: "register", static: false, private: false, access: { has: obj => "register" in obj, get: obj => obj.register }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getProfile_decorators, { kind: "method", name: "getProfile", static: false, private: false, access: { has: obj => "getProfile" in obj, get: obj => obj.getProfile }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AuthController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        authService = __runInitializers(this, _instanceExtraInitializers);
        constructor(authService) {
            this.authService = authService;
        }
        async login(loginDto, req) {
            const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
            const userAgent = req.headers['user-agent'] || 'unknown';
            return this.authService.login(loginDto.email, loginDto.password, ipAddress, userAgent);
        }
        async register(registerDto, req) {
            const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
            const userAgent = req.headers['user-agent'] || 'unknown';
            return this.authService.register(registerDto, ipAddress, userAgent);
        }
        async getProfile(req) {
            return this.authService.getProfile(req.user.id);
        }
    };
    return AuthController = _classThis;
})();
exports.AuthController = AuthController;
