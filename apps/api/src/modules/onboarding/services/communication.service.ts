import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CommunicationDirection, CommunicationType } from '../types/onboarding.types';
import { AddCommunicationDto } from '../dto';

@Injectable()
export class OnboardingCommunicationService {
  constructor(private readonly prisma: PrismaService) {}

  // =========================================================================
  // GET COMMUNICATIONS
  // =========================================================================

  async getCommunications(tenantId: string, page = 1, limit = 20) {
    const onboarding = await this.prisma.tenantOnboarding.findUnique({
      where: { tenantId },
    });

    if (!onboarding) {
      throw new NotFoundException('Onboarding no encontrado');
    }

    const skip = (page - 1) * limit;

    const [communications, total, unreadCount] = await Promise.all([
      this.prisma.onboardingCommunication.findMany({
        where: { onboardingId: onboarding.id },
        orderBy: { sentAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.onboardingCommunication.count({
        where: { onboardingId: onboarding.id },
      }),
      this.prisma.onboardingCommunication.count({
        where: {
          onboardingId: onboarding.id,
          direction: 'INCOMING',
          readAt: null,
        },
      }),
    ]);

    return {
      communications: communications.map((c) => ({
        id: c.id,
        type: c.type,
        direction: c.direction,
        subject: c.subject,
        content: c.content,
        attachments: c.attachments ? JSON.parse(c.attachments) : [],
        relatedStep: c.relatedStep,
        sentBy: c.sentBy,
        sentAt: c.sentAt,
        readAt: c.readAt,
      })),
      total,
      unreadCount,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // =========================================================================
  // ADD COMMUNICATION (CLIENT)
  // =========================================================================

  async addClientCommunication(
    tenantId: string,
    dto: AddCommunicationDto,
    userId: string,
  ) {
    const onboarding = await this.prisma.tenantOnboarding.findUnique({
      where: { tenantId },
    });

    if (!onboarding) {
      throw new NotFoundException('Onboarding no encontrado');
    }

    const communication = await this.prisma.onboardingCommunication.create({
      data: {
        onboardingId: onboarding.id,
        type: dto.type,
        direction: 'OUTGOING',
        subject: dto.subject,
        content: dto.content,
        attachments: dto.attachments ? JSON.stringify(dto.attachments) : null,
        relatedStep: dto.relatedStep,
        sentBy: userId,
      },
    });

    return {
      id: communication.id,
      message: 'Mensaje enviado correctamente',
    };
  }

  // =========================================================================
  // ADD COMMUNICATION (ADMIN)
  // =========================================================================

  async addAdminCommunication(
    onboardingId: string,
    dto: AddCommunicationDto,
    userId: string,
  ) {
    const onboarding = await this.prisma.tenantOnboarding.findUnique({
      where: { id: onboardingId },
    });

    if (!onboarding) {
      throw new NotFoundException('Onboarding no encontrado');
    }

    const communication = await this.prisma.onboardingCommunication.create({
      data: {
        onboardingId,
        type: dto.type,
        direction: 'INCOMING',
        subject: dto.subject,
        content: dto.content,
        attachments: dto.attachments ? JSON.stringify(dto.attachments) : null,
        relatedStep: dto.relatedStep,
        sentBy: userId,
      },
    });

    return {
      id: communication.id,
      message: 'Mensaje enviado al tenant correctamente',
    };
  }

  // =========================================================================
  // MARK AS READ
  // =========================================================================

  async markAsRead(tenantId: string, communicationId: string) {
    const onboarding = await this.prisma.tenantOnboarding.findUnique({
      where: { tenantId },
    });

    if (!onboarding) {
      throw new NotFoundException('Onboarding no encontrado');
    }

    const communication = await this.prisma.onboardingCommunication.findFirst({
      where: {
        id: communicationId,
        onboardingId: onboarding.id,
      },
    });

    if (!communication) {
      throw new NotFoundException('Comunicación no encontrada');
    }

    await this.prisma.onboardingCommunication.update({
      where: { id: communicationId },
      data: { readAt: new Date() },
    });

    return { success: true };
  }

  async markAllAsRead(tenantId: string) {
    const onboarding = await this.prisma.tenantOnboarding.findUnique({
      where: { tenantId },
    });

    if (!onboarding) {
      throw new NotFoundException('Onboarding no encontrado');
    }

    await this.prisma.onboardingCommunication.updateMany({
      where: {
        onboardingId: onboarding.id,
        direction: 'INCOMING',
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    return { success: true };
  }

  // =========================================================================
  // ADMIN: GET ALL COMMUNICATIONS
  // =========================================================================

  async getAllCommunications(page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [communications, total] = await Promise.all([
      this.prisma.onboardingCommunication.findMany({
        include: {
          onboarding: {
            select: {
              tenantId: true,
              razonSocial: true,
              tenant: {
                select: { nombre: true },
              },
            },
          },
        },
        orderBy: { sentAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.onboardingCommunication.count(),
    ]);

    return {
      communications: communications.map((c) => ({
        id: c.id,
        tenantId: c.onboarding.tenantId,
        tenantName: c.onboarding.tenant.nombre || c.onboarding.razonSocial,
        type: c.type,
        direction: c.direction,
        subject: c.subject,
        content: c.content,
        attachments: c.attachments ? JSON.parse(c.attachments) : [],
        relatedStep: c.relatedStep,
        sentBy: c.sentBy,
        sentAt: c.sentAt,
        readAt: c.readAt,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
