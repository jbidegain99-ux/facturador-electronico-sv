import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { RequestStatus, MessageSender, EmailConfigRequest } from '../types/email.types';
import {
  CreateEmailAssistanceRequestDto,
  UpdateEmailAssistanceRequestDto,
  AddMessageDto,
} from '../dto';

@Injectable()
export class EmailAssistanceService {
  private readonly logger = new Logger(EmailAssistanceService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create an assistance request from a tenant
   */
  async createRequest(
    tenantId: string,
    dto: CreateEmailAssistanceRequestDto,
  ): Promise<EmailConfigRequest> {
    const request = await this.prisma.emailConfigRequest.create({
      data: {
        tenantId,
        requestType: dto.requestType,
        desiredProvider: dto.desiredProvider,
        currentProvider: dto.currentProvider,
        accountEmail: dto.accountEmail,
        additionalNotes: dto.additionalNotes,
        status: RequestStatus.PENDING,
      },
      include: {
        tenant: true,
        messages: true,
      },
    });

    // Add initial system message
    await this.prisma.emailConfigMessage.create({
      data: {
        requestId: request.id,
        senderType: MessageSender.SYSTEM,
        message:
          'Su solicitud ha sido recibida. Un miembro del equipo de Republicode se pondrá en contacto pronto.',
      },
    });

    this.logger.log(
      `Assistance request created for tenant ${tenantId}: ${dto.requestType}`,
    );

    return request;
  }

  /**
   * Get all requests for a tenant
   */
  async getTenantRequests(tenantId: string) {
    return this.prisma.emailConfigRequest.findMany({
      where: { tenantId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a specific request
   */
  async getRequest(requestId: string, tenantId?: string) {
    const request = await this.prisma.emailConfigRequest.findUnique({
      where: { id: requestId },
      include: {
        tenant: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Assistance request not found');
    }

    // If tenantId provided, verify ownership
    if (tenantId && request.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied to this request');
    }

    return request;
  }

  /**
   * Get all pending requests (for admin)
   */
  async getAllRequests(status?: RequestStatus) {
    const where = status ? { status } : {};

    return this.prisma.emailConfigRequest.findMany({
      where,
      include: {
        tenant: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update request status (admin only)
   */
  async updateRequest(
    requestId: string,
    dto: UpdateEmailAssistanceRequestDto,
  ): Promise<EmailConfigRequest> {
    const request = await this.prisma.emailConfigRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Assistance request not found');
    }

    const updateData: Record<string, unknown> = {};

    if (dto.status) {
      updateData.status = dto.status;

      if (dto.status === RequestStatus.COMPLETED) {
        updateData.completedAt = new Date();
      }
    }

    if (dto.assignedTo !== undefined) {
      updateData.assignedTo = dto.assignedTo;
    }

    return this.prisma.emailConfigRequest.update({
      where: { id: requestId },
      data: updateData,
      include: {
        tenant: true,
        messages: true,
      },
    });
  }

  /**
   * Add a message to a request
   */
  async addMessage(
    requestId: string,
    senderType: MessageSender,
    senderId: string | undefined,
    dto: AddMessageDto,
  ) {
    const request = await this.prisma.emailConfigRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Assistance request not found');
    }

    const message = await this.prisma.emailConfigMessage.create({
      data: {
        requestId,
        senderType,
        senderId,
        message: dto.message,
        attachments: dto.attachments ? JSON.stringify(dto.attachments) : null,
      },
    });

    // If tenant is responding and status is WAITING_CLIENT, update to IN_PROGRESS
    if (
      senderType === MessageSender.TENANT &&
      request.status === RequestStatus.WAITING_CLIENT
    ) {
      await this.prisma.emailConfigRequest.update({
        where: { id: requestId },
        data: { status: RequestStatus.IN_PROGRESS },
      });
    }

    // If Republicode is responding and status is PENDING, update to IN_PROGRESS
    if (
      senderType === MessageSender.REPUBLICODE &&
      request.status === RequestStatus.PENDING
    ) {
      await this.prisma.emailConfigRequest.update({
        where: { id: requestId },
        data: { status: RequestStatus.IN_PROGRESS },
      });
    }

    return message;
  }

  /**
   * Get request statistics (for admin dashboard)
   */
  async getRequestStats() {
    const [pending, inProgress, waitingClient, completed, cancelled] =
      await Promise.all([
        this.prisma.emailConfigRequest.count({
          where: { status: RequestStatus.PENDING },
        }),
        this.prisma.emailConfigRequest.count({
          where: { status: RequestStatus.IN_PROGRESS },
        }),
        this.prisma.emailConfigRequest.count({
          where: { status: RequestStatus.WAITING_CLIENT },
        }),
        this.prisma.emailConfigRequest.count({
          where: { status: RequestStatus.COMPLETED },
        }),
        this.prisma.emailConfigRequest.count({
          where: { status: RequestStatus.CANCELLED },
        }),
      ]);

    return {
      pending,
      inProgress,
      waitingClient,
      completed,
      cancelled,
      total: pending + inProgress + waitingClient + completed + cancelled,
    };
  }
}
