import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SupportSlaCronService {
  private readonly logger = new Logger(SupportSlaCronService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Check SLA status for open tickets every 15 minutes.
   * Logs warnings for AT_RISK and OVERDUE tickets.
   */
  @Cron('0 */15 * * * *')
  async checkSLACompliance() {
    const now = new Date();

    // Find open tickets with SLA deadlines
    const openTickets = await this.prisma.supportTicket.findMany({
      where: {
        status: { notIn: ['RESOLVED', 'CLOSED'] },
        slaDeadline: { not: null },
      },
      select: {
        id: true,
        ticketNumber: true,
        slaDeadline: true,
        resolutionDeadline: true,
        respondedAt: true,
        resolvedAt: true,
        createdAt: true,
        status: true,
        priority: true,
        assignedToId: true,
        tenantId: true,
        planAtCreation: true,
      },
    });

    if (openTickets.length === 0) return;

    let atRiskCount = 0;
    let overdueResponseCount = 0;
    let overdueResolutionCount = 0;

    for (const ticket of openTickets) {
      // Check first-response SLA
      if (ticket.slaDeadline && !ticket.respondedAt) {
        const deadline = new Date(ticket.slaDeadline);
        const totalTime = deadline.getTime() - ticket.createdAt.getTime();
        const timeRemaining = deadline.getTime() - now.getTime();

        if (timeRemaining <= 0) {
          overdueResponseCount++;
          this.logger.warn(
            `SLA OVERDUE (response): Ticket ${ticket.ticketNumber} [${ticket.priority}] ` +
            `deadline was ${deadline.toISOString()}, plan: ${ticket.planAtCreation ?? 'unknown'}`,
          );
        } else if (totalTime > 0 && (timeRemaining / totalTime) < 0.25) {
          atRiskCount++;
          this.logger.warn(
            `SLA AT_RISK (response): Ticket ${ticket.ticketNumber} [${ticket.priority}] ` +
            `${Math.round(timeRemaining / (60 * 60 * 1000))}h remaining`,
          );
        }
      }

      // Check resolution SLA
      if (ticket.resolutionDeadline && !ticket.resolvedAt) {
        const resDeadline = new Date(ticket.resolutionDeadline);
        const timeRemaining = resDeadline.getTime() - now.getTime();

        if (timeRemaining <= 0) {
          overdueResolutionCount++;
          this.logger.warn(
            `SLA OVERDUE (resolution): Ticket ${ticket.ticketNumber} [${ticket.priority}] ` +
            `deadline was ${resDeadline.toISOString()}`,
          );
        }
      }
    }

    if (atRiskCount > 0 || overdueResponseCount > 0 || overdueResolutionCount > 0) {
      this.logger.log(
        `SLA Check: ${openTickets.length} open tickets, ` +
        `${atRiskCount} at risk, ${overdueResponseCount} overdue (response), ` +
        `${overdueResolutionCount} overdue (resolution)`,
      );
    }
  }
}
