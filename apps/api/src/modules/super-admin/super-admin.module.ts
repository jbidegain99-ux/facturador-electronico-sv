import { Module } from '@nestjs/common';
import { SuperAdminController, SuperAdminBootstrapController } from './super-admin.controller';
import { SuperAdminService } from './super-admin.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SuperAdminBootstrapController, SuperAdminController],
  providers: [SuperAdminService],
  exports: [SuperAdminService],
})
export class SuperAdminModule {}
