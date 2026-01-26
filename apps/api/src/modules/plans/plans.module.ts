import { Module } from '@nestjs/common';
import { PlansAdminController, PlansController } from './plans.controller';
import { PlansService } from './plans.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PlansAdminController, PlansController],
  providers: [PlansService],
  exports: [PlansService],
})
export class PlansModule {}
