import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RbacService } from './services/rbac.service';
import { RbacManagementService } from './services/rbac-management.service';
import { RbacGuard } from './guards/rbac.guard';
import { TenantGuard } from './guards/tenant.guard';
import { RbacController } from './rbac.controller';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { EmailConfigModule } from '../email-config/email-config.module';

@Module({
  imports: [AuditLogsModule, EmailConfigModule, ConfigModule],
  controllers: [RbacController],
  providers: [RbacService, RbacManagementService, RbacGuard, TenantGuard],
  exports: [RbacService, RbacManagementService, RbacGuard, TenantGuard],
})
export class RbacModule {}
