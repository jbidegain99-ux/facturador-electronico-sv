import { Module } from '@nestjs/common';
import { NotificationsAdminController, NotificationsUserController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationsAdminController, NotificationsUserController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
