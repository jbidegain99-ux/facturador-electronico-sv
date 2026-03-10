import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { BlobStorageService } from './blob-storage.service';
import { PlansModule } from '../plans/plans.module';

@Module({
  imports: [ConfigModule, PlansModule],
  controllers: [TenantsController],
  providers: [TenantsService, BlobStorageService],
  exports: [TenantsService, BlobStorageService],
})
export class TenantsModule {}
