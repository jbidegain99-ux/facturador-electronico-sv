import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { DefaultEmailService } from '../email-config/services/default-email.service';
import {
  ticketCreatedTemplate,
  ticketReplyTemplate,
  ticketStatusChangedTemplate,
  ticketNewAdminTemplate,
} from '../email-config/templates';
import { CreateTicketDto, TicketPriority } from './dto/create-ticket.dto';
import { UpdateTicketDto, TicketStatus } from './dto/update-ticket.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { PlanSupportService } from '../plans/services/plan-support.service';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(
    private prisma: PrismaService,
    private defaultEmailService: DefaultEmailService,
    private configService: ConfigService,
    private planSupportService: PlanSupportService,
  ) {}

  // ============ TICKET NUMBER GENERATION ============
  private async generateTicketNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    // Count tickets created today to generate sequence
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const todayTickets = await this.prisma.supportTicket.count({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    const sequence = String(todayTickets + 1).padStart(4, '0');
    return `TKT-${dateStr}-${sequence}`;
  }

  // ============ USER ENDPOINTS ============
  async createTicket(
    tenantId: string,
    requesterId: string,
    data: CreateTicketDto,
  ) {
    const ticketNumber = await this.generateTicketNumber();

    // Calculate SLA deadlines based on plan
    let slaResponseHours: number | null = null;
    let slaDeadline: Date | null = null;
    let resolutionDeadline: Date | null = null;
    let planAtCreation: string | null = null;
    try {
      const responseHours = await this.planSupportService.getTicketResponseTime(tenantId);
      const resolutionHours = await this.planSupportService.getResolutionSLA(tenantId);
      const planPriority = await this.planSupportService.getTicketPriority(tenantId);
      planAtCreation = planPriority; // Store plan priority as context

      // Get actual plan code for planAtCreation
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { plan: true },
      });
      planAtCreation = tenant?.plan ?? null;

      if (responseHours > 0) {
        slaResponseHours = responseHours;
        slaDeadline = new Date(Date.now() + responseHours * 60 * 60 * 1000);
      }
      if (resolutionHours > 0) {
        resolutionDeadline = new Date(Date.now() + resolutionHours * 60 * 60 * 1000);
      }
    } catch (err) {
      this.logger.warn(`Failed to calculate SLA for tenant ${tenantId}: ${(err as Error).message}`);
    }

    const ticket = await this.prisma.supportTicket.create({
      data: {
        ticketNumber,
        tenantId,
        requesterId,
        type: data.type,
        subject: data.subject,
        description: data.description,
        metadata: data.metadata,
        priority: data.priority || TicketPriority.MEDIUM,
        status: TicketStatus.PENDING,
        slaResponseHours,
        slaDeadline,
        resolutionDeadline,
        planAtCreation,
      },
      include: {
        tenant: { select: { nombre: true } },
        requester: { select: { nombre: true, email: true } },
      },
    });

    // Create activity record
    await this.prisma.ticketActivity.create({
      data: {
        ticketId: ticket.id,
        actorId: requesterId,
        action: 'CREATED',
        newValue: `Ticket creado: ${data.subject}`,
      },
    });

    // Send confirmation email to requester (outbox + immediate send)
    const createdEmail = ticketCreatedTemplate({
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      type: ticket.type,
      priority: ticket.priority,
      nombreUsuario: ticket.requester.nombre,
    });

    await this.sendNotificationWithOutbox(
      tenantId,
      'TICKET_CREATED',
      ticket.id,
      ticket.requester.email,
      `Ticket #${ticket.ticketNumber} creado - ${ticket.subject}`,
      createdEmail.html,
      createdEmail.text,
    );

    // Notify super admins (outbox + immediate send)
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', '');
    const adminEmailData = ticketNewAdminTemplate({
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      type: ticket.type,
      priority: ticket.priority,
      tenantName: ticket.tenant.nombre,
      requesterName: ticket.requester.nombre,
      adminLink: `${frontendUrl}/admin/support/${ticket.id}`,
    });

    try {
      const admins = await this.getSuperAdmins();
      for (const admin of admins) {
        await this.sendNotificationWithOutbox(
          'system',
          'TICKET_ADMIN_NOTIFY',
          ticket.id,
          admin.email,
          `Nuevo ticket #${ticket.ticketNumber} - ${ticket.subject}`,
          adminEmailData.html,
          adminEmailData.text,
        );
      }
    } catch (err) {
      this.logger.error(`Failed to fetch super admins for ticket notification: ${(err as Error).message}`);
    }

    return ticket;
  }

  async getUserTickets(tenantId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [tickets, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where: { tenantId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          requester: { select: { nombre: true, email: true } },
          assignedTo: { select: { nombre: true } },
          _count: { select: { comments: true } },
        },
      }),
      this.prisma.supportTicket.count({ where: { tenantId } }),
    ]);

    return {
      data: tickets,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserTicketById(tenantId: string, ticketId: string, userId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        tenant: { select: { nombre: true } },
        requester: { select: { id: true, nombre: true, email: true } },
        assignedTo: { select: { nombre: true, email: true } },
        comments: {
          where: { isInternal: false }, // Users don't see internal comments
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: { nombre: true, email: true } },
          },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            actor: { select: { nombre: true } },
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket no encontrado');
    }

    if (ticket.tenantId !== tenantId) {
      throw new ForbiddenException('No tienes acceso a este ticket');
    }

    return ticket;
  }

  async addUserComment(
    tenantId: string,
    ticketId: string,
    userId: string,
    data: CreateCommentDto,
  ) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket no encontrado');
    }

    if (ticket.tenantId !== tenantId) {
      throw new ForbiddenException('No tienes acceso a este ticket');
    }

    const comment = await this.prisma.ticketComment.create({
      data: {
        ticketId,
        authorId: userId,
        content: data.content,
        isInternal: false, // Users can't create internal comments
      },
      include: {
        author: { select: { nombre: true, email: true } },
      },
    });

    // Create activity
    await this.prisma.ticketActivity.create({
      data: {
        ticketId,
        actorId: userId,
        action: 'COMMENT_ADDED',
        newValue: 'Comentario agregado por usuario',
      },
    });

    return comment;
  }

  // ============ ADMIN ENDPOINTS ============
  async getAllTickets(params: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    assignedToId?: string;
    tenantId?: string;
    type?: string;
    search?: string;
  }) {
    const { page = 1, limit = 20, status, priority, assignedToId, tenantId, type, search } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.SupportTicketWhereInput = {};

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assignedToId) where.assignedToId = assignedToId;
    if (tenantId) where.tenantId = tenantId;
    if (type) where.type = type;

    if (search) {
      where.OR = [
        { ticketNumber: { contains: search } },
        { subject: { contains: search } },
        { tenant: { nombre: { contains: search } } },
      ];
    }

    const [tickets, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          tenant: { select: { id: true, nombre: true, nit: true } },
          requester: { select: { nombre: true, email: true } },
          assignedTo: { select: { id: true, nombre: true } },
          _count: { select: { comments: true } },
        },
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return {
      data: tickets,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTicketStats() {
    const [
      pending,
      assigned,
      inProgress,
      waitingCustomer,
      resolved,
      closed,
      byPriority,
      byType,
    ] = await Promise.all([
      this.prisma.supportTicket.count({ where: { status: 'PENDING' } }),
      this.prisma.supportTicket.count({ where: { status: 'ASSIGNED' } }),
      this.prisma.supportTicket.count({ where: { status: 'IN_PROGRESS' } }),
      this.prisma.supportTicket.count({ where: { status: 'WAITING_CUSTOMER' } }),
      this.prisma.supportTicket.count({ where: { status: 'RESOLVED' } }),
      this.prisma.supportTicket.count({ where: { status: 'CLOSED' } }),
      this.prisma.supportTicket.groupBy({
        by: ['priority'],
        _count: { priority: true },
      }),
      this.prisma.supportTicket.groupBy({
        by: ['type'],
        _count: { type: true },
      }),
    ]);

    // Calculate average resolution time (for resolved tickets in the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const resolvedTickets = await this.prisma.supportTicket.findMany({
      where: {
        status: { in: ['RESOLVED', 'CLOSED'] },
        resolvedAt: { gte: thirtyDaysAgo },
      },
      select: {
        createdAt: true,
        resolvedAt: true,
      },
    });

    let avgResolutionHours = 0;
    if (resolvedTickets.length > 0) {
      const totalHours = resolvedTickets.reduce((acc, t) => {
        if (t.resolvedAt) {
          const hours = (t.resolvedAt.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60);
          return acc + hours;
        }
        return acc;
      }, 0);
      avgResolutionHours = Math.round(totalHours / resolvedTickets.length);
    }

    return {
      pending,
      assigned,
      inProgress,
      waitingCustomer,
      resolved,
      closed,
      total: pending + assigned + inProgress + waitingCustomer + resolved + closed,
      open: pending + assigned + inProgress + waitingCustomer,
      byPriority: byPriority.map((p) => ({ priority: p.priority, count: p._count.priority })),
      byType: byType.map((t) => ({ type: t.type, count: t._count.type })),
      avgResolutionHours,
    };
  }

  async getAdminTicketById(ticketId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        tenant: { select: { id: true, nombre: true, nit: true, correo: true } },
        requester: { select: { id: true, nombre: true, email: true } },
        assignedTo: { select: { id: true, nombre: true, email: true } },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: { id: true, nombre: true, email: true, rol: true } },
          },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          include: {
            actor: { select: { nombre: true, email: true } },
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket no encontrado');
    }

    return ticket;
  }

  async updateTicket(ticketId: string, adminId: string, data: UpdateTicketDto) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket no encontrado');
    }

    const updates: Prisma.SupportTicketUncheckedUpdateInput = {};
    const activities: Prisma.TicketActivityUncheckedCreateInput[] = [];

    // Track status change
    if (data.status && data.status !== ticket.status) {
      updates.status = data.status;
      activities.push({
        ticketId,
        actorId: adminId,
        action: 'STATUS_CHANGED',
        oldValue: ticket.status,
        newValue: data.status,
      });

      // Set resolvedAt if resolving
      if (data.status === TicketStatus.RESOLVED || data.status === TicketStatus.CLOSED) {
        updates.resolvedAt = new Date();
      }
    }

    // Track priority change
    if (data.priority && data.priority !== ticket.priority) {
      updates.priority = data.priority;
      activities.push({
        ticketId,
        actorId: adminId,
        action: 'PRIORITY_CHANGED',
        oldValue: ticket.priority,
        newValue: data.priority,
      });
    }

    // Track assignment change
    if (data.assignedToId !== undefined && data.assignedToId !== ticket.assignedToId) {
      updates.assignedToId = data.assignedToId || null;
      updates.assignedAt = data.assignedToId ? new Date() : null;

      if (data.assignedToId) {
        // Get the assignee name
        const assignee = await this.prisma.user.findUnique({
          where: { id: data.assignedToId },
          select: { nombre: true },
        });
        activities.push({
          ticketId,
          actorId: adminId,
          action: 'ASSIGNED',
          oldValue: ticket.assignedToId,
          newValue: assignee?.nombre || data.assignedToId,
        });
      }
    }

    // Track resolution
    if (data.resolution && data.resolution !== ticket.resolution) {
      updates.resolution = data.resolution;
      activities.push({
        ticketId,
        actorId: adminId,
        action: 'RESOLVED',
        newValue: 'Resolucion agregada',
      });
    }

    // Update ticket and create activities in transaction
    const [updatedTicket] = await this.prisma.$transaction([
      this.prisma.supportTicket.update({
        where: { id: ticketId },
        data: updates,
        include: {
          tenant: { select: { nombre: true } },
          requester: { select: { nombre: true, email: true } },
          assignedTo: { select: { nombre: true, email: true } },
        },
      }),
      ...activities.map((activity) =>
        this.prisma.ticketActivity.create({ data: activity })
      ),
    ]);

    // Send status change email if status was updated (outbox + immediate send)
    if (data.status && data.status !== ticket.status) {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL', '');
      const statusEmail = ticketStatusChangedTemplate({
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        oldStatus: ticket.status,
        newStatus: data.status,
        resolution: data.resolution || ticket.resolution,
        ticketLink: `${frontendUrl}/soporte/${ticketId}`,
      });

      await this.sendNotificationWithOutbox(
        ticket.tenantId,
        'TICKET_STATUS_CHANGED',
        ticket.id,
        updatedTicket.requester.email,
        `Ticket #${ticket.ticketNumber} actualizado - ${data.status}`,
        statusEmail.html,
        statusEmail.text,
      );
    }

    return updatedTicket;
  }

  async addAdminComment(ticketId: string, adminId: string, data: CreateCommentDto) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket no encontrado');
    }

    const comment = await this.prisma.ticketComment.create({
      data: {
        ticketId,
        authorId: adminId,
        content: data.content,
        isInternal: data.isInternal || false,
      },
      include: {
        author: { select: { nombre: true, email: true, rol: true } },
      },
    });

    // Set respondedAt on first public staff response (for SLA tracking)
    if (!data.isInternal && !ticket.respondedAt) {
      this.prisma.supportTicket
        .update({
          where: { id: ticketId },
          data: { respondedAt: new Date() },
        })
        .catch((err: Error) => {
          this.logger.error(`Failed to set respondedAt for ticket ${ticketId}: ${err.message}`);
        });
    }

    // Create activity
    await this.prisma.ticketActivity.create({
      data: {
        ticketId,
        actorId: adminId,
        action: 'COMMENT_ADDED',
        newValue: data.isInternal ? 'Nota interna agregada' : 'Respuesta agregada',
      },
    });

    // Send reply notification to requester for public comments (outbox + immediate send)
    if (!data.isInternal) {
      const ticketWithRequester = await this.prisma.supportTicket.findUnique({
        where: { id: ticketId },
        select: {
          id: true,
          ticketNumber: true,
          subject: true,
          tenantId: true,
          requester: { select: { email: true } },
        },
      });

      if (ticketWithRequester) {
        const frontendUrl = this.configService.get<string>('FRONTEND_URL', '');
        const replyEmail = ticketReplyTemplate({
          ticketNumber: ticketWithRequester.ticketNumber,
          subject: ticketWithRequester.subject,
          commentContent: data.content,
          authorName: comment.author.nombre,
          ticketLink: `${frontendUrl}/soporte/${ticketId}`,
        });

        await this.sendNotificationWithOutbox(
          ticketWithRequester.tenantId,
          'TICKET_REPLY',
          ticketWithRequester.id,
          ticketWithRequester.requester.email,
          `Respuesta en ticket #${ticketWithRequester.ticketNumber} - ${ticketWithRequester.subject}`,
          replyEmail.html,
          replyEmail.text,
        );
      }
    }

    return comment;
  }

  async getSuperAdmins() {
    return this.prisma.user.findMany({
      where: { rol: 'SUPER_ADMIN' },
      select: { id: true, nombre: true, email: true },
    });
  }

  async getTicketsByTenant(tenantId: string, limit = 10) {
    return this.prisma.supportTicket.findMany({
      where: { tenantId },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        requester: { select: { nombre: true } },
        assignedTo: { select: { nombre: true } },
      },
    });
  }

  // ============ NOTIFICATION OUTBOX ============

  /**
   * Creates a PendingNotification record and attempts immediate email send.
   * If the immediate send fails, the notification-outbox cron will retry.
   */
  private async sendNotificationWithOutbox(
    tenantId: string,
    type: string,
    referenceId: string,
    recipientEmail: string,
    emailSubject: string,
    emailHtml: string,
    emailText?: string,
  ): Promise<void> {
    const notification = await this.prisma.pendingNotification.create({
      data: {
        tenantId,
        type,
        referenceId,
        recipientEmail,
        emailSubject,
        emailHtml,
        emailText,
      },
    });

    const sendStart = Date.now();
    try {
      const result = await this.defaultEmailService.sendEmail(tenantId, {
        to: recipientEmail,
        subject: emailSubject,
        html: emailHtml,
        text: emailText,
      });

      const sendLatencyMs = Date.now() - sendStart;

      if (result.success) {
        await this.prisma.pendingNotification.update({
          where: { id: notification.id },
          data: { status: 'SENT', sentAt: new Date() },
        });
        this.logger.log(
          `Notification ${type} sent to ${recipientEmail} in ${sendLatencyMs}ms`,
        );
      } else {
        await this.prisma.pendingNotification.update({
          where: { id: notification.id },
          data: { errorMessage: result.errorMessage, attemptCount: 1 },
        });
        this.logger.error(
          `Immediate send failed for ${type} notification ${notification.id} (${sendLatencyMs}ms): ${result.errorMessage}`,
        );
      }
    } catch (err) {
      const sendLatencyMs = Date.now() - sendStart;
      const errorMessage = err instanceof Error ? err.message : String(err);
      await this.prisma.pendingNotification.update({
        where: { id: notification.id },
        data: { errorMessage, attemptCount: 1 },
      });
      this.logger.error(
        `Immediate send error for ${type} notification ${notification.id} (${sendLatencyMs}ms): ${errorMessage}`,
      );
    }
  }

  // ============ FILE ATTACHMENTS ============

  async addAttachment(
    ticketId: string,
    userId: string,
    tenantId: string | null,
    file: { fileName: string; fileUrl: string; fileSize: number; mimeType: string },
  ) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket no encontrado');
    }

    // Tenant users can only attach to their own tickets
    if (tenantId && ticket.tenantId !== tenantId) {
      throw new ForbiddenException('No tienes acceso a este ticket');
    }

    const attachment = await this.prisma.ticketAttachment.create({
      data: {
        ticketId,
        uploadedById: userId,
        fileName: file.fileName,
        fileUrl: file.fileUrl,
        fileSize: file.fileSize,
        mimeType: file.mimeType,
      },
    });

    await this.prisma.ticketActivity.create({
      data: {
        ticketId,
        actorId: userId,
        action: 'ATTACHMENT_ADDED',
        newValue: `Archivo adjunto: ${file.fileName}`,
      },
    });

    return attachment;
  }

  async getAttachments(ticketId: string, tenantId: string | null) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket no encontrado');
    }

    if (tenantId && ticket.tenantId !== tenantId) {
      throw new ForbiddenException('No tienes acceso a este ticket');
    }

    return this.prisma.ticketAttachment.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: { select: { nombre: true } },
      },
    });
  }

  async getAttachmentById(attachmentId: string, tenantId: string | null) {
    const attachment = await this.prisma.ticketAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        ticket: { select: { tenantId: true } },
      },
    });

    if (!attachment) {
      throw new NotFoundException('Archivo no encontrado');
    }

    if (tenantId && attachment.ticket.tenantId !== tenantId) {
      throw new ForbiddenException('No tienes acceso a este archivo');
    }

    return attachment;
  }
}
