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
exports.UpdateNotificationDto = exports.CreateNotificationDto = exports.NotificationTarget = exports.NotificationPriority = exports.NotificationType = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
var NotificationType;
(function (NotificationType) {
    NotificationType["SYSTEM_ANNOUNCEMENT"] = "SYSTEM_ANNOUNCEMENT";
    NotificationType["MAINTENANCE"] = "MAINTENANCE";
    NotificationType["NEW_FEATURE"] = "NEW_FEATURE";
    NotificationType["PLAN_LIMIT_WARNING"] = "PLAN_LIMIT_WARNING";
    NotificationType["PLAN_EXPIRED"] = "PLAN_EXPIRED";
    NotificationType["SECURITY_ALERT"] = "SECURITY_ALERT";
    NotificationType["GENERAL"] = "GENERAL";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var NotificationPriority;
(function (NotificationPriority) {
    NotificationPriority["LOW"] = "LOW";
    NotificationPriority["MEDIUM"] = "MEDIUM";
    NotificationPriority["HIGH"] = "HIGH";
    NotificationPriority["URGENT"] = "URGENT";
})(NotificationPriority || (exports.NotificationPriority = NotificationPriority = {}));
var NotificationTarget;
(function (NotificationTarget) {
    NotificationTarget["ALL_USERS"] = "ALL_USERS";
    NotificationTarget["ALL_TENANTS"] = "ALL_TENANTS";
    NotificationTarget["SPECIFIC_TENANT"] = "SPECIFIC_TENANT";
    NotificationTarget["SPECIFIC_USER"] = "SPECIFIC_USER";
    NotificationTarget["BY_PLAN"] = "BY_PLAN";
})(NotificationTarget || (exports.NotificationTarget = NotificationTarget = {}));
let CreateNotificationDto = (() => {
    let _title_decorators;
    let _title_initializers = [];
    let _title_extraInitializers = [];
    let _message_decorators;
    let _message_initializers = [];
    let _message_extraInitializers = [];
    let _type_decorators;
    let _type_initializers = [];
    let _type_extraInitializers = [];
    let _priority_decorators;
    let _priority_initializers = [];
    let _priority_extraInitializers = [];
    let _target_decorators;
    let _target_initializers = [];
    let _target_extraInitializers = [];
    let _targetTenantId_decorators;
    let _targetTenantId_initializers = [];
    let _targetTenantId_extraInitializers = [];
    let _targetUserId_decorators;
    let _targetUserId_initializers = [];
    let _targetUserId_extraInitializers = [];
    let _targetPlanIds_decorators;
    let _targetPlanIds_initializers = [];
    let _targetPlanIds_extraInitializers = [];
    let _startsAt_decorators;
    let _startsAt_initializers = [];
    let _startsAt_extraInitializers = [];
    let _expiresAt_decorators;
    let _expiresAt_initializers = [];
    let _expiresAt_extraInitializers = [];
    let _isDismissable_decorators;
    let _isDismissable_initializers = [];
    let _isDismissable_extraInitializers = [];
    let _showOnce_decorators;
    let _showOnce_initializers = [];
    let _showOnce_extraInitializers = [];
    let _actionUrl_decorators;
    let _actionUrl_initializers = [];
    let _actionUrl_extraInitializers = [];
    let _actionLabel_decorators;
    let _actionLabel_initializers = [];
    let _actionLabel_extraInitializers = [];
    return class CreateNotificationDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _title_decorators = [(0, swagger_1.ApiProperty)({ description: 'Título de la notificación' }), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(255)];
            _message_decorators = [(0, swagger_1.ApiProperty)({ description: 'Mensaje de la notificación' }), (0, class_validator_1.IsString)()];
            _type_decorators = [(0, swagger_1.ApiPropertyOptional)({ enum: NotificationType, default: NotificationType.GENERAL }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEnum)(NotificationType)];
            _priority_decorators = [(0, swagger_1.ApiPropertyOptional)({ enum: NotificationPriority, default: NotificationPriority.MEDIUM }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEnum)(NotificationPriority)];
            _target_decorators = [(0, swagger_1.ApiPropertyOptional)({ enum: NotificationTarget, default: NotificationTarget.ALL_USERS }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEnum)(NotificationTarget)];
            _targetTenantId_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'ID del tenant objetivo (si target = SPECIFIC_TENANT)' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _targetUserId_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'ID del usuario objetivo (si target = SPECIFIC_USER)' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _targetPlanIds_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'IDs de planes objetivo (si target = BY_PLAN)' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _startsAt_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Fecha de inicio de la notificación' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsDateString)()];
            _expiresAt_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Fecha de expiración de la notificación' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsDateString)()];
            _isDismissable_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Permite descartar la notificación', default: true }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsBoolean)()];
            _showOnce_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Mostrar solo una vez', default: false }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsBoolean)()];
            _actionUrl_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'URL de acción' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _actionLabel_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Texto del botón de acción' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(100)];
            __esDecorate(null, null, _title_decorators, { kind: "field", name: "title", static: false, private: false, access: { has: obj => "title" in obj, get: obj => obj.title, set: (obj, value) => { obj.title = value; } }, metadata: _metadata }, _title_initializers, _title_extraInitializers);
            __esDecorate(null, null, _message_decorators, { kind: "field", name: "message", static: false, private: false, access: { has: obj => "message" in obj, get: obj => obj.message, set: (obj, value) => { obj.message = value; } }, metadata: _metadata }, _message_initializers, _message_extraInitializers);
            __esDecorate(null, null, _type_decorators, { kind: "field", name: "type", static: false, private: false, access: { has: obj => "type" in obj, get: obj => obj.type, set: (obj, value) => { obj.type = value; } }, metadata: _metadata }, _type_initializers, _type_extraInitializers);
            __esDecorate(null, null, _priority_decorators, { kind: "field", name: "priority", static: false, private: false, access: { has: obj => "priority" in obj, get: obj => obj.priority, set: (obj, value) => { obj.priority = value; } }, metadata: _metadata }, _priority_initializers, _priority_extraInitializers);
            __esDecorate(null, null, _target_decorators, { kind: "field", name: "target", static: false, private: false, access: { has: obj => "target" in obj, get: obj => obj.target, set: (obj, value) => { obj.target = value; } }, metadata: _metadata }, _target_initializers, _target_extraInitializers);
            __esDecorate(null, null, _targetTenantId_decorators, { kind: "field", name: "targetTenantId", static: false, private: false, access: { has: obj => "targetTenantId" in obj, get: obj => obj.targetTenantId, set: (obj, value) => { obj.targetTenantId = value; } }, metadata: _metadata }, _targetTenantId_initializers, _targetTenantId_extraInitializers);
            __esDecorate(null, null, _targetUserId_decorators, { kind: "field", name: "targetUserId", static: false, private: false, access: { has: obj => "targetUserId" in obj, get: obj => obj.targetUserId, set: (obj, value) => { obj.targetUserId = value; } }, metadata: _metadata }, _targetUserId_initializers, _targetUserId_extraInitializers);
            __esDecorate(null, null, _targetPlanIds_decorators, { kind: "field", name: "targetPlanIds", static: false, private: false, access: { has: obj => "targetPlanIds" in obj, get: obj => obj.targetPlanIds, set: (obj, value) => { obj.targetPlanIds = value; } }, metadata: _metadata }, _targetPlanIds_initializers, _targetPlanIds_extraInitializers);
            __esDecorate(null, null, _startsAt_decorators, { kind: "field", name: "startsAt", static: false, private: false, access: { has: obj => "startsAt" in obj, get: obj => obj.startsAt, set: (obj, value) => { obj.startsAt = value; } }, metadata: _metadata }, _startsAt_initializers, _startsAt_extraInitializers);
            __esDecorate(null, null, _expiresAt_decorators, { kind: "field", name: "expiresAt", static: false, private: false, access: { has: obj => "expiresAt" in obj, get: obj => obj.expiresAt, set: (obj, value) => { obj.expiresAt = value; } }, metadata: _metadata }, _expiresAt_initializers, _expiresAt_extraInitializers);
            __esDecorate(null, null, _isDismissable_decorators, { kind: "field", name: "isDismissable", static: false, private: false, access: { has: obj => "isDismissable" in obj, get: obj => obj.isDismissable, set: (obj, value) => { obj.isDismissable = value; } }, metadata: _metadata }, _isDismissable_initializers, _isDismissable_extraInitializers);
            __esDecorate(null, null, _showOnce_decorators, { kind: "field", name: "showOnce", static: false, private: false, access: { has: obj => "showOnce" in obj, get: obj => obj.showOnce, set: (obj, value) => { obj.showOnce = value; } }, metadata: _metadata }, _showOnce_initializers, _showOnce_extraInitializers);
            __esDecorate(null, null, _actionUrl_decorators, { kind: "field", name: "actionUrl", static: false, private: false, access: { has: obj => "actionUrl" in obj, get: obj => obj.actionUrl, set: (obj, value) => { obj.actionUrl = value; } }, metadata: _metadata }, _actionUrl_initializers, _actionUrl_extraInitializers);
            __esDecorate(null, null, _actionLabel_decorators, { kind: "field", name: "actionLabel", static: false, private: false, access: { has: obj => "actionLabel" in obj, get: obj => obj.actionLabel, set: (obj, value) => { obj.actionLabel = value; } }, metadata: _metadata }, _actionLabel_initializers, _actionLabel_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        title = __runInitializers(this, _title_initializers, void 0);
        message = (__runInitializers(this, _title_extraInitializers), __runInitializers(this, _message_initializers, void 0));
        type = (__runInitializers(this, _message_extraInitializers), __runInitializers(this, _type_initializers, void 0));
        priority = (__runInitializers(this, _type_extraInitializers), __runInitializers(this, _priority_initializers, void 0));
        target = (__runInitializers(this, _priority_extraInitializers), __runInitializers(this, _target_initializers, void 0));
        targetTenantId = (__runInitializers(this, _target_extraInitializers), __runInitializers(this, _targetTenantId_initializers, void 0));
        targetUserId = (__runInitializers(this, _targetTenantId_extraInitializers), __runInitializers(this, _targetUserId_initializers, void 0));
        targetPlanIds = (__runInitializers(this, _targetUserId_extraInitializers), __runInitializers(this, _targetPlanIds_initializers, void 0)); // JSON array
        startsAt = (__runInitializers(this, _targetPlanIds_extraInitializers), __runInitializers(this, _startsAt_initializers, void 0));
        expiresAt = (__runInitializers(this, _startsAt_extraInitializers), __runInitializers(this, _expiresAt_initializers, void 0));
        isDismissable = (__runInitializers(this, _expiresAt_extraInitializers), __runInitializers(this, _isDismissable_initializers, void 0));
        showOnce = (__runInitializers(this, _isDismissable_extraInitializers), __runInitializers(this, _showOnce_initializers, void 0));
        actionUrl = (__runInitializers(this, _showOnce_extraInitializers), __runInitializers(this, _actionUrl_initializers, void 0));
        actionLabel = (__runInitializers(this, _actionUrl_extraInitializers), __runInitializers(this, _actionLabel_initializers, void 0));
        constructor() {
            __runInitializers(this, _actionLabel_extraInitializers);
        }
    };
})();
exports.CreateNotificationDto = CreateNotificationDto;
let UpdateNotificationDto = (() => {
    let _title_decorators;
    let _title_initializers = [];
    let _title_extraInitializers = [];
    let _message_decorators;
    let _message_initializers = [];
    let _message_extraInitializers = [];
    let _type_decorators;
    let _type_initializers = [];
    let _type_extraInitializers = [];
    let _priority_decorators;
    let _priority_initializers = [];
    let _priority_extraInitializers = [];
    let _target_decorators;
    let _target_initializers = [];
    let _target_extraInitializers = [];
    let _targetTenantId_decorators;
    let _targetTenantId_initializers = [];
    let _targetTenantId_extraInitializers = [];
    let _targetUserId_decorators;
    let _targetUserId_initializers = [];
    let _targetUserId_extraInitializers = [];
    let _targetPlanIds_decorators;
    let _targetPlanIds_initializers = [];
    let _targetPlanIds_extraInitializers = [];
    let _startsAt_decorators;
    let _startsAt_initializers = [];
    let _startsAt_extraInitializers = [];
    let _expiresAt_decorators;
    let _expiresAt_initializers = [];
    let _expiresAt_extraInitializers = [];
    let _isDismissable_decorators;
    let _isDismissable_initializers = [];
    let _isDismissable_extraInitializers = [];
    let _showOnce_decorators;
    let _showOnce_initializers = [];
    let _showOnce_extraInitializers = [];
    let _actionUrl_decorators;
    let _actionUrl_initializers = [];
    let _actionUrl_extraInitializers = [];
    let _actionLabel_decorators;
    let _actionLabel_initializers = [];
    let _actionLabel_extraInitializers = [];
    let _isActive_decorators;
    let _isActive_initializers = [];
    let _isActive_extraInitializers = [];
    return class UpdateNotificationDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _title_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Título de la notificación' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(255)];
            _message_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Mensaje de la notificación' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _type_decorators = [(0, swagger_1.ApiPropertyOptional)({ enum: NotificationType }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEnum)(NotificationType)];
            _priority_decorators = [(0, swagger_1.ApiPropertyOptional)({ enum: NotificationPriority }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEnum)(NotificationPriority)];
            _target_decorators = [(0, swagger_1.ApiPropertyOptional)({ enum: NotificationTarget }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEnum)(NotificationTarget)];
            _targetTenantId_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'ID del tenant objetivo' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _targetUserId_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'ID del usuario objetivo' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _targetPlanIds_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'IDs de planes objetivo' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _startsAt_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Fecha de inicio' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsDateString)()];
            _expiresAt_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Fecha de expiración' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsDateString)()];
            _isDismissable_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Permite descartar' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsBoolean)()];
            _showOnce_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Mostrar solo una vez' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsBoolean)()];
            _actionUrl_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'URL de acción' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _actionLabel_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Texto del botón de acción' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(100)];
            _isActive_decorators = [(0, swagger_1.ApiPropertyOptional)({ description: 'Notificación activa' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsBoolean)()];
            __esDecorate(null, null, _title_decorators, { kind: "field", name: "title", static: false, private: false, access: { has: obj => "title" in obj, get: obj => obj.title, set: (obj, value) => { obj.title = value; } }, metadata: _metadata }, _title_initializers, _title_extraInitializers);
            __esDecorate(null, null, _message_decorators, { kind: "field", name: "message", static: false, private: false, access: { has: obj => "message" in obj, get: obj => obj.message, set: (obj, value) => { obj.message = value; } }, metadata: _metadata }, _message_initializers, _message_extraInitializers);
            __esDecorate(null, null, _type_decorators, { kind: "field", name: "type", static: false, private: false, access: { has: obj => "type" in obj, get: obj => obj.type, set: (obj, value) => { obj.type = value; } }, metadata: _metadata }, _type_initializers, _type_extraInitializers);
            __esDecorate(null, null, _priority_decorators, { kind: "field", name: "priority", static: false, private: false, access: { has: obj => "priority" in obj, get: obj => obj.priority, set: (obj, value) => { obj.priority = value; } }, metadata: _metadata }, _priority_initializers, _priority_extraInitializers);
            __esDecorate(null, null, _target_decorators, { kind: "field", name: "target", static: false, private: false, access: { has: obj => "target" in obj, get: obj => obj.target, set: (obj, value) => { obj.target = value; } }, metadata: _metadata }, _target_initializers, _target_extraInitializers);
            __esDecorate(null, null, _targetTenantId_decorators, { kind: "field", name: "targetTenantId", static: false, private: false, access: { has: obj => "targetTenantId" in obj, get: obj => obj.targetTenantId, set: (obj, value) => { obj.targetTenantId = value; } }, metadata: _metadata }, _targetTenantId_initializers, _targetTenantId_extraInitializers);
            __esDecorate(null, null, _targetUserId_decorators, { kind: "field", name: "targetUserId", static: false, private: false, access: { has: obj => "targetUserId" in obj, get: obj => obj.targetUserId, set: (obj, value) => { obj.targetUserId = value; } }, metadata: _metadata }, _targetUserId_initializers, _targetUserId_extraInitializers);
            __esDecorate(null, null, _targetPlanIds_decorators, { kind: "field", name: "targetPlanIds", static: false, private: false, access: { has: obj => "targetPlanIds" in obj, get: obj => obj.targetPlanIds, set: (obj, value) => { obj.targetPlanIds = value; } }, metadata: _metadata }, _targetPlanIds_initializers, _targetPlanIds_extraInitializers);
            __esDecorate(null, null, _startsAt_decorators, { kind: "field", name: "startsAt", static: false, private: false, access: { has: obj => "startsAt" in obj, get: obj => obj.startsAt, set: (obj, value) => { obj.startsAt = value; } }, metadata: _metadata }, _startsAt_initializers, _startsAt_extraInitializers);
            __esDecorate(null, null, _expiresAt_decorators, { kind: "field", name: "expiresAt", static: false, private: false, access: { has: obj => "expiresAt" in obj, get: obj => obj.expiresAt, set: (obj, value) => { obj.expiresAt = value; } }, metadata: _metadata }, _expiresAt_initializers, _expiresAt_extraInitializers);
            __esDecorate(null, null, _isDismissable_decorators, { kind: "field", name: "isDismissable", static: false, private: false, access: { has: obj => "isDismissable" in obj, get: obj => obj.isDismissable, set: (obj, value) => { obj.isDismissable = value; } }, metadata: _metadata }, _isDismissable_initializers, _isDismissable_extraInitializers);
            __esDecorate(null, null, _showOnce_decorators, { kind: "field", name: "showOnce", static: false, private: false, access: { has: obj => "showOnce" in obj, get: obj => obj.showOnce, set: (obj, value) => { obj.showOnce = value; } }, metadata: _metadata }, _showOnce_initializers, _showOnce_extraInitializers);
            __esDecorate(null, null, _actionUrl_decorators, { kind: "field", name: "actionUrl", static: false, private: false, access: { has: obj => "actionUrl" in obj, get: obj => obj.actionUrl, set: (obj, value) => { obj.actionUrl = value; } }, metadata: _metadata }, _actionUrl_initializers, _actionUrl_extraInitializers);
            __esDecorate(null, null, _actionLabel_decorators, { kind: "field", name: "actionLabel", static: false, private: false, access: { has: obj => "actionLabel" in obj, get: obj => obj.actionLabel, set: (obj, value) => { obj.actionLabel = value; } }, metadata: _metadata }, _actionLabel_initializers, _actionLabel_extraInitializers);
            __esDecorate(null, null, _isActive_decorators, { kind: "field", name: "isActive", static: false, private: false, access: { has: obj => "isActive" in obj, get: obj => obj.isActive, set: (obj, value) => { obj.isActive = value; } }, metadata: _metadata }, _isActive_initializers, _isActive_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        title = __runInitializers(this, _title_initializers, void 0);
        message = (__runInitializers(this, _title_extraInitializers), __runInitializers(this, _message_initializers, void 0));
        type = (__runInitializers(this, _message_extraInitializers), __runInitializers(this, _type_initializers, void 0));
        priority = (__runInitializers(this, _type_extraInitializers), __runInitializers(this, _priority_initializers, void 0));
        target = (__runInitializers(this, _priority_extraInitializers), __runInitializers(this, _target_initializers, void 0));
        targetTenantId = (__runInitializers(this, _target_extraInitializers), __runInitializers(this, _targetTenantId_initializers, void 0));
        targetUserId = (__runInitializers(this, _targetTenantId_extraInitializers), __runInitializers(this, _targetUserId_initializers, void 0));
        targetPlanIds = (__runInitializers(this, _targetUserId_extraInitializers), __runInitializers(this, _targetPlanIds_initializers, void 0));
        startsAt = (__runInitializers(this, _targetPlanIds_extraInitializers), __runInitializers(this, _startsAt_initializers, void 0));
        expiresAt = (__runInitializers(this, _startsAt_extraInitializers), __runInitializers(this, _expiresAt_initializers, void 0));
        isDismissable = (__runInitializers(this, _expiresAt_extraInitializers), __runInitializers(this, _isDismissable_initializers, void 0));
        showOnce = (__runInitializers(this, _isDismissable_extraInitializers), __runInitializers(this, _showOnce_initializers, void 0));
        actionUrl = (__runInitializers(this, _showOnce_extraInitializers), __runInitializers(this, _actionUrl_initializers, void 0));
        actionLabel = (__runInitializers(this, _actionUrl_extraInitializers), __runInitializers(this, _actionLabel_initializers, void 0));
        isActive = (__runInitializers(this, _actionLabel_extraInitializers), __runInitializers(this, _isActive_initializers, void 0));
        constructor() {
            __runInitializers(this, _isActive_extraInitializers);
        }
    };
})();
exports.UpdateNotificationDto = UpdateNotificationDto;
