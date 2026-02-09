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
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const dto_1 = require("./dto");
let NotificationsService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var NotificationsService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            NotificationsService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        constructor(prisma) {
            this.prisma = prisma;
        }
        async findAll(includeInactive = false) {
            const where = includeInactive ? {} : { isActive: true };
            return this.prisma.systemNotification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: {
                        select: { dismissals: true },
                    },
                },
            });
        }
        async findOne(id) {
            const notification = await this.prisma.systemNotification.findUnique({
                where: { id },
                include: {
                    _count: {
                        select: { dismissals: true },
                    },
                },
            });
            if (!notification) {
                throw new common_1.NotFoundException('Notificación no encontrada');
            }
            return notification;
        }
        async create(dto, createdById) {
            return this.prisma.systemNotification.create({
                data: {
                    title: dto.title,
                    message: dto.message,
                    type: dto.type || 'GENERAL',
                    priority: dto.priority || 'MEDIUM',
                    target: dto.target || 'ALL_USERS',
                    targetTenantId: dto.targetTenantId,
                    targetUserId: dto.targetUserId,
                    targetPlanIds: dto.targetPlanIds,
                    startsAt: dto.startsAt ? new Date(dto.startsAt) : new Date(),
                    expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
                    isDismissable: dto.isDismissable ?? true,
                    showOnce: dto.showOnce ?? false,
                    actionUrl: dto.actionUrl,
                    actionLabel: dto.actionLabel,
                    createdById,
                },
            });
        }
        async update(id, dto) {
            const notification = await this.prisma.systemNotification.findUnique({ where: { id } });
            if (!notification) {
                throw new common_1.NotFoundException('Notificación no encontrada');
            }
            // If title, message or startsAt changes significantly, clear all dismissals
            // so users see the updated notification again
            const shouldClearDismissals = (dto.title && dto.title !== notification.title) ||
                (dto.message && dto.message !== notification.message) ||
                (dto.startsAt && new Date(dto.startsAt).getTime() !== notification.startsAt.getTime());
            if (shouldClearDismissals) {
                await this.prisma.notificationDismissal.deleteMany({
                    where: { notificationId: id },
                });
            }
            return this.prisma.systemNotification.update({
                where: { id },
                data: {
                    ...dto,
                    startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
                    expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
                },
            });
        }
        async delete(id) {
            const notification = await this.prisma.systemNotification.findUnique({ where: { id } });
            if (!notification) {
                throw new common_1.NotFoundException('Notificación no encontrada');
            }
            return this.prisma.systemNotification.delete({ where: { id } });
        }
        async getActiveNotificationsForUser(userId, tenantId, planId) {
            const now = new Date();
            // Get all potentially relevant notifications
            const notifications = await this.prisma.systemNotification.findMany({
                where: {
                    isActive: true,
                    startsAt: { lte: now },
                    OR: [
                        { expiresAt: null },
                        { expiresAt: { gt: now } },
                    ],
                },
                orderBy: [
                    { priority: 'desc' },
                    { createdAt: 'desc' },
                ],
            });
            // Get user's dismissed notifications
            const dismissals = await this.prisma.notificationDismissal.findMany({
                where: { userId },
                select: { notificationId: true },
            });
            const dismissedIds = new Set(dismissals.map((d) => d.notificationId));
            // Filter notifications based on targeting and dismissals
            const filteredNotifications = notifications.filter((notif) => {
                // Skip if showOnce and already dismissed
                if (notif.showOnce && dismissedIds.has(notif.id)) {
                    return false;
                }
                // Skip if dismissed and dismissable
                if (notif.isDismissable && dismissedIds.has(notif.id)) {
                    return false;
                }
                // Check targeting
                switch (notif.target) {
                    case dto_1.NotificationTarget.ALL_USERS:
                    case dto_1.NotificationTarget.ALL_TENANTS:
                        return true;
                    case dto_1.NotificationTarget.SPECIFIC_TENANT:
                        return tenantId && notif.targetTenantId === tenantId;
                    case dto_1.NotificationTarget.SPECIFIC_USER:
                        return notif.targetUserId === userId;
                    case dto_1.NotificationTarget.BY_PLAN:
                        if (!planId || !notif.targetPlanIds)
                            return false;
                        try {
                            const targetPlans = JSON.parse(notif.targetPlanIds);
                            return targetPlans.includes(planId);
                        }
                        catch {
                            return false;
                        }
                    default:
                        return true;
                }
            });
            return filteredNotifications;
        }
        async getUnreadCount(userId, tenantId, planId) {
            const notifications = await this.getActiveNotificationsForUser(userId, tenantId, planId);
            return notifications.length;
        }
        async dismissNotification(notificationId, userId) {
            const notification = await this.prisma.systemNotification.findUnique({
                where: { id: notificationId },
            });
            if (!notification) {
                throw new common_1.NotFoundException('Notificación no encontrada');
            }
            if (!notification.isDismissable) {
                throw new Error('Esta notificación no se puede descartar');
            }
            // Upsert to handle duplicate dismissals gracefully
            return this.prisma.notificationDismissal.upsert({
                where: {
                    notificationId_userId: {
                        notificationId,
                        userId,
                    },
                },
                create: {
                    notificationId,
                    userId,
                },
                update: {
                    dismissedAt: new Date(),
                },
            });
        }
        async dismissAllForUser(userId) {
            const notifications = await this.prisma.systemNotification.findMany({
                where: {
                    isActive: true,
                    isDismissable: true,
                },
                select: { id: true },
            });
            // Get existing dismissals
            const existingDismissals = await this.prisma.notificationDismissal.findMany({
                where: {
                    userId,
                    notificationId: { in: notifications.map((n) => n.id) },
                },
                select: { notificationId: true },
            });
            const existingIds = new Set(existingDismissals.map((d) => d.notificationId));
            // Create dismissals for notifications not yet dismissed
            const newDismissals = notifications
                .filter((n) => !existingIds.has(n.id))
                .map((n) => ({
                notificationId: n.id,
                userId,
            }));
            if (newDismissals.length > 0) {
                await this.prisma.notificationDismissal.createMany({
                    data: newDismissals,
                });
            }
            return { dismissed: newDismissals.length };
        }
        async getNotificationStats() {
            const [total, active, byType, byPriority] = await Promise.all([
                this.prisma.systemNotification.count(),
                this.prisma.systemNotification.count({ where: { isActive: true } }),
                this.prisma.systemNotification.groupBy({
                    by: ['type'],
                    _count: true,
                    where: { isActive: true },
                }),
                this.prisma.systemNotification.groupBy({
                    by: ['priority'],
                    _count: true,
                    where: { isActive: true },
                }),
            ]);
            return {
                total,
                active,
                byType: byType.map((g) => ({ type: g.type, count: g._count })),
                byPriority: byPriority.map((g) => ({ priority: g.priority, count: g._count })),
            };
        }
        async createPlanLimitWarning(tenantId, planNombre, limitType, usage, max) {
            const percentage = Math.round((usage / max) * 100);
            let title = '';
            let message = '';
            switch (limitType) {
                case 'dte':
                    title = 'Límite de DTEs próximo a alcanzarse';
                    message = `Has utilizado ${usage} de ${max} DTEs este mes (${percentage}%). Considera actualizar tu plan ${planNombre}.`;
                    break;
                case 'user':
                    title = 'Límite de usuarios alcanzado';
                    message = `Has utilizado ${usage} de ${max} usuarios permitidos (${percentage}%). Actualiza tu plan para agregar más usuarios.`;
                    break;
                case 'cliente':
                    title = 'Límite de clientes próximo a alcanzarse';
                    message = `Tienes ${usage} de ${max} clientes registrados (${percentage}%). Considera actualizar tu plan.`;
                    break;
            }
            return this.create({
                title,
                message,
                type: 'PLAN_LIMIT_WARNING',
                priority: percentage >= 90 ? 'HIGH' : 'MEDIUM',
                target: 'SPECIFIC_TENANT',
                targetTenantId: tenantId,
                isDismissable: true,
                showOnce: true,
                actionUrl: '/settings/plan',
                actionLabel: 'Ver planes',
            });
        }
    };
    return NotificationsService = _classThis;
})();
exports.NotificationsService = NotificationsService;
