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
exports.AdminSupportController = exports.SupportController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const super_admin_guard_1 = require("../super-admin/guards/super-admin.guard");
// ============ USER ENDPOINTS ============
let SupportController = (() => {
    let _classDecorators = [(0, swagger_1.ApiTags)('support-tickets'), (0, swagger_1.ApiBearerAuth)(), (0, common_1.Controller)('support-tickets'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _createTicket_decorators;
    let _getUserTickets_decorators;
    let _getUserTicketById_decorators;
    let _addUserComment_decorators;
    var SupportController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _createTicket_decorators = [(0, common_1.Post)(), (0, swagger_1.ApiOperation)({ summary: 'Crear un nuevo ticket de soporte' })];
            _getUserTickets_decorators = [(0, common_1.Get)(), (0, swagger_1.ApiOperation)({ summary: 'Listar tickets del tenant actual' }), (0, swagger_1.ApiQuery)({ name: 'page', required: false }), (0, swagger_1.ApiQuery)({ name: 'limit', required: false })];
            _getUserTicketById_decorators = [(0, common_1.Get)(':id'), (0, swagger_1.ApiOperation)({ summary: 'Obtener detalle de un ticket (usuario)' })];
            _addUserComment_decorators = [(0, common_1.Post)(':id/comments'), (0, swagger_1.ApiOperation)({ summary: 'Agregar comentario a un ticket (usuario)' })];
            __esDecorate(this, null, _createTicket_decorators, { kind: "method", name: "createTicket", static: false, private: false, access: { has: obj => "createTicket" in obj, get: obj => obj.createTicket }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getUserTickets_decorators, { kind: "method", name: "getUserTickets", static: false, private: false, access: { has: obj => "getUserTickets" in obj, get: obj => obj.getUserTickets }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getUserTicketById_decorators, { kind: "method", name: "getUserTicketById", static: false, private: false, access: { has: obj => "getUserTicketById" in obj, get: obj => obj.getUserTicketById }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _addUserComment_decorators, { kind: "method", name: "addUserComment", static: false, private: false, access: { has: obj => "addUserComment" in obj, get: obj => obj.addUserComment }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SupportController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportService = __runInitializers(this, _instanceExtraInitializers);
        constructor(supportService) {
            this.supportService = supportService;
        }
        createTicket(user, data) {
            if (!user.tenantId) {
                throw new common_1.BadRequestException('Solo usuarios de empresas pueden crear tickets de soporte');
            }
            return this.supportService.createTicket(user.tenantId, user.id, data);
        }
        getUserTickets(user, page, limit) {
            if (!user.tenantId) {
                throw new common_1.BadRequestException('Solo usuarios de empresas pueden ver tickets');
            }
            return this.supportService.getUserTickets(user.tenantId, page ? parseInt(page) : 1, limit ? parseInt(limit) : 10);
        }
        getUserTicketById(user, id) {
            if (!user.tenantId) {
                throw new common_1.BadRequestException('Solo usuarios de una empresa pueden ver tickets');
            }
            return this.supportService.getUserTicketById(user.tenantId, id, user.id);
        }
        addUserComment(user, id, data) {
            if (!user.tenantId) {
                throw new common_1.BadRequestException('Solo usuarios de una empresa pueden comentar tickets');
            }
            return this.supportService.addUserComment(user.tenantId, id, user.id, data);
        }
    };
    return SupportController = _classThis;
})();
exports.SupportController = SupportController;
// ============ ADMIN ENDPOINTS ============
let AdminSupportController = (() => {
    let _classDecorators = [(0, swagger_1.ApiTags)('admin-support-tickets'), (0, swagger_1.ApiBearerAuth)(), (0, common_1.Controller)('admin/support-tickets'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, super_admin_guard_1.SuperAdminGuard)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _getAllTickets_decorators;
    let _getTicketStats_decorators;
    let _getSuperAdmins_decorators;
    let _getTicketsByTenant_decorators;
    let _getAdminTicketById_decorators;
    let _updateTicket_decorators;
    let _addAdminComment_decorators;
    var AdminSupportController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _getAllTickets_decorators = [(0, common_1.Get)(), (0, swagger_1.ApiOperation)({ summary: 'Listar todos los tickets (Admin)' }), (0, swagger_1.ApiQuery)({ name: 'page', required: false }), (0, swagger_1.ApiQuery)({ name: 'limit', required: false }), (0, swagger_1.ApiQuery)({ name: 'status', required: false }), (0, swagger_1.ApiQuery)({ name: 'priority', required: false }), (0, swagger_1.ApiQuery)({ name: 'assignedToId', required: false }), (0, swagger_1.ApiQuery)({ name: 'tenantId', required: false }), (0, swagger_1.ApiQuery)({ name: 'type', required: false }), (0, swagger_1.ApiQuery)({ name: 'search', required: false })];
            _getTicketStats_decorators = [(0, common_1.Get)('stats'), (0, swagger_1.ApiOperation)({ summary: 'Obtener estadisticas de tickets (Admin)' })];
            _getSuperAdmins_decorators = [(0, common_1.Get)('admins'), (0, swagger_1.ApiOperation)({ summary: 'Obtener lista de super admins para asignacion' })];
            _getTicketsByTenant_decorators = [(0, common_1.Get)('tenant/:tenantId'), (0, swagger_1.ApiOperation)({ summary: 'Obtener tickets de un tenant especifico' }), (0, swagger_1.ApiQuery)({ name: 'limit', required: false })];
            _getAdminTicketById_decorators = [(0, common_1.Get)(':id'), (0, swagger_1.ApiOperation)({ summary: 'Obtener detalle de un ticket (Admin)' })];
            _updateTicket_decorators = [(0, common_1.Patch)(':id'), (0, swagger_1.ApiOperation)({ summary: 'Actualizar ticket (estado, prioridad, asignacion)' })];
            _addAdminComment_decorators = [(0, common_1.Post)(':id/comments'), (0, swagger_1.ApiOperation)({ summary: 'Agregar comentario a un ticket (Admin)' })];
            __esDecorate(this, null, _getAllTickets_decorators, { kind: "method", name: "getAllTickets", static: false, private: false, access: { has: obj => "getAllTickets" in obj, get: obj => obj.getAllTickets }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getTicketStats_decorators, { kind: "method", name: "getTicketStats", static: false, private: false, access: { has: obj => "getTicketStats" in obj, get: obj => obj.getTicketStats }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getSuperAdmins_decorators, { kind: "method", name: "getSuperAdmins", static: false, private: false, access: { has: obj => "getSuperAdmins" in obj, get: obj => obj.getSuperAdmins }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getTicketsByTenant_decorators, { kind: "method", name: "getTicketsByTenant", static: false, private: false, access: { has: obj => "getTicketsByTenant" in obj, get: obj => obj.getTicketsByTenant }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getAdminTicketById_decorators, { kind: "method", name: "getAdminTicketById", static: false, private: false, access: { has: obj => "getAdminTicketById" in obj, get: obj => obj.getAdminTicketById }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _updateTicket_decorators, { kind: "method", name: "updateTicket", static: false, private: false, access: { has: obj => "updateTicket" in obj, get: obj => obj.updateTicket }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _addAdminComment_decorators, { kind: "method", name: "addAdminComment", static: false, private: false, access: { has: obj => "addAdminComment" in obj, get: obj => obj.addAdminComment }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AdminSupportController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportService = __runInitializers(this, _instanceExtraInitializers);
        constructor(supportService) {
            this.supportService = supportService;
        }
        getAllTickets(page, limit, status, priority, assignedToId, tenantId, type, search) {
            return this.supportService.getAllTickets({
                page: page ? parseInt(page) : 1,
                limit: limit ? parseInt(limit) : 20,
                status,
                priority,
                assignedToId,
                tenantId,
                type,
                search,
            });
        }
        getTicketStats() {
            return this.supportService.getTicketStats();
        }
        getSuperAdmins() {
            return this.supportService.getSuperAdmins();
        }
        getTicketsByTenant(tenantId, limit) {
            return this.supportService.getTicketsByTenant(tenantId, limit ? parseInt(limit) : 10);
        }
        getAdminTicketById(id) {
            return this.supportService.getAdminTicketById(id);
        }
        updateTicket(user, id, data) {
            return this.supportService.updateTicket(id, user.id, data);
        }
        addAdminComment(user, id, data) {
            return this.supportService.addAdminComment(id, user.id, data);
        }
    };
    return AdminSupportController = _classThis;
})();
exports.AdminSupportController = AdminSupportController;
