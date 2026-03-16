import { Module } from '@nestjs/common';
import { SuperAdminController, SuperAdminBootstrapController } from './super-admin.controller';
import { SuperAdminService } from './super-admin.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { DteModule } from '../dte/dte.module';

@Module({
  imports: [PrismaModule, DteModule],
  controllers: [SuperAdminBootstrapController, SuperAdminController],
  providers: [SuperAdminService],
  exports: [SuperAdminService],
})
export class SuperAdminModule {}
