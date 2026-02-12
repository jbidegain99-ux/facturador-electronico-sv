import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { QuoteEmailService } from './quote-email.service';

@Injectable()
export class QuotesCronService {
  private readonly logger = new Logger(QuotesCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: QuoteEmailService,
  ) {}

  /** Daily at 6 AM El Salvador — expire sent quotes past validUntil */
  @Cron('0 6 * * *', { timeZone: 'America/El_Salvador' })
  async handleExpiredQuotes(): Promise<void> {
    this.logger.log('Running quote expiration check...');

    try {
      const now = new Date();
      const expiredQuotes = await this.prisma.quote.findMany({
        where: {
          status: 'SENT',
          validUntil: { lt: now },
        },
      });

      for (const quote of expiredQuotes) {
        await this.prisma.quote.update({
          where: { id: quote.id },
          data: { status: 'EXPIRED' },
        });

        await this.prisma.quoteStatusHistory.create({
          data: {
            quoteId: quote.id,
            fromStatus: 'SENT',
            toStatus: 'EXPIRED',
            actorType: 'SYSTEM',
            reason: 'Quote expired automatically',
          },
        });
      }

      this.logger.log(`Expired ${expiredQuotes.length} quotes`);
    } catch (err) {
      this.logger.error('Failed to expire quotes:', err);
    }
  }

  /** Daily at 9 AM El Salvador — send reminders for quotes near expiry */
  @Cron('0 9 * * *', { timeZone: 'America/El_Salvador' })
  async sendReminders(): Promise<void> {
    this.logger.log('Running quote reminder check...');

    try {
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      const quotesNearExpiry = await this.prisma.quote.findMany({
        where: {
          status: 'SENT',
          validUntil: { lte: threeDaysFromNow, gt: new Date() },
          remindersSent: { lt: 2 },
          clienteEmail: { not: null },
        },
      });

      let sent = 0;
      for (const quote of quotesNearExpiry) {
        const success = await this.emailService.sendReminder(quote);
        if (success) {
          await this.prisma.quote.update({
            where: { id: quote.id },
            data: {
              remindersSent: (quote.remindersSent ?? 0) + 1,
              lastReminderAt: new Date(),
            },
          });
          sent++;
        }
      }

      this.logger.log(
        `Sent reminders for ${sent} of ${quotesNearExpiry.length} quotes`,
      );
    } catch (err) {
      this.logger.error('Failed to send quote reminders:', err);
    }
  }
}
