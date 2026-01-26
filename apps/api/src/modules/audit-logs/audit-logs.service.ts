import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAuditLogDto, AuditLogFilterDto, AuditAction, AuditModule } from './dto';

interface LogOptions {
  userId?: string;
  userEmail?: string;
  userName?: string;
  userRole?: string;
  tenantId?: string;
  tenantNombre?: string;
  action: AuditAction;
  module: AuditModule;
  description: string;
  entityType?: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  requestPath?: string;
  requestMethod?: string;
  success?: boolean;
  errorMessage?: string;
}

@Injectable()
export class AuditLogsService {
  constructor(private prisma: PrismaService) {}

  async log(options: LogOptions) {
    return this.prisma.auditLog.create({
      data: {
        userId: options.userId,
        userEmail: options.userEmail,
        userName: options.userName,
        userRole: options.userRole,
        tenantId: options.tenantId,
        tenantNombre: options.tenantNombre,
        action: options.action,
        module: options.module,
        description: options.description,
        entityType: options.entityType,
        entityId: options.entityId,
        oldValue: options.oldValue ? JSON.stringify(options.oldValue) : null,
        newValue: options.newValue ? JSON.stringify(options.newValue) : null,
        metadata: options.metadata ? JSON.stringify(options.metadata) : null,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        requestPath: options.requestPath,
        requestMethod: options.requestMethod,
        success: options.success ?? true,
        errorMessage: options.errorMessage,
      },
    });
  }

  async findAll(
    filters: AuditLogFilterDto,
    page = 1,
    limit = 50,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.tenantId) where.tenantId = filters.tenantId;
    if (filters.action) where.action = filters.action;
    if (filters.module) where.module = filters.module;
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.entityId) where.entityId = filters.entityId;
    if (filters.success !== undefined) where.success = filters.success;

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    if (filters.search) {
      where.OR = [
        { description: { contains: filters.search } },
        { userEmail: { contains: filters.search } },
        { userName: { contains: filters.search } },
        { tenantNombre: { contains: filters.search } },
        { entityType: { contains: filters.search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    return this.prisma.auditLog.findUnique({
      where: { id },
    });
  }

  async getStats(tenantId?: string, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const where: any = {
      createdAt: { gte: startDate },
    };

    if (tenantId) {
      where.tenantId = tenantId;
    }

    const [
      total,
      byAction,
      byModule,
      bySuccess,
      recentActivity,
    ] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: true,
        orderBy: { _count: { action: 'desc' } },
        take: 10,
      }),
      this.prisma.auditLog.groupBy({
        by: ['module'],
        where,
        _count: true,
        orderBy: { _count: { module: 'desc' } },
      }),
      this.prisma.auditLog.groupBy({
        by: ['success'],
        where,
        _count: true,
      }),
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          action: true,
          module: true,
          description: true,
          userName: true,
          tenantNombre: true,
          success: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      total,
      byAction: byAction.map((g) => ({ action: g.action, count: g._count })),
      byModule: byModule.map((g) => ({ module: g.module, count: g._count })),
      successRate: bySuccess.find((g) => g.success)?._count ?? 0,
      failureRate: bySuccess.find((g) => !g.success)?._count ?? 0,
      recentActivity,
    };
  }

  async getActivityTimeline(tenantId?: string, days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const where: any = {
      createdAt: { gte: startDate },
    };

    if (tenantId) {
      where.tenantId = tenantId;
    }

    const logs = await this.prisma.auditLog.findMany({
      where,
      select: {
        createdAt: true,
        action: true,
      },
    });

    // Group by day
    const timeline: Record<string, number> = {};
    for (let i = 0; i <= days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      timeline[key] = 0;
    }

    for (const log of logs) {
      const key = log.createdAt.toISOString().split('T')[0];
      if (timeline[key] !== undefined) {
        timeline[key]++;
      }
    }

    return Object.entries(timeline)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async getTenantActivity(tenantId: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getUserActivity(userId: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async cleanOldLogs(daysToKeep = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    return { deleted: result.count };
  }
}
