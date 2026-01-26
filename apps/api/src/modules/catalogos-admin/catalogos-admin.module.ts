import { Module } from '@nestjs/common';
import { CatalogosAdminController, CatalogosPublicController } from './catalogos-admin.controller';
import { CatalogosAdminService } from './catalogos-admin.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CatalogosAdminController, CatalogosPublicController],
  providers: [CatalogosAdminService],
  exports: [CatalogosAdminService],
})
export class CatalogosAdminModule {}
