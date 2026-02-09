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
exports.NotificationsUserController = exports.NotificationsAdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const super_admin_guard_1 = require("../super-admin/guards/super-admin.guard");
let NotificationsAdminController = (() => {
    let _classDecorators = [(0, swagger_1.ApiTags)('Notifications - Admin'), (0, swagger_1.ApiBearerAuth)(), (0, common_1.Controller)('admin/notifications'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, super_admin_guard_1.SuperAdminGuard)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _findAll_decorators;
    let _getStats_decorators;
    let _findOne_decorators;
    let _create_decorators;
    let _update_decorators;
    let _delete_decorators;
    let _deactivate_decorators;
    let _activate_decorators;
    var NotificationsAdminController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _findAll_decorators = [(0, common_1.Get)(), (0, swagger_1.ApiOperation)({ summary: 'Listar todas las notificaciones' }), (0, swagger_1.ApiQuery)({ name: 'includeInactive', required: false, type: Boolean })];
            _getStats_decorators = [(0, common_1.Get)('stats'), (0, swagger_1.ApiOperation)({ summary: 'Obtener estadísticas de notificaciones' })];
            _findOne_decorators = [(0, common_1.Get)(':id'), (0, swagger_1.ApiOperation)({ summary: 'Obtener notificación por ID' })];
            _create_decorators = [(0, common_1.Post)(), (0, swagger_1.ApiOperation)({ summary: 'Crear nueva notificación' })];
            _update_decorators = [(0, common_1.Put)(':id'), (0, swagger_1.ApiOperation)({ summary: 'Actualizar notificación' })];
            _delete_decorators = [(0, common_1.Delete)(':id'), (0, swagger_1.ApiOperation)({ summary: 'Eliminar notificación' })];
            _deactivate_decorators = [(0, common_1.Post)(':id/deactivate'), (0, swagger_1.ApiOperation)({ summary: 'Desactivar notificación' })];
            _activate_decorators = [(0, common_1.Post)(':id/activate'), (0, swagger_1.ApiOperation)({ summary: 'Activar notificación' })];
            __esDecorate(this, null, _findAll_decorators, { kind: "method", name: "findAll", static: false, private: false, access: { has: obj => "findAll" in obj, get: obj => obj.findAll }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getStats_decorators, { kind: "method", name: "getStats", static: false, private: false, access: { has: obj => "getStats" in obj, get: obj => obj.getStats }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _findOne_decorators, { kind: "method", name: "findOne", static: false, private: false, access: { has: obj => "findOne" in obj, get: obj => obj.findOne }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: obj => "create" in obj, get: obj => obj.create }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _update_decorators, { kind: "method", name: "update", static: false, private: false, access: { has: obj => "update" in obj, get: obj => obj.update }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _delete_decorators, { kind: "method", name: "delete", static: false, private: false, access: { has: obj => "delete" in obj, get: obj => obj.delete }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _deactivate_decorators, { kind: "method", name: "deactivate", static: false, private: false, access: { has: obj => "deactivate" in obj, get: obj => obj.deactivate }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _activate_decorators, { kind: "method", name: "activate", static: false, private: false, access: { has: obj => "activate" in obj, get: obj => obj.activate }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            NotificationsAdminController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        notificationsService = __runInitializers(this, _instanceExtraInitializers);
        constructor(notificationsService) {
            this.notificationsService = notificationsService;
        }
        async findAll(includeInactive) {
            return this.notificationsService.findAll(includeInactive === 'true');
        }
        async getStats() {
            return this.notificationsService.getNotificationStats();
        }
        async findOne(id) {
            return this.notificationsService.findOne(id);
        }
        async create(dto, req) {
            return this.notificationsService.create(dto, req.user?.id);
        }
        async update(id, dto) {
            return this.notificationsService.update(id, dto);
        }
        async delete(id) {
            return this.notificationsService.delete(id);
        }
        async deactivate(id) {
            return this.notificationsService.update(id, { isActive: false });
        }
        async activate(id) {
            return this.notificationsService.update(id, { isActive: true });
        }
    };
    return NotificationsAdminController = _classThis;
})();
exports.NotificationsAdminController = NotificationsAdminController;
let NotificationsUserController = (() => {
    let _classDecorators = [(0, swagger_1.ApiTags)('Notifications - User'), (0, swagger_1.ApiBearerAuth)(), (0, common_1.Controller)('notifications'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _getMyNotifications_decorators;
    let _getUnreadCount_decorators;
    let _dismiss_decorators;
    let _dismissAll_decorators;
    var NotificationsUserController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _getMyNotifications_decorators = [(0, common_1.Get)(), (0, swagger_1.ApiOperation)({ summary: 'Obtener notificaciones activas para el usuario actual' })];
            _getUnreadCount_decorators = [(0, common_1.Get)('count'), (0, swagger_1.ApiOperation)({ summary: 'Obtener cantidad de notificaciones sin leer' })];
            _dismiss_decorators = [(0, common_1.Post)(':id/dismiss'), (0, swagger_1.ApiOperation)({ summary: 'Descartar una notificación' })];
            _dismissAll_decorators = [(0, common_1.Post)('dismiss-all'), (0, swagger_1.ApiOperation)({ summary: 'Descartar todas las notificaciones' })];
            __esDecorate(this, null, _getMyNotifications_decorators, { kind: "method", name: "getMyNotifications", static: false, private: false, access: { has: obj => "getMyNotifications" in obj, get: obj => obj.getMyNotifications }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getUnreadCount_decorators, { kind: "method", name: "getUnreadCount", static: false, private: false, access: { has: obj => "getUnreadCount" in obj, get: obj => obj.getUnreadCount }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _dismiss_decorators, { kind: "method", name: "dismiss", static: false, private: false, access: { has: obj => "dismiss" in obj, get: obj => obj.dismiss }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _dismissAll_decorators, { kind: "method", name: "dismissAll", static: false, private: false, access: { has: obj => "dismissAll" in obj, get: obj => obj.dismissAll }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            NotificationsUserController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        notificationsService = __runInitializers(this, _instanceExtraInitializers);
        constructor(notificationsService) {
            this.notificationsService = notificationsService;
        }
        async getMyNotifications(req) {
            const user = req.user;
            return this.notificationsService.getActiveNotificationsForUser(user.id, user.tenantId, user.tenant?.planId);
        }
        async getUnreadCount(req) {
            const user = req.user;
            const count = await this.notificationsService.getUnreadCount(user.id, user.tenantId, user.tenant?.planId);
            return { count };
        }
        async dismiss(id, req) {
            return this.notificationsService.dismissNotification(id, req.user.id);
        }
        async dismissAll(req) {
            return this.notificationsService.dismissAllForUser(req.user.id);
        }
    };
    return NotificationsUserController = _classThis;
})();
exports.NotificationsUserController = NotificationsUserController;
