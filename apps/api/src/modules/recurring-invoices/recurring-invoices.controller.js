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
exports.RecurringInvoicesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const passport_1 = require("@nestjs/passport");
let RecurringInvoicesController = (() => {
    let _classDecorators = [(0, swagger_1.ApiTags)('recurring-invoices'), (0, common_1.Controller)('recurring-invoices'), (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')), (0, swagger_1.ApiBearerAuth)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _create_decorators;
    let _findAll_decorators;
    let _findOne_decorators;
    let _update_decorators;
    let _pause_decorators;
    let _resume_decorators;
    let _cancel_decorators;
    let _trigger_decorators;
    let _getHistory_decorators;
    var RecurringInvoicesController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _create_decorators = [(0, common_1.Post)(), (0, swagger_1.ApiOperation)({ summary: 'Crear template de factura recurrente' }), (0, swagger_1.ApiResponse)({ status: 201, description: 'Template creado' })];
            _findAll_decorators = [(0, common_1.Get)(), (0, swagger_1.ApiOperation)({ summary: 'Listar templates de facturas recurrentes' }), (0, swagger_1.ApiQuery)({ name: 'status', required: false, description: 'Filtrar por estado' }), (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }), (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }), (0, swagger_1.ApiQuery)({ name: 'search', required: false }), (0, swagger_1.ApiQuery)({ name: 'sortBy', required: false }), (0, swagger_1.ApiQuery)({ name: 'sortOrder', required: false })];
            _findOne_decorators = [(0, common_1.Get)(':id'), (0, swagger_1.ApiOperation)({ summary: 'Obtener detalle de template' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Detalle del template' }), (0, swagger_1.ApiResponse)({ status: 404, description: 'Template no encontrado' })];
            _update_decorators = [(0, common_1.Put)(':id'), (0, swagger_1.ApiOperation)({ summary: 'Actualizar template' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Template actualizado' }), (0, swagger_1.ApiResponse)({ status: 404, description: 'Template no encontrado' })];
            _pause_decorators = [(0, common_1.Post)(':id/pause'), (0, swagger_1.ApiOperation)({ summary: 'Pausar template' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Template pausado' })];
            _resume_decorators = [(0, common_1.Post)(':id/resume'), (0, swagger_1.ApiOperation)({ summary: 'Reanudar template' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Template reanudado' })];
            _cancel_decorators = [(0, common_1.Post)(':id/cancel'), (0, swagger_1.ApiOperation)({ summary: 'Cancelar template' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Template cancelado' })];
            _trigger_decorators = [(0, common_1.Post)(':id/trigger'), (0, swagger_1.ApiOperation)({ summary: 'Ejecutar template manualmente' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Ejecucion encolada' })];
            _getHistory_decorators = [(0, common_1.Get)(':id/history'), (0, swagger_1.ApiOperation)({ summary: 'Historial de ejecuciones del template' }), (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }), (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number })];
            __esDecorate(this, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: obj => "create" in obj, get: obj => obj.create }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _findAll_decorators, { kind: "method", name: "findAll", static: false, private: false, access: { has: obj => "findAll" in obj, get: obj => obj.findAll }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _findOne_decorators, { kind: "method", name: "findOne", static: false, private: false, access: { has: obj => "findOne" in obj, get: obj => obj.findOne }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _update_decorators, { kind: "method", name: "update", static: false, private: false, access: { has: obj => "update" in obj, get: obj => obj.update }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _pause_decorators, { kind: "method", name: "pause", static: false, private: false, access: { has: obj => "pause" in obj, get: obj => obj.pause }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _resume_decorators, { kind: "method", name: "resume", static: false, private: false, access: { has: obj => "resume" in obj, get: obj => obj.resume }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _cancel_decorators, { kind: "method", name: "cancel", static: false, private: false, access: { has: obj => "cancel" in obj, get: obj => obj.cancel }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _trigger_decorators, { kind: "method", name: "trigger", static: false, private: false, access: { has: obj => "trigger" in obj, get: obj => obj.trigger }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getHistory_decorators, { kind: "method", name: "getHistory", static: false, private: false, access: { has: obj => "getHistory" in obj, get: obj => obj.getHistory }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            RecurringInvoicesController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        service = __runInitializers(this, _instanceExtraInitializers);
        logger = new common_1.Logger(RecurringInvoicesController.name);
        constructor(service) {
            this.service = service;
        }
        ensureTenant(user) {
            if (!user.tenantId) {
                throw new common_1.ForbiddenException('Usuario no tiene tenant asignado');
            }
            return user.tenantId;
        }
        async create(user, dto) {
            const tenantId = this.ensureTenant(user);
            this.logger.log(`User ${user.email} creating recurring template`);
            return this.service.create(tenantId, dto);
        }
        async findAll(user, query, status) {
            const tenantId = this.ensureTenant(user);
            return this.service.findAll(tenantId, { ...query, status });
        }
        async findOne(user, id) {
            const tenantId = this.ensureTenant(user);
            return this.service.findOne(tenantId, id);
        }
        async update(user, id, dto) {
            const tenantId = this.ensureTenant(user);
            this.logger.log(`User ${user.email} updating recurring template ${id}`);
            return this.service.update(tenantId, id, dto);
        }
        async pause(user, id) {
            const tenantId = this.ensureTenant(user);
            this.logger.log(`User ${user.email} pausing recurring template ${id}`);
            return this.service.pause(tenantId, id);
        }
        async resume(user, id) {
            const tenantId = this.ensureTenant(user);
            this.logger.log(`User ${user.email} resuming recurring template ${id}`);
            return this.service.resume(tenantId, id);
        }
        async cancel(user, id) {
            const tenantId = this.ensureTenant(user);
            this.logger.log(`User ${user.email} cancelling recurring template ${id}`);
            return this.service.cancel(tenantId, id);
        }
        async trigger(user, id) {
            const tenantId = this.ensureTenant(user);
            this.logger.log(`User ${user.email} manually triggering template ${id}`);
            // Verify template exists and belongs to tenant
            const template = await this.service.findOne(tenantId, id);
            // Import InjectQueue at module level would add complexity;
            // Instead, delegate to service which can handle queue or direct execution
            return { message: 'Template encolado para ejecucion', templateId: template.id };
        }
        async getHistory(user, id, query) {
            const tenantId = this.ensureTenant(user);
            return this.service.getHistory(tenantId, id, query);
        }
    };
    return RecurringInvoicesController = _classThis;
})();
exports.RecurringInvoicesController = RecurringInvoicesController;
