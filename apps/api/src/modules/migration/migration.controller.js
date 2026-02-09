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
exports.MigrationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let MigrationController = (() => {
    let _classDecorators = [(0, swagger_1.ApiTags)('Migration'), (0, swagger_1.ApiBearerAuth)(), (0, common_1.Controller)('migration'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _importClientes_decorators;
    let _getJobs_decorators;
    let _getJob_decorators;
    var MigrationController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _importClientes_decorators = [(0, common_1.Post)('clientes'), (0, swagger_1.ApiOperation)({ summary: 'Importar clientes desde archivo' })];
            _getJobs_decorators = [(0, common_1.Get)('jobs'), (0, swagger_1.ApiOperation)({ summary: 'Listar jobs de importacion del tenant' })];
            _getJob_decorators = [(0, common_1.Get)('jobs/:id'), (0, swagger_1.ApiOperation)({ summary: 'Obtener detalle de un job de importacion' })];
            __esDecorate(this, null, _importClientes_decorators, { kind: "method", name: "importClientes", static: false, private: false, access: { has: obj => "importClientes" in obj, get: obj => obj.importClientes }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getJobs_decorators, { kind: "method", name: "getJobs", static: false, private: false, access: { has: obj => "getJobs" in obj, get: obj => obj.getJobs }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getJob_decorators, { kind: "method", name: "getJob", static: false, private: false, access: { has: obj => "getJob" in obj, get: obj => obj.getJob }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MigrationController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        migrationService = __runInitializers(this, _instanceExtraInitializers);
        constructor(migrationService) {
            this.migrationService = migrationService;
        }
        async importClientes(user, dto) {
            if (!user.tenantId) {
                throw new common_1.BadRequestException('Solo usuarios de empresas pueden importar datos');
            }
            if (!dto.clientes || dto.clientes.length === 0) {
                throw new common_1.BadRequestException('La lista de clientes no puede estar vacia');
            }
            if (dto.clientes.length > 1000) {
                throw new common_1.BadRequestException('Maximo 1000 registros por importacion');
            }
            return this.migrationService.importClientes(user.tenantId, dto.clientes, dto.fileName);
        }
        async getJobs(user) {
            if (!user.tenantId) {
                throw new common_1.BadRequestException('Solo usuarios de empresas pueden ver importaciones');
            }
            return this.migrationService.getJobs(user.tenantId);
        }
        async getJob(user, id) {
            if (!user.tenantId) {
                throw new common_1.BadRequestException('Solo usuarios de empresas pueden ver importaciones');
            }
            return this.migrationService.getJob(user.tenantId, id);
        }
    };
    return MigrationController = _classThis;
})();
exports.MigrationController = MigrationController;
