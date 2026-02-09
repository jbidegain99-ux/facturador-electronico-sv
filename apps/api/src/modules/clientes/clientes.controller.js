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
exports.ClientesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const passport_1 = require("@nestjs/passport");
let ClientesController = (() => {
    let _classDecorators = [(0, swagger_1.ApiTags)('clientes'), (0, common_1.Controller)('clientes'), (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')), (0, swagger_1.ApiBearerAuth)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _create_decorators;
    let _findAll_decorators;
    let _findOne_decorators;
    let _update_decorators;
    let _remove_decorators;
    var ClientesController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _create_decorators = [(0, common_1.Post)(), (0, swagger_1.ApiOperation)({ summary: 'Crear nuevo cliente' }), (0, swagger_1.ApiResponse)({ status: 201, description: 'Cliente creado exitosamente' }), (0, swagger_1.ApiResponse)({ status: 401, description: 'No autenticado' }), (0, swagger_1.ApiResponse)({ status: 403, description: 'Usuario no tiene tenant asignado' }), (0, swagger_1.ApiResponse)({ status: 409, description: 'Ya existe un cliente con este documento' })];
            _findAll_decorators = [(0, common_1.Get)(), (0, swagger_1.ApiOperation)({ summary: 'Listar clientes del tenant con paginacion' }), (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number, description: 'Numero de pagina (default: 1)' }), (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, description: 'Registros por pagina (default: 20, max: 100)' }), (0, swagger_1.ApiQuery)({ name: 'search', required: false, description: 'Buscar por nombre, documento o correo' }), (0, swagger_1.ApiQuery)({ name: 'sortBy', required: false, description: 'Campo para ordenar (nombre, numDocumento, createdAt)' }), (0, swagger_1.ApiQuery)({ name: 'sortOrder', required: false, description: 'Orden: asc o desc (default: desc)' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista paginada de clientes' }), (0, swagger_1.ApiResponse)({ status: 401, description: 'No autenticado' })];
            _findOne_decorators = [(0, common_1.Get)(':id'), (0, swagger_1.ApiOperation)({ summary: 'Obtener cliente por ID' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Datos del cliente' }), (0, swagger_1.ApiResponse)({ status: 401, description: 'No autenticado' }), (0, swagger_1.ApiResponse)({ status: 404, description: 'Cliente no encontrado' })];
            _update_decorators = [(0, common_1.Put)(':id'), (0, swagger_1.ApiOperation)({ summary: 'Actualizar cliente' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Cliente actualizado exitosamente' }), (0, swagger_1.ApiResponse)({ status: 401, description: 'No autenticado' }), (0, swagger_1.ApiResponse)({ status: 404, description: 'Cliente no encontrado' }), (0, swagger_1.ApiResponse)({ status: 409, description: 'Ya existe un cliente con este documento' })];
            _remove_decorators = [(0, common_1.Delete)(':id'), (0, swagger_1.ApiOperation)({ summary: 'Eliminar cliente' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Cliente eliminado exitosamente' }), (0, swagger_1.ApiResponse)({ status: 401, description: 'No autenticado' }), (0, swagger_1.ApiResponse)({ status: 404, description: 'Cliente no encontrado' }), (0, swagger_1.ApiResponse)({ status: 409, description: 'No se puede eliminar - tiene documentos asociados' })];
            __esDecorate(this, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: obj => "create" in obj, get: obj => obj.create }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _findAll_decorators, { kind: "method", name: "findAll", static: false, private: false, access: { has: obj => "findAll" in obj, get: obj => obj.findAll }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _findOne_decorators, { kind: "method", name: "findOne", static: false, private: false, access: { has: obj => "findOne" in obj, get: obj => obj.findOne }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _update_decorators, { kind: "method", name: "update", static: false, private: false, access: { has: obj => "update" in obj, get: obj => obj.update }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _remove_decorators, { kind: "method", name: "remove", static: false, private: false, access: { has: obj => "remove" in obj, get: obj => obj.remove }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ClientesController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        clientesService = __runInitializers(this, _instanceExtraInitializers);
        logger = new common_1.Logger(ClientesController.name);
        constructor(clientesService) {
            this.clientesService = clientesService;
        }
        async create(user, createClienteDto) {
            this.logger.log(`User ${user.email} creating cliente`);
            if (!user.tenantId) {
                throw new common_1.ForbiddenException('Usuario no tiene tenant asignado');
            }
            return this.clientesService.create(user.tenantId, createClienteDto);
        }
        async findAll(user, query) {
            this.logger.log(`User ${user.email} listing clientes, page=${query.page}, limit=${query.limit}, search=${query.search || 'none'}`);
            if (!user.tenantId) {
                throw new common_1.ForbiddenException('Usuario no tiene tenant asignado');
            }
            return this.clientesService.findAll(user.tenantId, query);
        }
        async findOne(user, id) {
            this.logger.log(`User ${user.email} getting cliente ${id}`);
            if (!user.tenantId) {
                throw new common_1.ForbiddenException('Usuario no tiene tenant asignado');
            }
            return this.clientesService.findOne(user.tenantId, id);
        }
        async update(user, id, updateClienteDto) {
            this.logger.log(`User ${user.email} updating cliente ${id}`);
            if (!user.tenantId) {
                throw new common_1.ForbiddenException('Usuario no tiene tenant asignado');
            }
            return this.clientesService.update(user.tenantId, id, updateClienteDto);
        }
        async remove(user, id) {
            this.logger.log(`User ${user.email} deleting cliente ${id}`);
            if (!user.tenantId) {
                throw new common_1.ForbiddenException('Usuario no tiene tenant asignado');
            }
            return this.clientesService.remove(user.tenantId, id);
        }
    };
    return ClientesController = _classThis;
})();
exports.ClientesController = ClientesController;
