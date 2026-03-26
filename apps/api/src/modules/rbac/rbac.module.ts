import { Module } from '@nestjs/common';
import { RbacService } from './services/rbac.service';
import { RbacManagementService } from './services/rbac-management.service';
import { RbacGuard } from './guards/rbac.guard';
import { TenantGuard } from './guards/tenant.guard';
import { RbacController } from './rbac.controller';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [AuditLogsModule],
  controllers: [RbacController],
  providers: [RbacService, RbacManagementService, RbacGuard, TenantGuard],
  exports: [RbacService, RbacManagementService, RbacGuard, TenantGuard],
})
export class RbacModule {}
