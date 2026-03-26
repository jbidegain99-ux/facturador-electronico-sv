import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { DefaultEmailService } from '../email-config/services/default-email.service';

interface PendingNotificationRecord {
  id: string;
  tenantId: string;
  type: string;
  referenceId: string | null;
  recipientEmail: string;
  emailSubject: string;
  emailHtml: string;
  emailText: string | null;
  status: string;
  attemptCount: number;
  maxAttempts: number;
  nextRetryAt: Date;
  errorMessage: string | null;
  createdAt: Date;
  sentAt: Date | null;
}

@Injectable()
export class NotificationOutboxCronService {
  private readonly logger = new Logger(NotificationOutboxCronService.name);
  private processing = false;

  constructor(
    private prisma: PrismaService,
    private defaultEmailService: DefaultEmailService,
  ) {}

  /**
   * Process pending notifications every 60 seconds.
   * Picks up PENDING (immediate send failed) and FAILED (retry eligible) notifications.
   */
  @Cron('0 * * * * *', { name: 'processNotificationOutbox' })
  async processPendingNotifications(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    try {
      const notifications: PendingNotificationRecord[] =
        await this.prisma.pendingNotification.findMany({
          where: {
            OR: [
              { status: 'PENDING', nextRetryAt: { lte: new Date() } },
              { status: 'FAILED', nextRetryAt: { lte: new Date() } },
            ],
          },
          take: 20,
          orderBy: { createdAt: 'asc' },
        });

      if (notifications.length === 0) return;

      this.logger.log(
        `Processing ${notifications.length} pending notifications`,
      );

      for (const notification of notifications) {
        await this.processNotification(notification);
      }
    } catch (error) {
      this.logger.error(
        `Error in notification outbox cron: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      this.processing = false;
    }
  }

  private async processNotification(
    notification: PendingNotificationRecord,
  ): Promise<void> {
    try {
      const result = await this.defaultEmailService.sendEmail(
        notification.tenantId,
        {
          to: notification.recipientEmail,
          subject: notification.emailSubject,
          html: notification.emailHtml,
          text: notification.emailText ?? undefined,
        },
      );

      if (result.success) {
        await this.prisma.pendingNotification.update({
          where: { id: notification.id },
          data: { status: 'SENT', sentAt: new Date(), errorMessage: null },
        });
        this.logger.log(
          `Notification ${notification.id} (${notification.type}) sent successfully`,
        );
      } else {
        await this.handleFailure(
          notification,
          result.errorMessage ?? 'Unknown error',
        );
      }
    } catch (err) {
      await this.handleFailure(
        notification,
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  private async handleFailure(
    notification: PendingNotificationRecord,
    errorMessage: string,
  ): Promise<void> {
    const newAttemptCount = notification.attemptCount + 1;

    if (newAttemptCount >= notification.maxAttempts) {
      await this.prisma.pendingNotification.update({
        where: { id: notification.id },
        data: {
          status: 'DEAD_LETTER',
          attemptCount: newAttemptCount,
          errorMessage,
        },
      });
      this.logger.error(
        `Notification ${notification.id} dead-lettered after ${newAttemptCount} attempts: ${errorMessage}`,
      );
    } else {
      // Exponential backoff: 60s, 120s, 240s
      const delayMs = 60_000 * Math.pow(2, newAttemptCount - 1);
      const nextRetryAt = new Date(Date.now() + delayMs);

      await this.prisma.pendingNotification.update({
        where: { id: notification.id },
        data: {
          status: 'FAILED',
          attemptCount: newAttemptCount,
          errorMessage,
          nextRetryAt,
        },
      });
      this.logger.warn(
        `Notification ${notification.id} failed, retry ${newAttemptCount}/${notification.maxAttempts} in ${delayMs / 1000}s`,
      );
    }
  }
}
