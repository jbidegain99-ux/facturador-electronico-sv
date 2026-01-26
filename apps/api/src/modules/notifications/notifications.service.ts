import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateNotificationDto, UpdateNotificationDto, NotificationTarget } from './dto';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

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

  async findOne(id: string) {
    const notification = await this.prisma.systemNotification.findUnique({
      where: { id },
      include: {
        _count: {
          select: { dismissals: true },
        },
      },
    });

    if (!notification) {
      throw new NotFoundException('Notificación no encontrada');
    }

    return notification;
  }

  async create(dto: CreateNotificationDto, createdById?: string) {
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

  async update(id: string, dto: UpdateNotificationDto) {
    const notification = await this.prisma.systemNotification.findUnique({ where: { id } });
    if (!notification) {
      throw new NotFoundException('Notificación no encontrada');
    }

    // If title, message or startsAt changes significantly, clear all dismissals
    // so users see the updated notification again
    const shouldClearDismissals =
      (dto.title && dto.title !== notification.title) ||
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

  async delete(id: string) {
    const notification = await this.prisma.systemNotification.findUnique({ where: { id } });
    if (!notification) {
      throw new NotFoundException('Notificación no encontrada');
    }

    return this.prisma.systemNotification.delete({ where: { id } });
  }

  async getActiveNotificationsForUser(userId: string, tenantId?: string, planId?: string) {
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

    const dismissedIds = new Set(dismissals.map((d: { notificationId: string }) => d.notificationId));

    // Filter notifications based on targeting and dismissals
    const filteredNotifications = notifications.filter((notif: typeof notifications[number]) => {
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
        case NotificationTarget.ALL_USERS:
        case NotificationTarget.ALL_TENANTS:
          return true;

        case NotificationTarget.SPECIFIC_TENANT:
          return tenantId && notif.targetTenantId === tenantId;

        case NotificationTarget.SPECIFIC_USER:
          return notif.targetUserId === userId;

        case NotificationTarget.BY_PLAN:
          if (!planId || !notif.targetPlanIds) return false;
          try {
            const targetPlans = JSON.parse(notif.targetPlanIds) as string[];
            return targetPlans.includes(planId);
          } catch {
            return false;
          }

        default:
          return true;
      }
    });

    return filteredNotifications;
  }

  async getUnreadCount(userId: string, tenantId?: string, planId?: string) {
    const notifications = await this.getActiveNotificationsForUser(userId, tenantId, planId);
    return notifications.length;
  }

  async dismissNotification(notificationId: string, userId: string) {
    const notification = await this.prisma.systemNotification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notificación no encontrada');
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

  async dismissAllForUser(userId: string) {
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
        notificationId: { in: notifications.map((n: { id: string }) => n.id) },
      },
      select: { notificationId: true },
    });

    const existingIds = new Set(existingDismissals.map((d: { notificationId: string }) => d.notificationId));

    // Create dismissals for notifications not yet dismissed
    const newDismissals = notifications
      .filter((n: { id: string }) => !existingIds.has(n.id))
      .map((n: { id: string }) => ({
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
      byType: byType.map((g: { type: string; _count: number }) => ({ type: g.type, count: g._count })),
      byPriority: byPriority.map((g: { priority: string; _count: number }) => ({ priority: g.priority, count: g._count })),
    };
  }

  async createPlanLimitWarning(tenantId: string, planNombre: string, limitType: string, usage: number, max: number) {
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
      type: 'PLAN_LIMIT_WARNING' as any,
      priority: percentage >= 90 ? 'HIGH' as any : 'MEDIUM' as any,
      target: 'SPECIFIC_TENANT' as any,
      targetTenantId: tenantId,
      isDismissable: true,
      showOnce: true,
      actionUrl: '/settings/plan',
      actionLabel: 'Ver planes',
    });
  }
}
