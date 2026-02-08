import { Module } from '@nestjs/common';
import { MigrationController } from './migration.controller';
import { MigrationService } from './migration.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MigrationController],
  providers: [MigrationService],
  exports: [MigrationService],
})
export class MigrationModule {}
